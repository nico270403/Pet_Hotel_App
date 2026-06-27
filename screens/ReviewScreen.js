import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../api'

export default function ReviewScreen({ route, navigation }) {
  const { booking } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    if (comment.length < 5) {
      Alert.alert("Mesaj prea scurt", "Te rugăm să ne spui câteva cuvinte despre experiență.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: booking.hotel_id,
          user_id: booking.user_id,
          booking_id: booking.id,
          rating,
          comment
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Mulțumim! 🎉", "Recenzia ta a fost salvată și îi va ajuta pe alți iubitori de animale.");
        navigation.goBack();
      } else {
        Alert.alert("Eroare", data.error || "Eroare necunoscută la server");
      }
    } catch (error) {
        Alert.alert("Eroare Tehnică", "Nu s-a putut trimite recenzia.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="star" size={50} color="#f59e0b" />
            </View>

            <Text style={styles.title}>Experiența ta contează!</Text>
            <Text style={styles.subtitle}>
              Cum s-a simțit micuțul tău la {"\n"}
              <Text style={{fontWeight: 'bold', color: '#1e293b'}}>{booking.hotel_name}</Text>?
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starTouch}>
                  <Ionicons 
                    name={s <= rating ? "star" : "star-outline"} 
                    size={42} 
                    color={s <= rating ? "#f59e0b" : "#d1d5db"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Mesajul tău (opțional):</Text>
              <TextInput
                style={styles.input}
                placeholder="Spune-ne ce ți-a plăcut sau ce putem îmbunătăți... "
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={submitReview}>
              <Text style={styles.btnText}>Trimite Recenzia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Mai târziu</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fffbeb',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#0f172a', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  
  subtitle: { 
    fontSize: 16, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 25,
    lineHeight: 22
  },

  starsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 30 
  },
  
  starTouch: {
    padding: 5,
  },

  inputWrapper: {
    width: '100%',
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 5,
  },

  input: { 
    backgroundColor: '#f1f5f9',
    padding: 15, 
    borderRadius: 15, 
    height: 120, 
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  btn: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 16, 
    paddingHorizontal: 40,
    borderRadius: 15, 
    width: '100%',
    alignItems: 'center',
    elevation: 3,
  },
  
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  cancelBtn: {
    marginTop: 15,
    padding: 10,
  },
  
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  }
});