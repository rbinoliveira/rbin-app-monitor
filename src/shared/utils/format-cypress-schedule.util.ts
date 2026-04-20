import { MONITORING_SCHEDULE } from '@/shared/libs/constants'

export function formatCypressSchedule(timeZone?: string): string {
  const scheduleDate = new Date(
    Date.UTC(
      2024,
      0,
      1,
      MONITORING_SCHEDULE.CYPRESS_UTC_HOUR,
      MONITORING_SCHEDULE.CYPRESS_UTC_MINUTE,
      0,
    ),
  )

  const localTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(scheduleDate)

  return `Todos os dias às ${localTime} (local) • ${String(MONITORING_SCHEDULE.CYPRESS_UTC_HOUR).padStart(2, '0')}:${String(MONITORING_SCHEDULE.CYPRESS_UTC_MINUTE).padStart(2, '0')} UTC`
}
