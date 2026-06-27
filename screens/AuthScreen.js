import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import PetBackground from './PetBackground';
import API_BASE_URL from '../api'

export default function AuthScreen({ route, navigation }) {
  const { role } = route.params; 
  const { login, register, loginAsGuest, isLoading } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [resetStep, setResetStep] = useState(0); // 0 = login, 1 = bagă cod, 2 = parolă nouă
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const isHotel = role === 'manager';

  const validateEmail = (emailText) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(emailText);
  };

  const validatePassword = (passwordText) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return regex.test(passwordText);
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile!');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Eroare', 'Te rog introdu o adresă de email validă!');
      return;
    }

    if (!isLogin && !validatePassword(password)) {
      Alert.alert(
        'Parolă slabă', 
        'Parola trebuie să conțină minim 12 caractere, incluzând o literă mare, o literă mică, o cifră și un caracter special (@$!%*?&).'
      );
      return;
    }

    if (isLogin) {
      await login(email, password, role);
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

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Informație lipsă', 'Introdu adresa de email în câmpul de mai sus pentru a reseta parola.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Eroare', 'Adresa de email introdusă nu este validă.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('Succes', data.message);
        setResetStep(1);
      } else {
        Alert.alert('Eroare', data.message);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu ne-am putut conecta la server.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) return Alert.alert('Eroare', 'Te rog introdu codul primit pe email.');

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode })
      });
      const data = await res.json();
      
      if (data.success) {
        setResetStep(2); 
      } else {
        Alert.alert('Eroare', data.message);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Eroare de conexiune.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!validatePassword(newPassword)) {
      Alert.alert('Eroare', 'Parola nouă nu îndeplinește condițiile de securitate (minim 12 caractere, literă mare, mică, cifră, caracter special).');
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('Succes', 'Parola a fost schimbată! Te poți conecta acum.');
        setResetStep(0); 
        setPassword('');
        setNewPassword('');
        setResetCode('');
      } else {
        Alert.alert('Eroare', data.message);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Eroare de conexiune.');
    } finally {
      setResetLoading(false);
    }
  };


  if (resetStep === 1) {
    return (
      <PetBackground isPublic={true} imageOpacity={0.1}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setResetStep(0)}>
            <Ionicons name="arrow-back" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificare Cod</Text>
          <Text style={styles.subtitle}>Introdu codul de 6 cifre primit pe adresa {email}</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Cod din 6 cifre" 
            placeholderTextColor="#94a3b8" 
            value={resetCode} 
            onChangeText={setResetCode} 
            keyboardType="numeric" 
            maxLength={6}
          />
          <TouchableOpacity style={styles.mainBtn} onPress={handleVerifyCode} disabled={resetLoading}>
            {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Verifică Codul</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </PetBackground>
    );
  }

  if (resetStep === 2) {
    return (
      <PetBackground isPublic={true} imageOpacity={0.1}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setResetStep(0)}>
            <Ionicons name="arrow-back" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parolă Nouă</Text>
          <Text style={styles.subtitle}>Te rugăm să introduci o parolă nouă și sigură.</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Noua parolă" 
            placeholderTextColor="#94a3b8" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry 
          />
          <TouchableOpacity style={styles.mainBtn} onPress={handleSetNewPassword} disabled={resetLoading}>
            {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Salvează Parola</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </PetBackground>
    );
  }

  return (
    <PetBackground isPublic={true} imageOpacity={0.1}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#1e293b" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isHotel ? 'Bine ai venit! Ai ales să folosești aplicația cu rolul de manager. ' : 'Bine ai venit! Ai ales să folosești aplicația cu rolul de client. '}
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

      {isLogin && (
        <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading}>
          <Text style={styles.forgotPasswordText}>
            {resetLoading ? 'Se trimite email...' : 'Ai uitat parola?'}
          </Text>
        </TouchableOpacity>
      )}

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
  forgotPasswordText: { textAlign: 'center', color: '#64748b', marginTop: 15, fontSize: 14, fontWeight: '500' },
  switchText: { textAlign: 'center', color: '#2563EB', marginTop: 15, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 30 },
  guestBtn: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  guestBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16 }
});