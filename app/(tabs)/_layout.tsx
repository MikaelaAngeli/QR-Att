import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';

export default function TabLayout() {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    let active = true;
    setIsTeacher(false);

    if (!user) {
      return () => {
        active = false;
      };
    }

    getProfile(user.id)
      .then((profile) => {
        if (active) setIsTeacher(profile?.role === 'teacher');
      })
      .catch(() => {
        if (active) setIsTeacher(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

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
      <Tabs.Screen
        name="teacher"
        options={{
          href: isTeacher ? undefined : null,
          title: 'Teacher',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              color={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" color={color} size={22} /> }} />
    </Tabs>
  );
}  
