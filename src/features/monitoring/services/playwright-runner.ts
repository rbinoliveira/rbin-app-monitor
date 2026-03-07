import { spawn } from 'child_process'

import {
  cleanupOrphanedProcesses,
  killProcess,
  startProcessMonitoring,
  stopProcessMonitoring,
} from './process-monitor'

export interface PlaywrightRunResult {
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

export const DEFAULT_PLAYWRIGHT_TIMEOUT = 10 * 60 * 1000

export async function runPlaywrightTests(
  timeout: number = DEFAULT_PLAYWRIGHT_TIMEOUT,
): Promise<PlaywrightRunResult> {
  cleanupOrphanedProcesses()

  return new Promise((resolve) => {
    const startTime = Date.now()
    let output = ''
    let errorOutput = ''
    const resourceMetrics: Array<{ memory: number; cpu: number }> = []

    const playwrightProcess = spawn(
      'npx',
      ['playwright', 'test', '--reporter=json'],
      {
        cwd: process.cwd(),
        env: { ...process.env },
        shell: true,
      },
    )

    if (playwrightProcess.pid) {
      startProcessMonitoring(playwrightProcess, {
        maxMemoryMB: 2048,
        maxCpuPercent: 90,
        checkInterval: 5000,
      })

      const resourceCheckInterval = setInterval(() => {
        if (playwrightProcess.pid) {
          const memInfo = process.memoryUsage()
          const cpuUsage = process.cpuUsage()
          resourceMetrics.push({
            memory: memInfo.heapUsed,
            cpu: (cpuUsage.user + cpuUsage.system) / 1000000,
          })
        }
      }, 5000)

      playwrightProcess.on('exit', () => {
        if (playwrightProcess.pid) {
          stopProcessMonitoring(playwrightProcess.pid)
          clearInterval(resourceCheckInterval)
        }
      })
    }

    const timeoutId = setTimeout(() => {
      if (playwrightProcess.pid) {
        killProcess(playwrightProcess.pid, 'Test execution timeout')
      } else {
        playwrightProcess.kill('SIGTERM')
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

    playwrightProcess.stdout?.on('data', (data: Buffer) => {
      output += data.toString()
    })

    playwrightProcess.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString()
    })

    playwrightProcess.on('error', (error: Error) => {
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
        error: `Failed to start Playwright: ${error.message}`,
      })
    })

    playwrightProcess.on('close', (code: number | null) => {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const fullOutput = output || errorOutput

      let resourceUsage: PlaywrightRunResult['resourceUsage'] | undefined
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

      resolve(parsePlaywrightOutput(fullOutput, code === 0, duration, resourceUsage))
    })
  })
}

function parsePlaywrightOutput(
  output: string,
  success: boolean,
  duration: number,
  resourceUsage?: PlaywrightRunResult['resourceUsage'],
): PlaywrightRunResult {
  let passed = 0
  let failed = 0
  let skipped = 0
  const specFiles: string[] = []

  try {
    const json = JSON.parse(output) as {
      stats?: { expected?: number; unexpected?: number; skipped?: number; duration?: number }
      suites?: Array<{ file?: string }>
    }
    passed = json.stats?.expected ?? 0
    failed = json.stats?.unexpected ?? 0
    skipped = json.stats?.skipped ?? 0
    if (json.stats?.duration) {
      duration = json.stats.duration
    }
    if (json.suites) {
      for (const suite of json.suites) {
        if (suite.file) specFiles.push(suite.file)
      }
    }
  } catch {
    const passedMatch = output.match(/(\d+)\s+passed/i)
    if (passedMatch) passed = parseInt(passedMatch[1], 10)

    const failedMatch = output.match(/(\d+)\s+failed/i)
    if (failedMatch) failed = parseInt(failedMatch[1], 10)

    const skippedMatch = output.match(/(\d+)\s+skipped/i)
    if (skippedMatch) skipped = parseInt(skippedMatch[1], 10)

    const specFileRegex = /Running:\s+(.+\.spec\.[jt]sx?)/g
    let match
    while ((match = specFileRegex.exec(output)) !== null) {
      specFiles.push(match[1])
    }
  }

  const totalTests = passed + failed + skipped

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
      error: 'Playwright execution failed. Check output for details.',
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
