import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, logout, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    if(!email || !password) {
      Alert.alert("Eroare", "Te rog introdu email și parolă");
      return;
    }
    const success = await login(email, password);
    if (success) {
      navigation.replace('Home');
    }
  };

  const handleGuestEntry = async () => {
    await logout(); 
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐾</Text> 
      <Text style={styles.title}>Pet Hotel</Text>
      <Text style={styles.subtitle}>Bine ai venit înapoi!</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Parolă" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Autentificare</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Nu ai cont? <Text style={styles.bold}>Înregistrează-te</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestBtn} onPress={handleGuestEntry}>
        <Text style={styles.guestText}>Continuă ca Oaspete (Fără cont) →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9fafb' },
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: 5 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#6b7280', marginBottom: 40 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
  loginBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { textAlign: 'center', color: '#4b5563', marginBottom: 30 },
  bold: { fontWeight: 'bold', color: '#2563eb' },
  guestBtn: { padding: 15, alignItems: 'center' },
  guestText: { color: '#6b7280', fontSize: 15 }
});