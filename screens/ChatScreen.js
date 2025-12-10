import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, FlatList } from "react-native";
import { api } from "../api";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollViewRef = useRef();
  const [hotels, setHotels] = useState([]);

  const send = async () => {
    if (!input.trim()) return;

    // Adaugăm mesajul utilizatorului
    setMessages(prev => [...prev, { from: "user", text: input }]);
    setInput("");

    try {
      const response = await api.sendMessage(input);

      // Dacă backend-ul trimite hoteluri
      if (response.data && response.data.length > 0) {
        setHotels(response.data);
      }

      setMessages(prev => [...prev, { from: "bot", text: response.text }]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, { from: "bot", text: "Eroare la server..." }]);
    }
  };

  // Scroll automat
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Funcție simplă de rezervare direct din chat
  const bookHotel = async (hotel) => {
    try {
      const bookingData = {
        user_id: 1, // poate fi din auth
        hotel_id: hotel.id,
        pet_type: "dog", // exemplu
        check_in: "2025-12-10",
        check_out: "2025-12-12"
      };
      const result = await api.book(bookingData);
      setMessages(prev => [...prev, { from: "bot", text: result.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { from: "bot", text: "Eroare la rezervare..." }]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={{ flex: 1, padding: 15 }}
        ref={scrollViewRef}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={{
              alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
              backgroundColor: m.from === "bot" ? "#e0f7ff" : "#cce5ff",
              padding: 10,
              borderRadius: 8,
              marginVertical: 4,
              maxWidth: "80%"
            }}
          >
            <Text style={{ color: "#000" }}>{m.text}</Text>
          </View>
        ))}

        {hotels.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Hoteluri disponibile:</Text>
            {hotels.map(hotel => (
              <TouchableOpacity
                key={hotel.id}
                onPress={() => bookHotel(hotel)}
                style={{
                  padding: 10,
                  marginVertical: 4,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8
                }}
              >
                <Text style={{ fontWeight: "bold" }}>{hotel.name}</Text>
                <Text>{hotel.city} | {hotel.rating}⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10, padding: 10 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 }}
          value={input}
          onChangeText={setInput}
          placeholder="Scrie un mesaj..."
        />
        <TouchableOpacity onPress={send} style={{ backgroundColor: "blue", padding: 10, borderRadius: 8 }}>
          <Text style={{ color: "white" }}>Trimite</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
