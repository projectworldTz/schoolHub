import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** React Router doesn't scroll to #hash targets on route change like a plain <a> does — this fills that gap for nav dropdown deep-links (e.g. #class-<id>). */
export function useScrollToHash(deps: readonly unknown[] = []) {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, ...deps])
}
