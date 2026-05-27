import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ReviewScreen({ route, navigation }) {
  const { booking } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submitReview = async () => {
    try {
      console.log("Trimit recenzia pentru rezervarea:", booking.id);
      
      const response = await fetch("http://172.20.10.2:3000/api/reviews", {
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

      const text = await response.text(); 
      console.log("Răspuns brut server:", text);

      let data;
      try {
        data = JSON.parse(text); 
      } catch (parseError) {
        throw new Error(`Serverul a returnat un format invalid (posibil 404): ${text.substring(0, 50)}...`);
      }

      if (data.success) {
        Alert.alert("Mulțumim! 🎉", "Recenzia ta a fost salvată.");
        navigation.goBack();
      } else {
        Alert.alert("Eroare Backend", data.error || "Eroare necunoscută la server");
      }
    } catch (error) {
        console.error("Eroare la trimitere:", error);
        Alert.alert("Eroare Tehnică", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cum a fost șederea la {booking.hotel_name}?</Text>
      
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(s => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Text style={{ fontSize: 40 }}>{s <= rating ? "⭐" : "☆"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Scrie câteva cuvinte despre experiență..."
        multiline
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.btn} onPress={submitReview}>
        <Text style={styles.btnText}>Trimite Recenzia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  input: { borderSize: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, height: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});