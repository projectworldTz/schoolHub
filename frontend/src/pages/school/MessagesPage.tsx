import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Send, Plus, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/hooks/useAuth'
import { useSchoolUsers } from '@/hooks/useSchoolUsers'
import { useConversationMessages, useConversations, useSendMessage, useStartConversation } from '@/hooks/useMessages'

function timeLabel(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function NewConversationDialog({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStarted: (conversationId: string) => void
}) {
  const [search, setSearch] = useState('')
  const { data: currentUser } = useCurrentUser()
  const { data: users, isLoading } = useSchoolUsers(search)
  const start = useStartConversation()

  const candidates = (users?.data ?? []).filter((u) => u.id !== currentUser?.id)

  async function handlePick(userId: string) {
    try {
      const conversation = await start.mutateAsync(userId)
      onOpenChange(false)
      setSearch('')
      onStarted(conversation.id)
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message ?? 'Could not start conversation')
        : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <Input placeholder="Search staff by name…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {isLoading && <p className="p-2 text-sm text-muted-foreground">Searching…</p>}
          {!isLoading && candidates.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">No matching staff found.</p>
          )}
          {candidates.map((user) => (
            <button
              key={user.id}
              onClick={() => handlePick(user.id)}
              disabled={start.isPending}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.roles?.[0]}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MessagesPage() {
  const [activeId, setActiveId] = useState<string>('')
  const [draft, setDraft] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const { data: conversations, isLoading: conversationsLoading } = useConversations()
  const { data: thread, isLoading: threadLoading } = useConversationMessages(activeId)
  const send = useSendMessage(activeId)

  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id)
    }
  }, [activeId, conversations])

  const active = conversations?.find((c) => c.id === activeId)

  function handleSend() {
    const body = draft.trim()
    if (!body) return
    send.mutate(body, {
      onSuccess: () => setDraft(''),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not send message')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">Direct messages between staff.</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-1.5 size-4" />
          New message
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]" style={{ minHeight: '28rem' }}>
          <div className="border-r">
            {conversationsLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {!conversationsLoading && conversations?.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="size-6 opacity-50" />
                No conversations yet.
              </div>
            )}
            <div className="divide-y">
              {conversations?.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent',
                    conversation.id === activeId && 'bg-accent'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{conversation.other_user_name ?? 'Unknown'}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeLabel(conversation.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">{conversation.last_message ?? 'No messages yet'}</span>
                    {conversation.unread_count > 0 && (
                      <Badge className="shrink-0">{conversation.unread_count}</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <CardContent className="flex flex-col p-0">
            {!active && (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                Select a conversation, or start a new one.
              </div>
            )}
            {active && (
              <>
                <div className="border-b px-4 py-3 font-medium">{active.other_user_name}</div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {threadLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
                  {thread?.data.map((message) => (
                    <div key={message.id} className={cn('flex', message.is_mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                          message.is_mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                        <p className={cn('mt-1 text-[10px] opacity-70')}>{timeLabel(message.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t p-3">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message…"
                  />
                  <Button size="icon" onClick={handleSend} disabled={send.isPending || !draft.trim()}>
                    <Send className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </div>
      </Card>

      <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} onStarted={setActiveId} />
    </div>
  )
}
