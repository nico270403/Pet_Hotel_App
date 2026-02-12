import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const { register, isLoading } = useContext(AuthContext);

  const handleRegister = async () => {
    if(!name || !email || !password) return;
    const success = await register(name, email, password, phone);
    if (success) {
      navigation.replace('Home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Creează Cont 📝</Text>

      <TextInput style={styles.input} placeholder="Nume Complet" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
      <TextInput style={styles.input} placeholder="Telefon (Opțional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
      <TextInput style={styles.input} placeholder="Parolă" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Înregistrează-te</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Ai deja cont? <Text style={styles.bold}>Loghează-te</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: 30 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16 },
  registerBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { textAlign: 'center', color: '#4b5563' },
  bold: { fontWeight: 'bold', color: '#10b981' }
});