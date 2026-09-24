import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 65,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ 
        title: 'Home', tabBarIcon: ({ color }) => 
        <Ionicons name="home-outline" 
        color={color} size={22} /> 
        }} />
      <Tabs.Screen name="scan" options={{
         title: 'Scan', tabBarIcon: ({ color }) => <Ionicons name="qr-code-outline" color={color} size={22} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }) => <Ionicons name="time-outline" color={color} size={22} /> }} />
      <Tabs.Screen name="teacher" options={{ title: 'Teacher', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={22} /> }} />
    </Tabs>
  );
}  
