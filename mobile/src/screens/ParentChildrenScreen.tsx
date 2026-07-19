import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { fetchChildren } from '../api/portal'
import type { Child } from '../types/portal'
import type { ChildrenStackParamList } from '../navigation/types'

export function ParentChildrenScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ChildrenStackParamList, 'ChildrenList'>>()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChildren()
      .then(setChildren)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.list}
        data={children}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No children linked to this account yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('ChildDetail', { studentId: item.id, studentName: item.full_name })}
          >
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.meta}>
              {item.current_enrollment?.school_class_name ?? 'No class'} · Admission #{item.admission_number}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  list: { padding: 16, gap: 12 },
  emptyText: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
})
