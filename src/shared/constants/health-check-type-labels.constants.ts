import type { HealthCheckType } from '@/shared/types/health-check.type'

export const HEALTH_CHECK_TYPE_LABELS: Record<HealthCheckType, string> = {
  front: 'Frente',
  back: 'API',
}
