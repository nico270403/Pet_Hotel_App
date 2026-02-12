import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

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