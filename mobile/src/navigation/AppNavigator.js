import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TransactionScreen from '../screens/TransactionScreen';
import ProductsScreen from '../screens/ProductsScreen';
import RestockScreen from '../screens/RestockScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AlertsScreen from '../screens/AlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useContext(AuthContext);
  const isOwner = user?.role === 'owner';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#16a34a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#6b7280'
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: () => <Text>🏠</Text>
        }}
      />
      <Tab.Screen
        name="Transaction"
        component={TransactionScreen}
        options={{
          title: 'Kasir',
          tabBarIcon: () => <Text>⚡</Text>
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: 'Produk',
          tabBarIcon: () => <Text>📦</Text>
        }}
      />
      {isOwner && (
        <Tab.Screen
          name="Restock"
          component={RestockScreen}
          options={{
            title: 'Kulakan',
            tabBarIcon: () => <Text>🚚</Text>
          }}
        />
      )}
      {isOwner && (
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            title: 'Laporan',
            tabBarIcon: () => <Text>📊</Text>
          }}
        />
      )}
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Notifikasi',
          tabBarIcon: () => <Text>🔔</Text>
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

