import { useEffect, useMemo, useState } from 'react'
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
import {
  fetchAcademicYears,
  fetchAttendanceRegister,
  fetchClasses,
  resolveCurrentAcademicYearId,
  saveAttendance,
} from '../api/teacher'
import type { AttendanceStatus, SchoolClassSummary } from '../types/teacher'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Present', color: '#16a34a' },
  { value: 'absent', label: 'Absent', color: '#dc2626' },
  { value: 'late', label: 'Late', color: '#d97706' },
  { value: 'excused', label: 'Excused', color: '#6b7280' },
]

export function AttendanceScreen() {
  const [classes, setClasses] = useState<SchoolClassSummary[]>([])
  const [academicYearId, setAcademicYearId] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [date, setDate] = useState(todayIso())
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [loadingSetup, setLoadingSetup] = useState(true)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roster, setRoster] = useState<{ student_id: string; full_name: string; admission_number: string }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [classList, years] = await Promise.all([fetchClasses(), fetchAcademicYears()])
        setClasses(classList)
        setAcademicYearId(resolveCurrentAcademicYearId(years))
        if (classList.length > 0) setSelectedClassId(classList[0].id)
      } catch {
        Alert.alert('Error', 'Could not load classes.')
      } finally {
        setLoadingSetup(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedClassId || !academicYearId) return
    ;(async () => {
      setLoadingRoster(true)
      try {
        const rows = await fetchAttendanceRegister({
          school_class_id: selectedClassId,
          academic_year_id: academicYearId,
          date,
        })
        setRoster(rows)
        const initial: Record<string, AttendanceStatus> = {}
        for (const row of rows) {
          initial[row.student_id] = row.status ?? 'present'
        }
        setStatuses(initial)
      } catch {
        Alert.alert('Error', 'Could not load the register for this class and date.')
      } finally {
        setLoadingRoster(false)
      }
    })()
  }, [selectedClassId, academicYearId, date])

  const selectedClassName = useMemo(
    () => classes.find((c) => c.id === selectedClassId)?.name ?? '',
    [classes, selectedClassId]
  )

  async function handleSave() {
    if (!selectedClassId || !academicYearId) return
    setSaving(true)
    try {
      await saveAttendance({
        school_class_id: selectedClassId,
        academic_year_id: academicYearId,
        date,
        records: roster.map((r) => ({ student_id: r.student_id, status: statuses[r.student_id] ?? 'present' })),
      })
      Alert.alert('Saved', `Attendance saved for ${selectedClassName}.`)
    } catch {
      Alert.alert('Error', 'Could not save attendance.')
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
      <View style={styles.header}>
        <Text style={styles.title}>Mark Attendance</Text>
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {classes.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setSelectedClassId(c.id)}
            style={[styles.chip, selectedClassId === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedClassId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
        {classes.length === 0 && <Text style={styles.hint}>No classes found.</Text>}
      </ScrollView>

      {loadingRoster ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {roster.length === 0 && <Text style={styles.hint}>No active students found in this class.</Text>}
          {roster.map((student) => (
            <View key={student.student_id} style={styles.studentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                <Text style={styles.studentMeta}>{student.admission_number}</Text>
              </View>
              <View style={styles.statusButtons}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = statuses[student.student_id] === opt.value
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setStatuses((prev) => ({ ...prev, [student.student_id]: opt.value }))}
                      style={[styles.statusDot, { borderColor: opt.color }, active && { backgroundColor: opt.color }]}
                    >
                      <Text style={[styles.statusDotText, active && { color: '#fff' }]}>{opt.label[0]}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {roster.length > 0 && (
        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving} testID="save-attendance-button">
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save attendance'}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    minWidth: 110,
    textAlign: 'center',
  },
  chipRow: { flexGrow: 0, marginBottom: 8 },
  chip: {
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
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotText: { fontSize: 12, fontWeight: '700', color: '#374151' },
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
