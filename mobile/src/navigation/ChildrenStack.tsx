import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ParentChildrenScreen } from '../screens/ParentChildrenScreen'
import { ParentChildDetailScreen } from '../screens/ParentChildDetailScreen'
import type { ChildrenStackParamList } from './types'

const Stack = createNativeStackNavigator<ChildrenStackParamList>()

export function ChildrenStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChildrenList" component={ParentChildrenScreen} options={{ title: 'My Children' }} />
      <Stack.Screen
        name="ChildDetail"
        component={ParentChildDetailScreen}
        options={({ route }) => ({ title: route.params.studentName })}
      />
    </Stack.Navigator>
  )
}
