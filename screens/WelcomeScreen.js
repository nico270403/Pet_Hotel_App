import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import PetBackground from './PetBackground';

export default function WelcomeScreen({ navigation }) {
  return (
    <PetBackground isPublic={true}>
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏨</Text>
        <Text style={styles.title}>Pet Hotel App</Text>

        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Alege cum vrei să folosești aplicația</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.clientBtn} 
          onPress={() => navigation.navigate('Auth', { role: 'client' })}
        >
          <Text style={styles.clientBtnText}>Sunt Client (Caut Hotel)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.hotelBtn} 
          onPress={() => navigation.navigate('Auth', { role: 'manager' })}
        >
          <Text style={styles.hotelBtnText}>Sunt Hotel (Primesc Rezervări)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </PetBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  subtitleContainer: {
    borderWidth: 1.5,               
    borderColor: '#94a3b8',           
    borderRadius: 12,                 
    paddingVertical: 12,             
    paddingHorizontal: 20,            
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#475569', 
    textAlign: 'center',
    fontWeight: '600'                 
  },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  buttonsContainer: { padding: 20, paddingBottom: 40 },
  clientBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 15, marginBottom: 15, alignItems: 'center' },
  clientBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  hotelBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center' },
  hotelBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});