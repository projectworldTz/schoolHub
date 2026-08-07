import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import {
  CalendarCheck,
  GraduationCap,
  Megaphone,
  MessageCircle,
  NotebookPen,
  Receipt,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useChildAttendance,
  useChildFees,
  useChildHomework,
  useChildResults,
  useMyChildren,
  useParentAnnouncements,
  useParentConversationMessages,
  useParentConversations,
  useSendParentMessage,
} from '@/hooks/useParentPortal'
import { cn } from '@/lib/utils'
import { AttendanceTrendChart } from '@/components/school/AttendanceTrendChart'
import { AttendanceStatusBadge } from '@/components/school/AttendanceStatusBadge'
import { PerformanceTrendChart } from '@/components/school/PerformanceTrendChart'
import { ParentRewardCard } from '@/components/parent/ParentRewardCard'
import { FeesTable } from '@/components/parent/FeesTable'
import { ExamResultsList } from '@/components/parent/ExamResultsList'
import type { Student } from '@/types/students'

function ChildOverview({ student }: { student: Student }) {
  const { data: attendance, isLoading: attendanceLoading } = useChildAttendance(student.id)
  const { data: homework, isLoading: homeworkLoading } = useChildHomework(student.id)
  const { data: results, isLoading: resultsLoading } = useChildResults(student.id)
  const { data: invoices, isLoading: invoicesLoading } = useChildFees(student.id)

  const outstandingBalance = (invoices ?? []).reduce((sum, inv) => sum + Number(inv.balance), 0)

  const presentCount = attendance?.records.filter((a) => a.status === 'present').length ?? 0
  const totalMarked = attendance?.records.length ?? 0

  // Backend already orders exams newest-first by exam start_date.
  const latestResult = results?.[0]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
          <CardDescription>
            Admission #{student.admission_number}
            {student.current_enrollment && ` · ${student.current_enrollment.school_class_name}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {!invoicesLoading && invoices && (
        <ParentRewardCard studentName={student.first_name} invoices={invoices} />
      )}

      {latestResult?.performance_message && (
        <Card className="border-none bg-gradient-brand text-white shadow-md shadow-primary/20">
          <CardContent className="p-5">
            <p className="text-sm text-white/80">Latest: {latestResult.exam_name}</p>
            <p className="mt-1 text-lg font-semibold">
              {latestResult.performance_message.emoji} {latestResult.performance_message.title}
            </p>
            <p className="mt-1 text-sm text-white/90">{latestResult.performance_message.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Attendance (last 12 months)</p>
              <p className="font-display text-2xl font-semibold">
                {attendanceLoading ? '…' : `${presentCount}/${totalMarked}`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <NotebookPen className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Homework</p>
              <p className="font-display text-2xl font-semibold">{homeworkLoading ? '…' : homework?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Exams recorded</p>
              <p className="font-display text-2xl font-semibold">{resultsLoading ? '…' : results?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <Receipt className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Fees outstanding</p>
              <p className="font-display text-2xl font-semibold">
                {invoicesLoading ? '…' : outstandingBalance.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <FeesTable invoices={invoices} loading={invoicesLoading} studentId={student.id} />

      <Card>
        <CardHeader>
          <CardTitle>Attendance trend</CardTitle>
          <CardDescription>How {student.first_name}'s attendance has moved month to month.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!attendanceLoading && <AttendanceTrendChart data={attendance?.trend ?? []} />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!attendanceLoading && attendance?.records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No attendance recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {attendance?.records.slice(0, 10).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>
                    <AttendanceStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>{a.remarks ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!homeworkLoading && homework?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No homework yet.
                  </TableCell>
                </TableRow>
              )}
              {homework?.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.homework_title}</TableCell>
                  <TableCell>{h.subject_name ?? '—'}</TableCell>
                  <TableCell>{h.due_date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{h.status}</Badge>
                  </TableCell>
                  <TableCell>{h.grade ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance trend</CardTitle>
          <CardDescription>{student.first_name}'s average score across every graded exam, oldest to newest.</CardDescription>
        </CardHeader>
        <CardContent>
          {!resultsLoading && <PerformanceTrendChart results={results ?? []} />}
        </CardContent>
      </Card>

      <ExamResultsList results={results} loading={resultsLoading} />
    </div>
  )
}

function messageTimeLabel(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Read/reply only — parents never start a conversation, they only reply
 * within a thread a school administrator already started with them.
 */
function ParentMessagesCard() {
  const [activeId, setActiveId] = useState('')
  const [draft, setDraft] = useState('')

  const { data: conversations, isLoading: conversationsLoading } = useParentConversations()
  const { data: thread, isLoading: threadLoading } = useParentConversationMessages(activeId)
  const send = useSendParentMessage(activeId)

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

  if (!conversationsLoading && conversations?.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <MessageCircle className="size-4" /> Messages
          </span>
        </CardTitle>
        <CardDescription>Direct messages from the school.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]" style={{ minHeight: '22rem' }}>
          <div className="border-r">
            {conversationsLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
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
                    <span className="truncate text-sm font-medium">{conversation.other_user_name ?? 'School'}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {messageTimeLabel(conversation.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">{conversation.last_message ?? 'No messages yet'}</span>
                    {conversation.unread_count > 0 && <Badge className="shrink-0">{conversation.unread_count}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col p-0">
            {!active && (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
                Select a conversation.
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
                        <p className="mt-1 text-[10px] opacity-70">{messageTimeLabel(message.created_at)}</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ParentDashboardPage() {
  const { data: children, isLoading } = useMyChildren()
  const { data: announcements } = useParentAnnouncements()
  const [activeChild, setActiveChild] = useState('')

  useEffect(() => {
    if (!activeChild && children?.length) setActiveChild(children[0].id)
  }, [children, activeChild])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Parent Portal</h1>
        <p className="text-sm text-muted-foreground">Your children's attendance, homework, and results.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && children?.length === 0 && (
        <p className="text-sm text-muted-foreground">No children are linked to your account yet.</p>
      )}

      {children && children.length > 0 && (
        <Tabs value={activeChild} onValueChange={setActiveChild}>
          <TabsList>
            {children.map((child) => (
              <TabsTrigger key={child.id} value={child.id}>
                {child.full_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {children.map((child) => (
            <TabsContent key={child.id} value={child.id} className="mt-4">
              <ChildOverview student={child} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Megaphone className="size-4" /> Announcements
              {Boolean(announcements?.unread_count) && (
                <Badge variant="default" className="ml-1">
                  {announcements!.unread_count} new
                </Badge>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements?.records.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          {announcements?.records.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </div>
              {a.is_new && (
                <Badge variant="secondary" className="shrink-0">
                  New
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <ParentMessagesCard />
    </div>
  )
}
