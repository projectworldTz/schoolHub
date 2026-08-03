import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Render whatever's cached immediately (even before the browser's
      // online/offline status is known) instead of blocking on a network
      // request — the read-caching half of offline resilience. Mutations
      // deliberately keep the default 'online' mode: a save attempted
      // while offline should fail visibly, not queue silently and risk a
      // later conflict with someone else's edit — see ROADMAP.md.
      networkMode: 'offlineFirst',
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
})

// Bump this string if a cached query's shape ever changes incompatibly
// (a field renamed/removed) — it invalidates every persisted cache entry
// on load rather than risk the UI rendering a stale, mismatched shape.
const PERSIST_CACHE_BUSTER = 'v1'

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'schoolhub-query-cache',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: PERSIST_CACHE_BUSTER }}
      >
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
      </PersistQueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
