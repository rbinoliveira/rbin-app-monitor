import type { FirestoreTimestamp } from '@/shared/types/firestore.type'

export interface MonitorSettings {
  healthCheckIntervalHours: number
  cypressIntervalHours: number
  playwrightIntervalHours: number
  updatedAt: Date
}

export interface MonitorSettingsDoc {
  healthCheckIntervalHours: number
  cypressIntervalHours: number
  playwrightIntervalHours: number
  updatedAt: FirestoreTimestamp
}

export interface UpdateMonitorSettingsInput {
  healthCheckIntervalHours?: number
  cypressIntervalHours?: number
  playwrightIntervalHours?: number
}
