import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Download, FileCheck2, ListChecks, Loader2, PenLine, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClasses, useSubjects } from '@/hooks/useAcademics'
import { useGenerateExamPaper, useRefineExamPaper, useUpdateExamPaper } from '@/hooks/useExamPaper'
import { examPaperPdfUrl } from '@/api/examPaper'
import type {
  ExamPaper,
  ExamPaperSection,
  ExamPaperSectionType,
  MatchingSection,
  McqQuestion,
  MultipleChoiceSection,
  ShortAnswerQuestion,
  ShortAnswerSection,
} from '@/types/examPaper'

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) ? (error.response?.data?.message ?? fallback) : fallback
}

function computeTotalMarks(sections: ExamPaperSection[]): number {
  return sections.reduce((sum, section) => {
    if (section.type === 'matching') {
      return sum + Object.keys(section.correct_matches ?? {}).length * (section.marks_per_pair || 0)
    }
    return sum + section.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)
  }, 0)
}

const SECTION_LABELS: Record<ExamPaperSectionType, string> = {
  multiple_choice: 'Multiple Choice',
  matching: 'Matching',
  short_answer: 'Short Answer',
}

interface SectionConfig {
  enabled: boolean
  count: number
  marksPerQuestion: number
}

type SectionConfigs = Record<ExamPaperSectionType, SectionConfig>

const DEFAULT_SECTION_CONFIGS: SectionConfigs = {
  multiple_choice: { enabled: true, count: 10, marksPerQuestion: 1 },
  matching: { enabled: false, count: 5, marksPerQuestion: 1 },
  short_answer: { enabled: true, count: 5, marksPerQuestion: 5 },
}

function GenerateForm({ onGenerated }: { onGenerated: (paper: ExamPaper) => void }) {
  const { data: subjects } = useSubjects.useList()
  const { data: classes } = useClasses.useList()
  const generate = useGenerateExamPaper()

  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [configs, setConfigs] = useState<SectionConfigs>(DEFAULT_SECTION_CONFIGS)

  function updateConfig(type: ExamPaperSectionType, patch: Partial<SectionConfig>) {
    setConfigs((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const sections = (Object.keys(configs) as ExamPaperSectionType[])
      .filter((type) => configs[type].enabled)
      .map((type) => ({ type, count: configs[type].count, marks_per_question: configs[type].marksPerQuestion }))

    if (!subjectId || !classId || !title.trim()) {
      toast.error('Subject, class, and exam title are required')
      return
    }
    if (sections.length === 0) {
      toast.error('Select at least one question format')
      return
    }

    generate.mutate(
      {
        subject_id: subjectId,
        school_class_id: classId,
        title: title.trim(),
        exam_date: examDate || undefined,
        duration_minutes: Number(duration) || 60,
        sections,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: onGenerated,
        onError: (error) => toast.error(errorMessage(error, 'Could not generate the exam paper')),
      }
    )
  }

  return (
    <Card className="shadow-premium border-none">
      <CardHeader>
        <CardTitle>Generate an exam paper</CardTitle>
        <CardDescription>Set the class, subject, title, date, duration, and question mix</CardDescription>
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
            <Label>Exam title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Term Mathematics Examination" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date to be taken</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={20} max={240} value={duration} onChange={(e) => setDuration(e.target.value)} />
              <p className="text-xs text-muted-foreground">e.g. 120 for 2 hours, 180 for 3 hours</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question formats</Label>
            {(Object.keys(configs) as ExamPaperSectionType[]).map((type) => (
              <div key={type} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
                <div className="flex min-w-40 items-center gap-2">
                  <Checkbox
                    checked={configs[type].enabled}
                    onCheckedChange={(checked) => updateConfig(type, { enabled: checked === true })}
                  />
                  <span className="text-sm font-medium">{SECTION_LABELS[type]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">{type === 'matching' ? 'Pairs' : 'Questions'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    className="w-20"
                    disabled={!configs[type].enabled}
                    value={configs[type].count}
                    onChange={(e) => updateConfig(type, { count: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Marks each</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    className="w-20"
                    disabled={!configs[type].enabled}
                    value={configs[type].marksPerQuestion}
                    onChange={(e) => updateConfig(type, { marksPerQuestion: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Syllabus topics / notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Topics to cover, difficulty level, anything else the AI should account for..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={generate.isPending} className="w-full gap-2">
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generate.isPending ? 'Generating exam paper...' : 'Generate exam paper'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function McqEditor({ section, onChange }: { section: MultipleChoiceSection; onChange: (next: MultipleChoiceSection) => void }) {
  function updateQuestion(index: number, patch: Partial<McqQuestion>) {
    const questions = section.questions.map((q, i) => (i === index ? { ...q, ...patch } : q))
    onChange({ ...section, questions })
  }
  function updateOption(qIndex: number, oIndex: number, text: string) {
    const options = section.questions[qIndex].options.map((o, i) => (i === oIndex ? { ...o, text } : o))
    updateQuestion(qIndex, { options })
  }
  function removeQuestion(index: number) {
    onChange({ ...section, questions: section.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, number: i + 1 })) })
  }
  function addQuestion() {
    const number = section.questions.length + 1
    onChange({
      ...section,
      questions: [
        ...section.questions,
        {
          number,
          question: '',
          options: [
            { label: 'A', text: '' },
            { label: 'B', text: '' },
            { label: 'C', text: '' },
            { label: 'D', text: '' },
          ],
          correct_option: 'A',
          marks: 1,
        },
      ],
    })
  }

  return (
    <div className="space-y-3">
      {section.questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border p-3">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-2 shrink-0 text-sm font-semibold text-muted-foreground">{q.number}.</span>
            <Textarea value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} rows={2} className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeQuestion(qi)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="ml-6 grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-sm font-medium">{o.label}.</span>
                <Input value={o.text} onChange={(e) => updateOption(qi, oi, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="ml-6 mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Correct option</Label>
              <Select value={q.correct_option} onValueChange={(v) => updateQuestion(qi, { correct_option: v })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((o) => (
                    <SelectItem key={o.label} value={o.label}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Marks</Label>
              <Input
                type="number"
                min={1}
                className="w-20"
                value={q.marks}
                onChange={(e) => updateQuestion(qi, { marks: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
        <Plus className="size-3.5" /> Add question
      </Button>
    </div>
  )
}

function ShortAnswerEditor({ section, onChange }: { section: ShortAnswerSection; onChange: (next: ShortAnswerSection) => void }) {
  function updateQuestion(index: number, patch: Partial<ShortAnswerQuestion>) {
    onChange({ ...section, questions: section.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) })
  }
  function removeQuestion(index: number) {
    onChange({ ...section, questions: section.questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, number: i + 1 })) })
  }
  function addQuestion() {
    onChange({
      ...section,
      questions: [...section.questions, { number: section.questions.length + 1, question: '', model_answer: '', marks: 5 }],
    })
  }

  return (
    <div className="space-y-3">
      {section.questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border p-3">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-2 shrink-0 text-sm font-semibold text-muted-foreground">{q.number}.</span>
            <Textarea value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} rows={2} className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeQuestion(qi)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="ml-6 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Model answer</Label>
            <Textarea value={q.model_answer} onChange={(e) => updateQuestion(qi, { model_answer: e.target.value })} rows={2} />
          </div>
          <div className="ml-6 mt-2 flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground">Marks</Label>
            <Input
              type="number"
              min={1}
              className="w-20"
              value={q.marks}
              onChange={(e) => updateQuestion(qi, { marks: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
        <Plus className="size-3.5" /> Add question
      </Button>
    </div>
  )
}

function MatchingEditor({ section, onChange }: { section: MatchingSection; onChange: (next: MatchingSection) => void }) {
  function updateLeft(index: number, text: string) {
    onChange({ ...section, left_items: section.left_items.map((it, i) => (i === index ? { ...it, text } : it)) })
  }
  function updateRight(index: number, text: string) {
    onChange({ ...section, right_items: section.right_items.map((it, i) => (i === index ? { ...it, text } : it)) })
  }
  function updateMatch(leftKey: string, rightKey: string) {
    onChange({ ...section, correct_matches: { ...section.correct_matches, [leftKey]: rightKey } })
  }
  function removePair(index: number) {
    const left = section.left_items[index]
    const nextMatches = { ...section.correct_matches }
    delete nextMatches[left.key]
    onChange({
      ...section,
      left_items: section.left_items.filter((_, i) => i !== index),
      right_items: section.right_items.filter((_, i) => i !== index),
      correct_matches: nextMatches,
    })
  }
  function addPair() {
    const n = section.left_items.length + 1
    const leftKey = String(n)
    const rightKey = String.fromCharCode(64 + n)
    onChange({
      ...section,
      left_items: [...section.left_items, { key: leftKey, text: '' }],
      right_items: [...section.right_items, { key: rightKey, text: '' }],
      correct_matches: { ...section.correct_matches, [leftKey]: rightKey },
    })
  }

  return (
    <div className="space-y-3">
      {section.left_items.map((left, i) => (
        <div key={left.key} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <span className="w-6 shrink-0 text-sm font-medium">{left.key}.</span>
          <Input value={left.text} onChange={(e) => updateLeft(i, e.target.value)} className="min-w-40 flex-1" placeholder="Column A item" />
          <span className="text-muted-foreground">&harr;</span>
          <Input
            value={section.right_items[i]?.text ?? ''}
            onChange={(e) => updateRight(i, e.target.value)}
            className="min-w-40 flex-1"
            placeholder="Column B item"
          />
          <Select value={section.correct_matches[left.key] ?? ''} onValueChange={(v) => updateMatch(left.key, v)}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              {section.right_items.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="icon" onClick={() => removePair(i)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addPair} className="gap-1.5">
          <Plus className="size-3.5" /> Add pair
        </Button>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Marks per pair</Label>
          <Input
            type="number"
            min={1}
            className="w-20"
            value={section.marks_per_pair}
            onChange={(e) => onChange({ ...section, marks_per_pair: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  )
}

function PreviewAndEdit({ paper, onDownloadReady }: { paper: ExamPaper; onDownloadReady: (paper: ExamPaper) => void }) {
  const [draft, setDraft] = useState<ExamPaper>(paper)
  const [dirty, setDirty] = useState(false)
  const [refineInstruction, setRefineInstruction] = useState('')
  const update = useUpdateExamPaper()
  const refine = useRefineExamPaper()

  function markDirty(next: ExamPaper) {
    setDraft(next)
    setDirty(true)
  }

  function updateSection(index: number, next: ExamPaperSection) {
    const sections = draft.sections.map((s, i) => (i === index ? next : s))
    markDirty({ ...draft, sections })
  }

  function saveChanges() {
    update.mutate(
      {
        id: draft.id,
        input: {
          title: draft.title,
          exam_date: draft.exam_date,
          duration_minutes: draft.duration_minutes,
          instructions: draft.instructions,
          sections: draft.sections,
        },
      },
      {
        onSuccess: (saved) => {
          setDraft(saved)
          setDirty(false)
          onDownloadReady(saved)
          toast.success('Changes saved')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not save changes')),
      }
    )
  }

  function submitRefine(e: FormEvent) {
    e.preventDefault()
    if (!refineInstruction.trim()) return
    refine.mutate(
      { id: draft.id, instruction: refineInstruction.trim() },
      {
        onSuccess: (revised) => {
          setDraft(revised)
          setDirty(false)
          setRefineInstruction('')
          onDownloadReady(revised)
          toast.success('Exam paper refined')
        },
        onError: (error) => toast.error(errorMessage(error, 'Could not refine the exam paper')),
      }
    )
  }

  const totalMarks = computeTotalMarks(draft.sections)
  const busy = update.isPending || refine.isPending

  return (
    <div className="space-y-4">
      <Card className="shadow-premium border-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex-1 space-y-3">
            <Input
              value={draft.title}
              onChange={(e) => markDirty({ ...draft, title: e.target.value })}
              className="font-display text-lg font-semibold"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={draft.exam_date ?? ''}
                  onChange={(e) => markDirty({ ...draft, exam_date: e.target.value || null })}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={draft.duration_minutes}
                  onChange={(e) => markDirty({ ...draft, duration_minutes: Number(e.target.value) || 0 })}
                />
              </div>
              <Badge variant="outline">Total marks: {totalMarks}</Badge>
              {dirty && (
                <Badge variant="outline" className="border-amber-400 text-amber-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={saveChanges} disabled={!dirty || busy} className="shrink-0 gap-1.5">
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}
            Save changes
          </Button>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Instructions to candidates</Label>
          <Textarea
            value={draft.instructions}
            onChange={(e) => markDirty({ ...draft, instructions: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>

      {draft.sections.map((section, i) => (
        <Card key={i} className="shadow-premium border-none">
          <CardHeader className="space-y-2">
            <Input
              value={section.title}
              onChange={(e) => updateSection(i, { ...section, title: e.target.value } as ExamPaperSection)}
              className="font-semibold"
            />
            <Textarea
              value={section.instructions}
              onChange={(e) => updateSection(i, { ...section, instructions: e.target.value } as ExamPaperSection)}
              rows={2}
              className="text-sm"
            />
          </CardHeader>
          <CardContent>
            {section.type === 'multiple_choice' && (
              <McqEditor section={section} onChange={(next) => updateSection(i, next)} />
            )}
            {section.type === 'short_answer' && (
              <ShortAnswerEditor section={section} onChange={(next) => updateSection(i, next)} />
            )}
            {section.type === 'matching' && (
              <MatchingEditor section={section} onChange={(next) => updateSection(i, next)} />
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="shadow-premium border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenLine className="size-4" /> Refine with AI
          </CardTitle>
          <CardDescription>Describe a change and the AI will revise the whole paper — e.g. "make Section B harder"</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitRefine} className="flex gap-2">
            <Textarea
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="What should change?"
              rows={2}
              className="flex-1"
            />
            <Button type="submit" disabled={busy || !refineInstruction.trim()} className="shrink-0 gap-1.5">
              {refine.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Refine
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-premium border-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
          <p className="text-sm text-muted-foreground">
            {dirty
              ? 'Save your changes before downloading so the PDFs match the preview.'
              : 'Preview matches the saved paper — ready to download.'}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" disabled={dirty} className="gap-1.5">
              <a href={examPaperPdfUrl(draft.id, 'paper')} target="_blank" rel="noreferrer" aria-disabled={dirty}>
                <Download className="size-3.5" /> Download Exam Paper
              </a>
            </Button>
            <Button asChild disabled={dirty} className="gap-1.5">
              <a href={examPaperPdfUrl(draft.id, 'marking-scheme')} target="_blank" rel="noreferrer" aria-disabled={dirty}>
                <Download className="size-3.5" /> Download Marking Scheme
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ListChecks className="size-5" />
      </span>
      <p className="max-w-64 text-xs text-muted-foreground">
        Fill in the form, generate a draft, then preview and edit it before downloading the PDFs.
      </p>
    </div>
  )
}

export function ExamPaperPanel() {
  const [paper, setPaper] = useState<ExamPaper | null>(null)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
      <GenerateForm onGenerated={setPaper} />
      <div>{paper ? <PreviewAndEdit paper={paper} onDownloadReady={setPaper} /> : <EmptyState />}</div>
    </div>
  )
}
