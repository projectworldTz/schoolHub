import { useEffect, useState } from 'react'

/** navigator.onLine is a reasonable "am I connected" signal in every browser this app targets. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    function goOnline() {
      setIsOnline(true)
    }
    function goOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
