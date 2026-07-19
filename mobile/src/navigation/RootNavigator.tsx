import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../auth/AuthContext'
import { LoginScreen } from '../screens/LoginScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen'
import { AttendanceScreen } from '../screens/AttendanceScreen'
import { GradebookScreen } from '../screens/GradebookScreen'
import { ChildrenStack } from './ChildrenStack'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  const { user } = useAuth()
  const isParent = user?.roles?.includes('Parent') ?? false
  // Same permissions the web app gates these actions behind
  // (attendance.manage / exam-marks.record) — a teacher's phone should be
  // able to do exactly what their web login can, no more, no less.
  const canMarkAttendance = user?.permissions?.includes('attendance.manage') ?? false
  const canRecordMarks = user?.permissions?.includes('exam-marks.record') ?? false

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#7c3aed' }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Announcements" component={AnnouncementsScreen} options={{ headerShown: true }} />
      {isParent && <Tab.Screen name="Children" component={ChildrenStack} />}
      {canMarkAttendance && <Tab.Screen name="Attendance" component={AttendanceScreen} />}
      {canRecordMarks && <Tab.Screen name="Gradebook" component={GradebookScreen} />}
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    )
  }

  return <NavigationContainer>{user ? <MainTabs /> : <LoginScreen />}</NavigationContainer>
}
