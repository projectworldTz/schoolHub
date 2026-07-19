import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import type { RouteProp } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import { fetchChildAttendance, fetchChildHomework, fetchChildResults } from '../api/portal'
import type { AttendanceRecord, ExamResultGroup, HomeworkSubmission } from '../types/portal'
import type { ChildrenStackParamList } from '../navigation/types'

type Section = 'attendance' | 'homework' | 'results'

const STATUS_COLOR: Record<string, string> = {
  present: '#059669',
  absent: '#dc2626',
  late: '#d97706',
  excused: '#6b7280',
}

export function ParentChildDetailScreen() {
  const route = useRoute<RouteProp<ChildrenStackParamList, 'ChildDetail'>>()
  const { studentId } = route.params
  const [section, setSection] = useState<Section>('attendance')
  const [isLoading, setIsLoading] = useState(true)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [homework, setHomework] = useState<HomeworkSubmission[]>([])
  const [results, setResults] = useState<ExamResultGroup[]>([])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetchChildAttendance(studentId).then(setAttendance),
      fetchChildHomework(studentId).then(setHomework),
      fetchChildResults(studentId).then(setResults),
    ]).finally(() => setIsLoading(false))
  }, [studentId])

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.tabs}>
        {(['attendance', 'homework', 'results'] as const).map((s) => (
          <Pressable
            key={s}
            style={[styles.tab, section === s && styles.tabActive]}
            onPress={() => setSection(s)}
          >
            <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : section === 'attendance' ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={attendance}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="No attendance records yet." />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{item.date}</Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
            </View>
          )}
        />
      ) : section === 'homework' ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={homework}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="No homework recorded yet." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.homework_title}</Text>
              <Text style={styles.meta}>
                {item.subject_name ?? 'General'} · Due {item.due_date ?? '—'}
              </Text>
              <Text style={styles.meta}>
                Status: {item.status}
                {item.grade ? ` · Grade: ${item.grade}` : ''}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={results}
          keyExtractor={(item) => item.exam_id}
          ListEmptyComponent={<EmptyState text="No exam results recorded yet." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.exam_name}</Text>
              {item.subjects.map((s, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowLabel}>{s.subject_name}</Text>
                  <Text style={styles.meta}>
                    {s.marks_obtained ?? '—'}/{s.max_marks} {s.grade ? `(${s.grade})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rowLabel: { fontSize: 13, color: '#111827' },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
})
