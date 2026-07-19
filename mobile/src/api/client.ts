import axios from 'axios'
import { getToken } from './storage'

// EXPO_PUBLIC_* vars are inlined at build time (Expo's equivalent of Vite's
// VITE_* convention). localhost is correct for Expo web (runs in a real
// browser on this machine, same as the frontend/ SPA) and for iOS
// simulators; an Android emulator or a physical device needs this
// overridden to the dev machine's LAN IP via .env, since "localhost" on
// those means the device itself, not this machine.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
