import { spawn } from 'child_process'

import {
  cleanupOrphanedProcesses,
  killProcess,
  startProcessMonitoring,
  stopProcessMonitoring,
} from './process-monitor'

export interface CypressRunResult {
  success: boolean
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  specFiles: string[]
  output: string
  error?: string
  resourceUsage?: {
    maxMemoryMB: number
    avgCpu: number
  }
}

export const DEFAULT_CYPRESS_TIMEOUT = 10 * 60 * 1000

export async function runCypressTests(
  projectId?: string,
  timeout: number = DEFAULT_CYPRESS_TIMEOUT,
): Promise<CypressRunResult> {
  cleanupOrphanedProcesses()

  return new Promise((resolve) => {
    const startTime = Date.now()
    let output = ''
    let errorOutput = ''
    const resourceMetrics: Array<{ memory: number; cpu: number }> = []

    const args = ['run', '--headless', '--browser', 'chrome']

    if (projectId) {
      args.push('--config', `projectId=${projectId}`)
    }

    const cypressProcess = spawn('npx', ['cypress', ...args], {
      cwd: process.cwd(),
      env: { ...process.env },
      shell: true,
    })

    if (cypressProcess.pid) {
      startProcessMonitoring(cypressProcess, {
        maxMemoryMB: 2048,
        maxCpuPercent: 90,
        checkInterval: 5000,
      })

      const resourceCheckInterval = setInterval(() => {
        if (cypressProcess.pid) {
          const memInfo = process.memoryUsage()
          const cpuUsage = process.cpuUsage()
          resourceMetrics.push({
            memory: memInfo.heapUsed,
            cpu: (cpuUsage.user + cpuUsage.system) / 1000000,
          })
        }
      }, 5000)

      cypressProcess.on('exit', () => {
        if (cypressProcess.pid) {
          stopProcessMonitoring(cypressProcess.pid)
          clearInterval(resourceCheckInterval)
        }
      })
    }

    const timeoutId = setTimeout(() => {
      if (cypressProcess.pid) {
        killProcess(cypressProcess.pid, 'Test execution timeout')
      } else {
        cypressProcess.kill('SIGTERM')
      }
      resolve({
        success: false,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: Date.now() - startTime,
        specFiles: [],
        output: output || errorOutput,
        error: `Test execution timed out after ${timeout}ms`,
      })
    }, timeout)

    cypressProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      output += text
    })

    cypressProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      errorOutput += text
    })

    cypressProcess.on('error', (error: Error) => {
      clearTimeout(timeoutId)
      resolve({
        success: false,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: Date.now() - startTime,
        specFiles: [],
        output: output || errorOutput,
        error: `Failed to start Cypress: ${error.message}`,
      })
    })

    cypressProcess.on('close', (code: number | null) => {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const fullOutput = output || errorOutput

      let resourceUsage: CypressRunResult['resourceUsage'] | undefined
      if (resourceMetrics.length > 0) {
        const maxMemory = Math.max(...resourceMetrics.map((m) => m.memory))
        const avgCpu =
          resourceMetrics.reduce((sum, m) => sum + m.cpu, 0) /
          resourceMetrics.length

        resourceUsage = {
          maxMemoryMB: maxMemory / 1024 / 1024,
          avgCpu,
        }
      }

      const result = parseCypressOutput(
        fullOutput,
        code === 0,
        duration,
        resourceUsage,
      )

      resolve(result)
    })
  })
}

function parseCypressOutput(
  output: string,
  success: boolean,
  duration: number,
  resourceUsage?: CypressRunResult['resourceUsage'],
): CypressRunResult {
  let totalTests = 0
  let passed = 0
  let failed = 0
  let skipped = 0
  const specFiles: string[] = []

  const specFileRegex = /Running:\s+(.+\.cy\.[jt]sx?)/g
  let match
  while ((match = specFileRegex.exec(output)) !== null) {
    specFiles.push(match[1])
  }

  const passedMatch = output.match(/(\d+)\s+passing/i)
  if (passedMatch) {
    passed = parseInt(passedMatch[1], 10)
  }

  const failedMatch = output.match(/(\d+)\s+failing/i)
  if (failedMatch) {
    failed = parseInt(failedMatch[1], 10)
  }

  const skippedMatch = output.match(/(\d+)\s+pending/i)
  if (skippedMatch) {
    skipped = parseInt(skippedMatch[1], 10)
  }

  totalTests = passed + failed + skipped

  if (totalTests === 0 && output.includes('error')) {
    return {
      success: false,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration,
      specFiles,
      output,
      error: 'Cypress execution failed. Check output for details.',
    }
  }

  return {
    success: success && failed === 0,
    totalTests,
    passed,
    failed,
    skipped,
    duration,
    specFiles,
    output,
    resourceUsage,
  }
}
