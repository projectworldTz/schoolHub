import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../auth/AuthContext'
import { fetchAnnouncements } from '../api/portal'
import type { Announcement } from '../types/portal'

export function AnnouncementsScreen() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const data = await fetchAnnouncements(user.roles)
    setAnnouncements(data)
  }, [user])

  useEffect(() => {
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
  }, [load])

  async function handleRefresh() {
    setIsRefreshing(true)
    await load()
    setIsRefreshing(false)
  }

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
        data={announcements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No announcements yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.badge}>{item.audience}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>
            {item.published_at && (
              <Text style={styles.date}>{new Date(item.published_at).toLocaleDateString()}</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  list: { padding: 16, gap: 12 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  badge: {
    fontSize: 11,
    color: '#7c3aed',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  body: { fontSize: 13, color: '#4b5563', marginTop: 8, lineHeight: 19 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 10 },
})
