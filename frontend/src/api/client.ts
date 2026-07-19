import axios, { type AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** For direct-navigation downloads (PDFs) where a plain link, not axios, must carry the session cookie. */
export const apiOrigin = API_BASE_URL

/**
 * Sanctum's SPA auth is cookie-based: withCredentials sends the session
 * cookie, and XSRF-TOKEN (set by GET /sanctum/csrf-cookie) is mirrored
 * into the X-XSRF-TOKEN header automatically by axios when the cookie is
 * readable (withXSRFToken enables that behavior).
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Every mutation error handler in this app follows the same
 * `error.response?.data?.message ?? '<local fallback text>'` pattern —
 * dozens of call sites, each with its own generic fallback ("Could not
 * create student", "Something went wrong"). A network error (offline, DNS
 * failure, backend unreachable) never gets a response at all, so
 * `error.response` is undefined and every one of those call sites falls
 * through to its own generic fallback, which reads like a validation
 * failure rather than "you're offline". Attaching a synthetic response
 * here — only when the server truly never responded, never overwriting a
 * real one — fixes the message everywhere at once instead of touching
 * every call site individually.
 */
apiClient.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && !error.response) {
    error.response = {
      data: { message: "You're offline — check your connection and try again." },
    } as AxiosResponse
  }
  return Promise.reject(error)
})

export async function ensureCsrfCookie() {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true })
}
