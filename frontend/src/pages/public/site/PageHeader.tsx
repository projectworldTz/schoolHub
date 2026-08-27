import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function PageHeader({
  slug,
  eyebrow,
  title,
  description,
}: {
  slug: string
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="border-b bg-muted/30 px-4 py-14 text-center sm:px-8">
      <Link
        to={`/site/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> Back to Home
      </Link>
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--wb-primary)' }}>
          {eyebrow}
        </span>
        <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        {description && <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">{message}</p>
}
