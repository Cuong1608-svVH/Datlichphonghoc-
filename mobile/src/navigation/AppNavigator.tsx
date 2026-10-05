import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.bgSecondary,
            borderTopColor: theme.colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: theme.colors.primaryLight,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Đặt Phòng',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🔍</Text>,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'Lịch Sử',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📅</Text>,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Cá Nhân',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
          }}
        />
        {isAdmin && (
          <Tab.Screen
            name="Admin"
            component={AdminScreen}
            options={{
              tabBarLabel: 'Quản Trị',
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🛡️</Text>,
            }}
          />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
};
