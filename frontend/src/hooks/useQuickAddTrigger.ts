import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Lets the floating quick-add button / header quick-add menu deep-link
 * straight into a page's create dialog via `?new=<key>`, instead of just
 * dropping the user on the list and making them find the button themselves.
 */
export function useQuickAddTrigger(key: string): [boolean, (open: boolean) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('new') === key) {
      setOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [open, setOpen]
}
