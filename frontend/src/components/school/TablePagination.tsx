import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type PageToken = number | 'ellipsis'

function pageTokens(current: number, total: number): PageToken[] {
  const delta = 1
  const tokens: PageToken[] = []
  let last: number | undefined

  for (let page = 1; page <= total; page++) {
    const isEdge = page === 1 || page === total
    const isNearCurrent = page >= current - delta && page <= current + delta
    if (!isEdge && !isNearCurrent) continue

    if (last !== undefined && page - last > 1) {
      tokens.push('ellipsis')
    }
    tokens.push(page)
    last = page
  }

  return tokens
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const rangeStart = (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t pt-4 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{rangeStart.toLocaleString()}</span>–
        <span className="font-medium text-foreground">{rangeEnd.toLocaleString()}</span> of{' '}
        <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span>
      </p>

      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1.5">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            />
          </PaginationItem>

          <span className="text-sm text-muted-foreground sm:hidden">
            Page {page} of {totalPages}
          </span>

          {pageTokens(page, totalPages).map((token, i) =>
            token === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={token} className="hidden sm:block">
                <PaginationLink
                  isActive={token === page}
                  onClick={() => onPageChange(token)}
                  className="min-w-8 px-2"
                >
                  {token}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
