import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// expo-secure-store has no web implementation (there's no OS keychain to
// wrap in a browser) — it throws if called on Platform.OS === 'web'. Expo
// web is how this app gets Playwright/browser-based verification in an
// environment with no iOS/Android simulator, so it has to actually work
// there too, not just on-device.
const TOKEN_KEY = 'schoolhub_api_token'

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)
  }

  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(TOKEN_KEY, token)
    return
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(TOKEN_KEY)
    return
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
