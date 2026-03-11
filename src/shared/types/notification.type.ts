export type NotificationType = 'cypress_failed' | 'cypress_passed'

export interface NotificationPayload {
  type: NotificationType
  projectId: string
  projectName: string
  details: string
  timestamp: Date
}
