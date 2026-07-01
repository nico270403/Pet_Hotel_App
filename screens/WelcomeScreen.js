import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PetBackground from './PetBackground';
import { Ionicons } from '@expo/vector-icons'; 

export default function WelcomeScreen({ navigation }) {
  return (
    <PetBackground isPublic={true}>
      <SafeAreaView style={styles.container}>
        
        <View style={styles.mainCenteredView}>
          
          <View style={styles.contentSection}>
            <Text style={styles.title}>Pet Hotel App</Text>

            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>Alege cum vrei să folosești aplicația</Text>
            </View>
          </View>

          <View style={styles.buttonsRow}>
            
            <View style={styles.columnWrapper}>
              <View style={[styles.bubbleBox, styles.shadow]}>
                <Text style={styles.bubbleText}>Sunt Client (Caut cazare pentru un animal)</Text>
              </View>
              <Ionicons name="arrow-down" size={26} color="#2563EB" style={styles.arrowIcon} />
              <TouchableOpacity 
                style={[styles.circleBtnClient, styles.shadow]} 
                onPress={() => navigation.navigate('Auth', { role: 'client' })}
              >
                <Text style={styles.circleTitle}>Client</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.columnWrapper}>
              <View style={[styles.bubbleBox, styles.shadow]}>
                <Text style={styles.bubbleText}>Sunt manager (Administrez unități de cazare)</Text>
              </View>
              <Ionicons name="arrow-down" size={26} color="#0d9488" style={styles.arrowIcon} />
              <TouchableOpacity 
                style={[styles.circleBtnManager, styles.shadow]} 
                onPress={() => navigation.navigate('Auth', { role: 'manager' })}
              >
                <Text style={styles.circleTitle}>Manager</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

      </SafeAreaView>
    </PetBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainCenteredView: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginTop: -50, 
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: 40, 
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  subtitleContainer: {
    borderWidth: 1.5,               
    borderColor: '#cbd5e1',           
    borderRadius: 12,                 
    paddingVertical: 12,             
    paddingHorizontal: 20,            
    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    elevation: 3,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subtitle: { 
    fontSize: 16, 
    color: '#475569', 
    textAlign: 'center',
    fontWeight: '600'                 
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  columnWrapper: {
    alignItems: 'center',
    width: '46%', 
  },
  bubbleBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 65, 
    justifyContent: 'center',
  },
  bubbleText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  arrowIcon: {
    marginVertical: 10, 
  },
  circleBtnClient: {
    width: 100,
    height: 100,
    borderRadius: 50, 
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnManager: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0d9488', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  shadow: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  }
});