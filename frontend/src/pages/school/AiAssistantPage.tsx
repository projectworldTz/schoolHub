import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Bot, Copy, Loader2, NotebookPen, Send, Sparkles, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiAssistantStatus, useAiChat, useGenerateLessonPlan } from '@/hooks/useAiAssistant'
import { useClasses, useSubjects } from '@/hooks/useAcademics'
import { cn } from '@/lib/utils'
import type { ChatMessage, LessonPlan } from '@/types/aiAssistant'

const SUGGESTIONS = [
  'Suggest three ways to make fractions fun for 10-year-olds',
  'Draft a polite reminder to parents about unpaid fees',
  'Give me discussion questions for a photosynthesis lesson',
  'How can I support a student who keeps falling behind?',
]

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback
}

function NotConfiguredNotice() {
  return (
    <Card className="shadow-premium border-none">
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="bg-gradient-brand flex size-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
          <Sparkles className="size-7" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold">AI Assistant isn't set up yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Ask your platform administrator to add an AI provider API key to the server. Once that's done, this page
            unlocks a chat assistant and a lesson-plan generator immediately — no other setup needed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const chat = useAiChat()

  function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || chat.isPending) return
    const next = [...messages, { role: 'user', content: trimmed } as ChatMessage]
    setMessages(next)
    setDraft('')
    chat.mutate(next, {
      onSuccess: (reply) => setMessages((prev) => [...prev, { role: 'assistant', content: reply }]),
      onError: (error) => toast.error(errorMessage(error, 'The assistant could not respond')),
    })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  return (
    <Card className="shadow-premium border-none">
      <CardContent className="flex h-[32rem] flex-col p-0">
        <ScrollArea className="flex-1 p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="bg-gradient-brand flex size-12 items-center justify-center rounded-2xl text-white">
                <Bot className="size-6" />
              </span>
              <div>
                <p className="font-display font-semibold">Ask me anything about teaching or running your school</p>
                <p className="mt-1 text-sm text-muted-foreground">Try one of these, or type your own question below.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex items-start gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full',
                      m.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-gradient-brand text-white'
                    )}
                  >
                    {m.role === 'user' ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                  </span>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chat.isPending && (
                <div className="flex items-center gap-2.5">
                  <span className="bg-gradient-brand flex size-7 shrink-0 items-center justify-center rounded-full text-white">
                    <Bot className="size-3.5" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-3.5 py-2.5">
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about lesson ideas, classroom management, parent communication..."
            className="min-h-11 flex-1 resize-none"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={chat.isPending || !draft.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function EmptyPlanState() {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <NotebookPen className="size-5" />
      </span>
      <p className="max-w-56 text-xs text-muted-foreground">Fill in the form and generate to see your lesson plan here.</p>
    </div>
  )
}

function PlanSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

function LessonPlanPanel() {
  const { data: subjects } = useSubjects.useList()
  const { data: classes } = useClasses.useList()
  const generate = useGenerateLessonPlan()
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('40')
  const [notes, setNotes] = useState('')
  const [plan, setPlan] = useState<LessonPlan | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!subjectId || !classId || !topic.trim()) {
      toast.error('Subject, class, and topic are required')
      return
    }
    generate.mutate(
      {
        subject_id: subjectId,
        school_class_id: classId,
        topic: topic.trim(),
        duration_minutes: Number(duration) || 40,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: setPlan,
        onError: (error) => toast.error(errorMessage(error, 'Could not generate a lesson plan')),
      }
    )
  }

  function copyPlan() {
    if (!plan) return
    const text = [
      plan.title,
      '',
      'Objectives:',
      ...plan.objectives.map((o) => `- ${o}`),
      '',
      'Materials:',
      ...plan.materials.map((m) => `- ${m}`),
      '',
      'Activities:',
      ...plan.activities.map((a) => `- ${a.name} (${a.duration_minutes} min): ${a.description}`),
      '',
      `Assessment: ${plan.assessment}`,
      `Homework: ${plan.homework}`,
    ].join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Lesson plan copied to clipboard')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-premium border-none">
        <CardHeader>
          <CardTitle>Generate a lesson plan</CardTitle>
          <CardDescription>Structured objectives, activities, and assessment in seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subjects ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(classes ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Introduction to fractions" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={10} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything specific the AI should account for..."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={generate.isPending} className="w-full gap-2">
              {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate lesson plan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-premium border-none">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>{plan?.title ?? 'Your lesson plan'}</CardTitle>
            <CardDescription>{plan ? 'Generated just now' : 'Appears here once generated'}</CardDescription>
          </div>
          {plan && (
            <Button variant="outline" size="sm" onClick={copyPlan} className="shrink-0 gap-1.5">
              <Copy className="size-3.5" /> Copy
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!plan && !generate.isPending && <EmptyPlanState />}
          {generate.isPending && <PlanSkeleton />}
          {plan && (
            <div className="space-y-5 text-sm">
              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Objectives</h3>
                <ul className="list-disc space-y-1 pl-4">
                  {plan.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Materials</h3>
                <ul className="list-disc space-y-1 pl-4">
                  {plan.materials.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Activities</h3>
                <div className="space-y-2">
                  {plan.activities.map((a, i) => (
                    <div key={i} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{a.name}</p>
                        <Badge variant="outline" className="shrink-0">
                          {a.duration_minutes} min
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{a.description}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Assessment</h3>
                <p>{plan.assessment}</p>
              </section>
              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Homework</h3>
                <p>{plan.homework}</p>
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AiAssistantPage() {
  const { data: status, isLoading } = useAiAssistantStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display flex items-center gap-2.5 text-2xl font-semibold">
          <span className="bg-gradient-brand flex size-9 items-center justify-center rounded-xl text-white shadow-lg shadow-primary/25">
            <Sparkles className="size-4.5" />
          </span>
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Lesson planning and quick answers, grounded in your school.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : !status?.configured ? (
        <NotConfiguredNotice />
      ) : (
        <Tabs defaultValue="chat">
          <TabsList>
            <TabsTrigger value="chat" className="gap-1.5">
              <Bot className="size-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="lesson-plan" className="gap-1.5">
              <NotebookPen className="size-3.5" /> Lesson Plan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="lesson-plan" className="mt-4">
            <LessonPlanPanel />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
