import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import PetBackground from './PetBackground';

export default function AuthScreen({ route, navigation }) {
  const { role } = route.params; 
  const { login, register, loginAsGuest, isLoading } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isHotel = role === 'manager';

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile!');
      return;
    }

    if (isLogin) {
      const ok = await login(email, password, role);
      if (ok) {
      }
    } else {
      const ok = await register(name, email, password, role);
      if (ok) {
        if (isHotel) {
          navigation.replace('AddHotel'); 
        } else {
          Alert.alert('Succes', 'Cont creat cu succes!');
        }
      }
    }
  };

  const handleGuest = () => {
    loginAsGuest(role);
  };

  return (
    <PetBackground isPublic={true} imageOpacity={0.1}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#1e293b" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isHotel ? 'Parteneriat Hotel 🏨' : 'Bine ai venit! '}
      </Text>
      <Text style={styles.subtitle}>
        {isLogin ? 'Conectează-te la contul tău' : 'Creează un cont nou'}
      </Text>

      {!isLogin && (
        <TextInput 
          style={styles.input} 
          placeholder={isHotel ? "Numele Managerului" : "Numele tău"} 
          placeholderTextColor="#94a3b8" 
          value={name} 
          onChangeText={setName} 
        />
      )}
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#94a3b8" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Parolă" 
        placeholderTextColor="#94a3b8" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <TouchableOpacity style={styles.mainBtn} onPress={handleAuth} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{isLogin ? 'Conectare' : 'Creează Cont'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? 'Nu ai cont? Creează unul' : 'Ai deja cont? Conectează-te'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.guestBtn} onPress={handleGuest}>
        <Text style={styles.guestBtnText}>Continuă ca Oaspete</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
    </PetBackground>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 5, marginTop: 40 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 15, backgroundColor: '#f8fafc' },
  mainBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  switchText: { textAlign: 'center', color: '#2563EB', marginTop: 20, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 30 },
  guestBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  guestBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16 }
});