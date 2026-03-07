export type NotificationType =
  | 'health_check_failed'
  | 'health_check_restored'
  | 'cypress_failed'
  | 'cypress_passed'
  | 'playwright_failed'
  | 'playwright_passed'

export interface NotificationPayload {
  type: NotificationType
  projectId: string
  projectName: string
  details: string
  timestamp: Date
}
