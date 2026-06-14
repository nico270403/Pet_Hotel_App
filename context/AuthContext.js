import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {}
    setIsLoading(false);
  };

  const registerForPushNotificationsAsync = async (userId) => {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      await fetch('http://172.20.10.2:3000/api/auth/update-push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
    } catch (e) {}
  };

  const login = async (email, password, roleSelectat) => {
    setIsLoading(true);

    try {
      const res = await fetch('http://172.20.10.2:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!data.success) {
        Alert.alert('Eroare', data.message || 'Login invalid');
        return false;
      }

      const userDB = data.user;

      if (userDB.role !== roleSelectat) {
        Alert.alert(
          'Atenție',
          'Rol selectat greșit pentru acest cont'
        );
        return false;
      }

      setUser(userDB);
      await AsyncStorage.setItem('userData', JSON.stringify(userDB));

      if (userDB.id) {
        await registerForPushNotificationsAsync(userDB.id);
      }

      return true;
    } catch (e) {
      Alert.alert('Eroare', 'Server indisponibil');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password, role) => {
    setIsLoading(true);

    try {
      const res = await fetch('http://172.20.10.2:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!data.success) {
        Alert.alert('Eroare', data.message || 'Eroare register');
        return false;
      }

      const userFinal = { ...data.user, role };

      setUser(userFinal);
      await AsyncStorage.setItem('userData', JSON.stringify(userFinal));

      return true;
    } catch (e) {
      Alert.alert('Eroare', 'Server error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = (selectedRole) => {
    setUser({ role: selectedRole, isGuest: true, hotel_ids: [] });
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        register,
        logout,
        loginAsGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};