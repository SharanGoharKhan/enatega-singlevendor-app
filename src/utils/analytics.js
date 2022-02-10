import * as Amplitude from 'expo-analytics-amplitude'
import { normalizeTrackingOptions } from './analyticsUtils'
import getEnvVars from '../../environment'
import { getTrackingPermissions } from './useAppTrackingTransparency'
const { AMPLITUDE_API_KEY } = getEnvVars()

let isInitialized = false

export const events = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_CREATED_ACCOUNT: 'USER_CREATED_ACCOUNT',
  // USER_RESET_PASSWORD: 'USER_RESET_PASSWORD',
  // USER_LINKED_SOCIAL: 'USER_LINKED_SOCIAL',
  // USER_UPDATED_EMAIL: 'USER_UPDATED_EMAIL',
  // USER_UPDATED_PROFILE: 'USER_UPDATED_PROFILE',
  // USER_UPDATED_LINKS: 'USER_UPDATED_SOCIAL_LINKS',
  // USER_UPDATED_LIKE: 'USER_UPDATED_LIKE',
  // USER_UPDATED_PRIVACY: 'USER_UPDATED_PRIVACY',
  // USER_REMOVED_PROJECT: 'USER_REMOVED_PROJECT',
  // USER_OPENED_CREATION: 'USER_OPENED_CREATION',
  // USER_UPDATED_SETTINGS: 'USER_UPDATED_SETTINGS',
  USER_PLACED_ORDER: 'USER_PLACED_ORDER'
}

export async function initialize() {
  const trackingStatus = await getTrackingPermissions()
  if (isInitialized || !AMPLITUDE_API_KEY || trackingStatus !== 'granted') {
    return
  }
  await Amplitude.initializeAsync(AMPLITUDE_API_KEY)
  isInitialized = true
}

export async function identify(id, options) {
  initialize()
  const properties = normalizeTrackingOptions(options)

  if (id) {
    await Amplitude.setUserIdAsync(id)
    if (properties) {
      await Amplitude.setUserPropertiesAsync(properties)
    }
  } else {
    await Amplitude.clearUserPropertiesAsync()
  }
}

export async function track(event, options) {
  initialize()
  const properties = normalizeTrackingOptions(options)

  if (properties) {
    await Amplitude.logEventWithPropertiesAsync(event, properties)
  } else {
    await Amplitude.logEventAsync(event)
  }
}

export default {
  events,
  initialize,
  identify,
  track
}
