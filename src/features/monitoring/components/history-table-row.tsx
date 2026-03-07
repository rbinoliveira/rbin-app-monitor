'use client'

import { HEALTH_CHECK_TYPE_LABELS } from '@/shared/constants/health-check-type-labels.constants'
import type { CypressResult } from '@/shared/types/cypress-result.type'
import type { HealthCheckResult } from '@/shared/types/health-check.type'
import type { PlaywrightResult } from '@/shared/types/playwright-result.type'
import { HistoryStatusBadge } from '@/features/monitoring/components/history-status-badge'
import type { HistoryItem } from '@/features/monitoring/use-cases/get-history.use-case'

function getHealthCheckTypeLabel(type: string): string {
  if (type === 'front' || type === 'back') return HEALTH_CHECK_TYPE_LABELS[type]
  if (type === 'web' || type === 'wordpress') return 'Frente'
  if (type === 'rest') return 'API'
  return type
}

export function isHealthCheckResult(
  item: HistoryItem,
): item is HealthCheckResult {
  return 'type' in item && 'url' in item
}

function isCypressResult(item: HistoryItem): item is CypressResult {
  return 'runner' in item && item.runner === 'cypress'
}

function isPlaywrightResult(item: HistoryItem): item is PlaywrightResult {
  return 'runner' in item && item.runner === 'playwright'
}

export interface HistoryTableHealthCheckRowProps {
  item: HealthCheckResult
}

export function HistoryTableHealthCheckRow({
  item,
}: HistoryTableHealthCheckRowProps) {
  return (
    <tr>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {getHealthCheckTypeLabel(item.type)}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {item.projectName}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <HistoryStatusBadge
          success={item.success}
          label={item.success ? 'Sucesso' : 'Falha'}
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {item.statusCode && <span>HTTP {item.statusCode}</span>}
        {item.responseTime && (
          <span className="ml-2">{item.responseTime}ms</span>
        )}
        {item.errorMessage && (
          <div className="mt-1 text-xs text-danger-600">
            {item.errorMessage}
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {new Date(item.timestamp).toLocaleString()}
      </td>
    </tr>
  )
}

export interface HistoryTableTestRowProps {
  item: CypressResult | PlaywrightResult
}

export function HistoryTableTestRow({ item }: HistoryTableTestRowProps) {
  const isPlaywright = isPlaywrightResult(item)
  return (
    <tr>
      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
        {isPlaywright ? 'Playwright Tests' : 'Cypress Tests'}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {item.projectName}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm">
        <HistoryStatusBadge
          success={item.success}
          label={item.success ? 'Passed' : 'Failed'}
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div>
          <span>
            {item.passed}/{item.totalTests} passed
          </span>
          {item.failed > 0 && (
            <span className="ml-2 text-danger-600">{item.failed} failed</span>
          )}
        </div>
        <div className="mt-1 text-xs">
          Duration: {Math.round(item.duration / 1000)}s
        </div>
        {'error' in item && item.error && (
          <div className="mt-1 text-xs text-danger-600">{item.error}</div>
        )}
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
        {new Date(item.timestamp).toLocaleString()}
      </td>
    </tr>
  )
}

export function isTestResultItem(
  item: HistoryItem,
): item is CypressResult | PlaywrightResult {
  return 'runner' in item && (item.runner === 'cypress' || item.runner === 'playwright')
}
