import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../auth/AuthContext'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomeScreen() {
  const { user, logout } = useAuth()

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}, {user?.name.split(' ')[0]}
            </Text>
            <Text style={styles.role}>{user?.roles?.[0] ?? 'Member'}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={logout} testID="logout-button">
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Row label="Name" value={user?.name ?? '—'} />
          <Row label="Email" value={user?.email ?? '—'} />
          <Row label="Role" value={user?.roles?.join(', ') ?? '—'} />
          <Row label="Permissions" value={String(user?.permissions?.length ?? 0)} />
        </View>

        <Text style={styles.hint}>
          Use the tabs below to check announcements{user?.roles?.includes('Parent') ? ' or your children’s records' : ''}.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  role: { fontSize: 13, color: '#7c3aed', marginTop: 2, fontWeight: '600' },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
})
