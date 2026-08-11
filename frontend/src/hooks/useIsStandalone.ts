import { useEffect, useState } from 'react'

/**
 * True when the app is running installed (PWA "standalone" mode) rather
 * than in an ordinary browser tab. iOS Safari doesn't support the
 * `display-mode` media query, hence the `navigator.standalone` fallback.
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(display-mode: standalone)')
    const update = () => {
      setIsStandalone(query.matches || (navigator as { standalone?: boolean }).standalone === true)
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isStandalone
}
