import React, { useContext } from 'react';
import { ImageBackground, View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function PetBackground({ children, style, rightSlot, leftSlot, isPublic, imageOpacity = 0.3 }) {
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert("Deconectare", "Ești sigur că vrei să te deconectezi?", [
      { text: "Anulează", style: "cancel" },
      { text: "Da, deconectează-mă ", onPress: logout, style: "destructive" }
    ]);
  };

  return (
    <ImageBackground 
      source={require('../assets/paws-bg.png')} 
      style={styles.backgroundImage}
      imageStyle={[styles.imagePattern, { opacity: imageOpacity }]}
    >
      <View style={[styles.overlay, style]}>
        
        { !isPublic && (
        <View style={styles.topBar}>
          
          <View style={styles.leftContainer}>
            {leftSlot}
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}> Deconectare</Text>
            </TouchableOpacity>
            
            {rightSlot && (
              <View style={styles.slotContainer}>
                {rightSlot}
              </View>
            )}
          </View>
        </View>
        )}

        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  imagePattern: { resizeMode: 'repeat' },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  leftContainer: {
    flex: 1,
    paddingRight: 15,
    justifyContent: 'center',
    paddingTop: 5,
  },
  rightActions: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  slotContainer: {
    marginTop: 10, 
  }
});