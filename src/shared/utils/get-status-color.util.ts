export function getStatusColor(
  status: 'healthy' | 'unhealthy' | 'unknown',
): string {
  switch (status) {
    case 'healthy':
      return 'text-success-600 bg-success-50'
    case 'unhealthy':
      return 'text-danger-600 bg-danger-50'
    default:
      return 'text-gray-500 bg-gray-100'
  }
}
