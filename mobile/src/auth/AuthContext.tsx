import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { fetchMe, login as apiLogin, logout as apiLogout, type LoginPayload } from '../api/auth'
import { clearToken, getToken, setToken } from '../api/storage'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isBootstrapping: boolean
  isSubmitting: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const token = await getToken()
      if (!token) {
        setIsBootstrapping(false)
        return
      }

      try {
        setUser(await fetchMe())
      } catch {
        // Stored token is stale/revoked — drop it and fall back to the login screen.
        await clearToken()
      } finally {
        setIsBootstrapping(false)
      }
    })()
  }, [])

  async function login(email: string, password: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: LoginPayload = {
        email,
        password,
        device_name: Platform.OS === 'web' ? 'Web browser' : `${Platform.OS} device`,
      }
      const { token, user: loggedInUser } = await apiLogin(payload)
      await setToken(token)
      setUser(loggedInUser)
    } catch (err) {
      setError('Could not sign in — check your email and password.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // Token may already be invalid server-side — clear local state regardless.
    }
    await clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, isSubmitting, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
