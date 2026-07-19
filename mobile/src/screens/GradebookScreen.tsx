import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { fetchExam, fetchExamSubject, fetchExams, saveExamMarks } from '../api/teacher'
import type { ExamResultRow, ExamSubjectSummary, ExamSummary } from '../types/teacher'

export function GradebookScreen() {
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<ExamSubjectSummary[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [maxMarks, setMaxMarks] = useState<string>('100')
  const [results, setResults] = useState<ExamResultRow[]>([])
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [loadingSetup, setLoadingSetup] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const list = await fetchExams()
        setExams(list)
        if (list.length > 0) setSelectedExamId(list[0].id)
      } catch {
        Alert.alert('Error', 'Could not load exams.')
      } finally {
        setLoadingSetup(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedExamId) return
    ;(async () => {
      setLoadingSubjects(true)
      setSelectedSubjectId(null)
      try {
        const exam = await fetchExam(selectedExamId)
        setSubjects(exam.subjects)
        if (exam.subjects.length > 0) setSelectedSubjectId(exam.subjects[0].id)
      } catch {
        Alert.alert('Error', 'Could not load subjects for this exam.')
      } finally {
        setLoadingSubjects(false)
      }
    })()
  }, [selectedExamId])

  useEffect(() => {
    if (!selectedSubjectId) return
    ;(async () => {
      setLoadingResults(true)
      try {
        const examSubject = await fetchExamSubject(selectedSubjectId)
        setMaxMarks(examSubject.max_marks)
        setResults(examSubject.results)
        const initial: Record<string, string> = {}
        for (const r of examSubject.results) {
          initial[r.student_id] = r.marks_obtained ?? ''
        }
        setMarks(initial)
      } catch {
        Alert.alert('Error', 'Could not load the gradebook for this subject.')
      } finally {
        setLoadingResults(false)
      }
    })()
  }, [selectedSubjectId])

  async function handleSave() {
    if (!selectedSubjectId) return
    setSaving(true)
    try {
      await saveExamMarks(selectedSubjectId, {
        records: results.map((r) => ({
          student_id: r.student_id,
          marks_obtained: marks[r.student_id] ? Number(marks[r.student_id]) : null,
        })),
      })
      Alert.alert('Saved', 'Marks saved — grades are computed automatically.')
    } catch {
      Alert.alert('Error', 'Could not save marks.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingSetup) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Gradebook</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {exams.map((e) => (
          <Pressable
            key={e.id}
            onPress={() => setSelectedExamId(e.id)}
            style={[styles.chip, selectedExamId === e.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedExamId === e.id && styles.chipTextActive]}>{e.name}</Text>
          </Pressable>
        ))}
        {exams.length === 0 && <Text style={styles.hint}>No exams found.</Text>}
      </ScrollView>

      {loadingSubjects ? (
        <ActivityIndicator style={{ marginVertical: 8 }} color="#7c3aed" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {subjects.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSelectedSubjectId(s.id)}
              style={[styles.subjectChip, selectedSubjectId === s.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSubjectId === s.id && styles.chipTextActive]}>
                {s.subject_name} — {s.school_class_name}
              </Text>
            </Pressable>
          ))}
          {subjects.length === 0 && !loadingSubjects && <Text style={styles.hint}>No subjects on this exam yet.</Text>}
        </ScrollView>
      )}

      {loadingResults ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {results.length === 0 && <Text style={styles.hint}>No students enrolled in this class.</Text>}
          {results.map((r) => (
            <View key={r.id} style={styles.studentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{r.student_name}</Text>
                <Text style={styles.studentMeta}>
                  {r.admission_number}
                  {r.grade ? ` · Grade ${r.grade}` : ''}
                </Text>
              </View>
              <TextInput
                style={styles.marksInput}
                keyboardType="numeric"
                value={marks[r.student_id] ?? ''}
                onChangeText={(text) => setMarks((prev) => ({ ...prev, [r.student_id]: text }))}
                placeholder={`/ ${maxMarks}`}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {results.length > 0 && (
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving} testID="save-marks-button">
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save marks'}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', padding: 16, paddingBottom: 8 },
  chipRow: { flexGrow: 0, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  subjectChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  studentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  studentMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  marksInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 14,
  },
  hint: { fontSize: 13, color: '#9ca3af', paddingHorizontal: 16, paddingVertical: 12 },
  saveButton: {
    backgroundColor: '#7c3aed',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
