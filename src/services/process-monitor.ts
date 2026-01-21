import type { ChildProcess } from 'child_process'

export interface ProcessResourceUsage {
  pid: number
  memory: number
  cpu: number
  timestamp: number
}

export interface ProcessMonitorOptions {
  maxMemoryMB?: number
  maxCpuPercent?: number
  checkInterval?: number
}

const monitoredProcesses = new Map<
  number,
  {
    process: ChildProcess
    startTime: number
    maxMemoryMB?: number
    maxCpuPercent?: number
    checkInterval?: number
    intervalId?: NodeJS.Timeout
  }
>()

export function startProcessMonitoring(
  process: ChildProcess,
  options: ProcessMonitorOptions = {},
): void {
  const { maxMemoryMB, maxCpuPercent, checkInterval = 5000 } = options
  const pid = process.pid

  if (!pid) {
    return
  }

  const startTime = Date.now()
  monitoredProcesses.set(pid, {
    process,
    startTime,
    maxMemoryMB,
    maxCpuPercent,
    checkInterval,
  })

  const intervalId = setInterval(() => {
    const entry = monitoredProcesses.get(pid)
    if (!entry) {
      clearInterval(intervalId)
      return
    }

    const usage = getProcessResourceUsage(pid)
    if (usage) {
      logResourceUsage(pid, usage, startTime)

      if (maxMemoryMB && usage.memory > maxMemoryMB * 1024 * 1024) {
        console.warn(
          `Process ${pid} exceeded memory limit: ${(usage.memory / 1024 / 1024).toFixed(2)}MB > ${maxMemoryMB}MB`,
        )
        killProcess(pid, 'Memory limit exceeded')
      }

      if (maxCpuPercent && usage.cpu > maxCpuPercent) {
        console.warn(
          `Process ${pid} exceeded CPU limit: ${usage.cpu.toFixed(2)}% > ${maxCpuPercent}%`,
        )
      }
    }
  }, checkInterval)

  const entry = monitoredProcesses.get(pid)
  if (entry) {
    entry.intervalId = intervalId
  }

  process.on('exit', () => {
    stopProcessMonitoring(pid)
  })
}

export function stopProcessMonitoring(pid: number): void {
  const entry = monitoredProcesses.get(pid)
  if (entry?.intervalId) {
    clearInterval(entry.intervalId)
  }
  monitoredProcesses.delete(pid)
}

export function getProcessResourceUsage(
  pid: number,
): ProcessResourceUsage | null {
  try {
    const memInfo = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      pid,
      memory: memInfo.heapUsed,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000,
      timestamp: Date.now(),
    }
  } catch {
    return null
  }
}

function logResourceUsage(
  pid: number,
  usage: ProcessResourceUsage,
  startTime: number,
): void {
  const uptime = Date.now() - startTime
  const memoryMB = (usage.memory / 1024 / 1024).toFixed(2)

  console.log(
    `[Process Monitor] PID: ${pid} | Memory: ${memoryMB}MB | CPU: ${usage.cpu.toFixed(2)}ms | Uptime: ${uptime}ms`,
  )
}

export function killProcess(pid: number, reason: string): void {
  const entry = monitoredProcesses.get(pid)
  if (!entry) {
    return
  }

  console.warn(`Killing process ${pid}: ${reason}`)

  try {
    entry.process.kill('SIGTERM')

    setTimeout(() => {
      if (!entry.process.killed) {
        entry.process.kill('SIGKILL')
        console.warn(`Force killed process ${pid}`)
      }
    }, 5000)
  } catch (error) {
    console.error(`Error killing process ${pid}:`, error)
  } finally {
    stopProcessMonitoring(pid)
  }
}

export function cleanupOrphanedProcesses(): number {
  let count = 0

  for (const [pid, entry] of monitoredProcesses.entries()) {
    if (entry.process.killed || entry.process.exitCode !== null) {
      stopProcessMonitoring(pid)
      count++
    }
  }

  if (count > 0) {
    console.log(`Cleaned up ${count} orphaned processes`)
  }

  return count
}

export function getAllMonitoredProcesses(): number[] {
  return Array.from(monitoredProcesses.keys())
}
