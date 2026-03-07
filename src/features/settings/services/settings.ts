import { Timestamp } from 'firebase-admin/firestore'

import { ApiError } from '@/shared/lib/api-response'
import {
  COLLECTION_NAMES,
  DEFAULT_INTERVAL_HOURS,
  HTTP_STATUS,
  INTERVAL_HOURS,
  SETTINGS_DOC_ID,
} from '@/shared/lib/constants'
import { getAdminDb } from '@/shared/lib/firebase-admin'
import type {
  MonitorSettings,
  MonitorSettingsDoc,
  UpdateMonitorSettingsInput,
} from '@/shared/types/monitor-settings.type'

const SETTINGS_COLLECTION = COLLECTION_NAMES.SETTINGS

function settingsFromFirestore(data: MonitorSettingsDoc): MonitorSettings {
  return {
    healthCheckIntervalHours: data.healthCheckIntervalHours,
    cypressIntervalHours: data.cypressIntervalHours,
    playwrightIntervalHours: data.playwrightIntervalHours,
    updatedAt: data.updatedAt.toDate(),
  }
}

function validateIntervalHours(value: number, field: string): number {
  const parsed = Number(value)

  if (
    !Number.isInteger(parsed) ||
    parsed < INTERVAL_HOURS.MIN ||
    parsed > INTERVAL_HOURS.MAX
  ) {
    throw new ApiError(
      `${field} must be between ${INTERVAL_HOURS.MIN} and ${INTERVAL_HOURS.MAX} hours`,
      HTTP_STATUS.BAD_REQUEST,
    )
  }

  return parsed
}

export async function getSettings(): Promise<MonitorSettings> {
  const docRef = getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC_ID)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    const now = new Date()
    return {
      healthCheckIntervalHours: DEFAULT_INTERVAL_HOURS.HEALTH_CHECK,
      cypressIntervalHours: DEFAULT_INTERVAL_HOURS.CYPRESS,
      playwrightIntervalHours: DEFAULT_INTERVAL_HOURS.PLAYWRIGHT,
      updatedAt: now,
    }
  }

  return settingsFromFirestore(docSnap.data() as MonitorSettingsDoc)
}

export async function updateSettings(
  input: UpdateMonitorSettingsInput,
): Promise<MonitorSettings> {
  const updates: Partial<MonitorSettingsDoc> = {
    updatedAt: Timestamp.fromDate(new Date()),
  }

  if (input.healthCheckIntervalHours !== undefined) {
    updates.healthCheckIntervalHours = validateIntervalHours(
      input.healthCheckIntervalHours,
      'Health check interval',
    )
  }

  if (input.cypressIntervalHours !== undefined) {
    updates.cypressIntervalHours = validateIntervalHours(
      input.cypressIntervalHours,
      'Cypress interval',
    )
  }

  if (input.playwrightIntervalHours !== undefined) {
    updates.playwrightIntervalHours = validateIntervalHours(
      input.playwrightIntervalHours,
      'Playwright interval',
    )
  }

  if (Object.keys(updates).length <= 1) {
    return getSettings()
  }

  const docRef = getAdminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(SETTINGS_DOC_ID)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    const initial: MonitorSettingsDoc = {
      healthCheckIntervalHours:
        updates.healthCheckIntervalHours ?? DEFAULT_INTERVAL_HOURS.HEALTH_CHECK,
      cypressIntervalHours:
        updates.cypressIntervalHours ?? DEFAULT_INTERVAL_HOURS.CYPRESS,
      playwrightIntervalHours:
        updates.playwrightIntervalHours ?? DEFAULT_INTERVAL_HOURS.PLAYWRIGHT,
      updatedAt: Timestamp.fromDate(new Date()),
    }

    await docRef.set(initial)
    return settingsFromFirestore(initial)
  }

  await docRef.update(updates)
  return getSettings()
}
