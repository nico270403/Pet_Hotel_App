import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from "react-native";
import { api } from "../api";

export default function ChatScreen({ navigation }) {
  // State-uri
  const [messages, setMessages] = useState([
    { 
      id: 'welcome_1', // ✅ ID unic
      from: "bot", 
      text: "Bună! 👋 Sunt asistentul tău pentru găsirea hotelurilor de animale.\n\nCum te pot ajuta astăzi?" 
    }
  ]);
  
  const [input, setInput] = useState("");
  const [hotels, setHotels] = useState([]);
  const [hotelsShown, setHotelsShown] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    "Caut hotel pentru câine în București",
    "Vreau hotel pentru pisică în Cluj",
    "Hotel pentru hamster în Timișoara"
  ]);
  
  const scrollViewRef = useRef();
  const sessionId = useRef(`session_${Date.now()}`).current;

  // ==================== FUNCȚII ====================

  // Funcție pentru generare ID unic
  const generateId = (prefix = 'msg') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Trimite mesaj
  const send = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Adaugă mesajul utilizatorului cu ID unic
    const userMessageId = generateId('user');
    setMessages(prev => [...prev, { 
      id: userMessageId,
      from: "user", 
      text: textToSend 
    }]);
    
    if (!messageText) setInput("");
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const response = await api.sendMessage(textToSend, sessionId, hotelsShown);

      // Procesează hotelurile
      if (response.hotels && response.hotels.length > 0) {
        // Asigură-te că hotelurile au ID-uri unice
        const hotelsWithIds = response.hotels.map(hotel => ({
          ...hotel,
          uniqueId: hotel.id ? hotel.id.toString() : generateId('hotel')
        }));
        
        setHotels(prev => [...prev, ...hotelsWithIds]);
        setHotelsShown(prev => [...prev, ...hotelsWithIds.map(h => h.uniqueId)]);
      }

      // Adaugă răspunsul bot-ului cu ID unic
      if (response.text) {
        const botMessageId = generateId('bot');
        setMessages(prev => [...prev, { 
          id: botMessageId,
          from: "bot", 
          text: response.text 
        }]);
      }

    } catch (err) {
      console.error("Eroare la trimitere:", err);
      const errorMessageId = generateId('error');
      setMessages(prev => [...prev, { 
        id: errorMessageId,
        from: "bot", 
        text: "Ne pare rău, a apărut o eroare. Te rog încearcă din nou." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll automat
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, hotels]);

  // Rezervă hotel
  const bookHotel = async (hotel) => {
    try {
      const bookingMessageId = generateId('user');
      setMessages(prev => [...prev, { 
        id: bookingMessageId,
        from: "user", 
        text: `Vreau să rezerv la ${hotel.name}` 
      }]);

      // const bookingData = {
      //   user_id: 1,
      //   hotel_id: hotel.id || hotel.uniqueId,
      //   pet_type: "câine",
      //   check_in: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      //   check_out: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
      // };
      
      // const result = await api.book(bookingData);
      
      // const successMessageId = generateId('bot');
      // setMessages(prev => [...prev, { 
      //   id: successMessageId,
      //   from: "bot", 
      //   text: result.message || "✅ Rezervare realizată cu succes!" 
      // }]);
      // Elimină hotelul rezervat
  //     setHotels(prev => prev.filter(h => 
  //       (h.id !== hotel.id && h.uniqueId !== hotel.uniqueId)
  //     ));
      
  //   } catch (err) {
  //     console.error("Eroare rezervare:", err);
  //     const errorMessageId = generateId('error');
  //     setMessages(prev => [...prev, { 
  //       id: errorMessageId,
  //       from: "bot", 
  //       text: "❌ Ne pare rău, nu am putut face rezervarea. Te rog încearcă din nou." 
  //     }]);
  //   }
  // };

      Alert.alert(
      "Rezervare hotel",
      "Pentru a completa rezervarea, te redirecționăm către pagina de rezervare.",
      [
        {
          text: "Anulează",
          style: "cancel"
        },
        {
          text: "OK",
          onPress: () => {
            // Navighează către ReservationScreen cu hotelId
            navigation.navigate('Reservation', { 
              hotelId: hotel.id || hotel.uniqueId,
              hotelName: hotel.name 
            });
          }
        }
      ]
    );
    
  } catch (err) {
    console.error("Eroare rezervare:", err);
    const errorMessageId = generateId('error');
    setMessages(prev => [...prev, { 
      id: errorMessageId,
      from: "bot", 
      text: "❌ Pentru a face rezervare, completează formularul din pagina de rezervare." 
    }]);
  }
};
      

  // ==================== RENDER ====================

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Chat messages area */}
      <ScrollView 
        style={{ flex: 1, padding: 15 }} 
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mesaje */}
        {messages.map((m) => (
          <View
            key={m.id} // ✅ ID unic pentru fiecare mesaj
            style={{
              alignSelf: m.from === "bot" ? "flex-start" : "flex-end",
              backgroundColor: m.from === "bot" ? "#ffffff" : "#007AFF",
              padding: 12,
              borderRadius: 16,
              marginVertical: 4,
              maxWidth: "80%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <Text style={{ 
              color: m.from === "bot" ? "#000" : "#fff",
              fontSize: 15,
              lineHeight: 20
            }}>
              {m.text}
            </Text>
          </View>
        ))}

        {/* Hoteluri găsite */}
        {hotels.length > 0 && (
          <View style={{ marginTop: 15, marginBottom: 10 }}>
            <View style={{
              backgroundColor: "#f0f9ff",
              padding: 12,
              borderRadius: 12,
              marginBottom: 10,
              borderLeftWidth: 4,
              borderLeftColor: "#007AFF"
            }}>
              <Text style={{ 
                fontSize: 15, 
                fontWeight: "600",
                color: "#333"
              }}>
                🏨 {hotels.length} {hotels.length === 1 ? 'hotel găsit' : 'hoteluri găsite'}
              </Text>
              <Text style={{ 
                fontSize: 13, 
                color: "#666",
                marginTop: 4
              }}>
                Apasă pe un hotel pentru a face rezervare
              </Text>
            </View>
            
            {hotels.map((hotel) => (
              <TouchableOpacity
                key={hotel.uniqueId || hotel.id || generateId('hotel_item')} // ✅ Cheie unică
                onPress={() => bookHotel(hotel)}
                style={{
                  backgroundColor: "#fff",
                  padding: 15,
                  marginVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 3
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontWeight: "bold", 
                      fontSize: 16,
                      color: "#333",
                      marginBottom: 5
                    }}>
                      {hotel.name || "Hotel fără nume"}
                    </Text>
                    <Text style={{ 
                      color: "#666",
                      fontSize: 14,
                      marginBottom: 8
                    }}>
                      📍 {hotel.city || "Oraș necunoscut"}
                    </Text>
                  </View>
                  {hotel.rating && (
                    <View style={{
                      backgroundColor: "#ffd700",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 15,
                      minWidth: 50,
                      alignItems: "center"
                    }}>
                      <Text style={{ 
                        fontWeight: "bold",
                        fontSize: 14,
                        color: "#333"
                      }}>
                        ⭐ {hotel.rating}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={{
                  backgroundColor: "#007AFF",
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 8
                }}>
                  <Text style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    📅 Rezervă acum →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Indicator de încărcare */}
        {isLoading && (
          <View
            key={generateId('loading')} // ✅ Cheie unică
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 16,
              marginVertical: 4,
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
            <Text style={{ color: "#666", fontSize: 14 }}>
              Se procesează...
            </Text>
          </View>
        )}

        {/* Quick replies */}
        {quickReplies.length > 0 && !isLoading && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
              Sugestii rapide:
            </Text>
            {quickReplies.map((reply, idx) => (
              <TouchableOpacity
                key={`quick_${idx}_${Date.now()}`} // ✅ Cheie unică
                onPress={() => send(reply)}
                style={{
                  backgroundColor: "#f0f0f0",
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  borderRadius: 20,
                  marginVertical: 3,
                  alignSelf: "flex-start",
                  borderWidth: 1,
                  borderColor: "#e0e0e0"
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#007AFF", fontSize: 14 }}>
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      <View style={{ 
        flexDirection: "row", 
        gap: 10, 
        padding: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        alignItems: "center"
      }}>
        <TextInput
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderColor: "#ddd", 
            paddingHorizontal: 15,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: "#f9f9f9",
            fontSize: 15,
            minHeight: 40,
            maxHeight: 100
          }}
          value={input}
          onChangeText={setInput}
          placeholder="Scrie un mesaj..."
          placeholderTextColor="#999"
          editable={!isLoading}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline={true}
          blurOnSubmit={false}
        />
        
        <TouchableOpacity 
          onPress={() => send()}
          disabled={isLoading || !input.trim()}
          style={{ 
            backgroundColor: (isLoading || !input.trim()) ? "#ccc" : "#007AFF",
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#007AFF",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 3
          }}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ 
              color: "white", 
              fontWeight: "600",
              fontSize: 16
            }}>
              ➤
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}