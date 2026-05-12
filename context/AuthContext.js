import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Asta face ca notificarea să apară ca un banner sus, chiar dacă utilizatorul are aplicația deschisă
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);


  const registerForPushNotificationsAsync = async (userId) => {
    let token;

    // 1. Verificăm dacă e un telefon fizic (emulatoarele nu primesc notificări push)
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // 2. Cerem permisiunea (apare popup-ul cu "Allow notifications")
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Permisiunea pentru notificări a fost refuzată!');
        return;
      }
      
      // 3. Generăm token-ul
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("📱 Expo Push Token obținut:", token);

        // 4. Trimitem token-ul către BACKEND-ul tău (ruta făcută adineauri)
        await fetch('http://172.20.10.2:3000/api/auth/update-push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId, token: token })
        });
        
        console.log("✅ Token salvat în baza de date pentru userul:", userId);
      } catch (error) {
        console.error("❌ Eroare la generarea sau trimiterea token-ului:", error);
      }
    } else {
      console.log('⚠️ Notificările push funcționează doar pe un dispozitiv fizic!');
    }

    // Configurare specifică pentru Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log("Eroare la citirea userului:", e);
    }
    setIsLoading(false);
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://172.20.10.2:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) 
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await registerForPushNotificationsAsync(data.user.id);
        return true; 
      } else {
        Alert.alert("Eroare", data.message || "Date incorecte");
        return false;
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Serverul nu răspunde. Verifică conexiunea.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://172.20.10.2:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        return true;
      } else {
        Alert.alert("Eroare", data.message || "Nu s-a putut crea contul");
        return false;
      }
    } catch (error) {
      Alert.alert("Eroare", "Server error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    setUser(null); 
    await AsyncStorage.removeItem('userData'); 
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};