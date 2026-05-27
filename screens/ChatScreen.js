import React, { useState, useRef, useEffect, useContext } from "react";
import { 
  View, TextInput, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { api } from "../api";
import { AuthContext } from "../context/AuthContext";

export default function ChatScreen({ navigation, route }) {
  
  const { user } = useContext(AuthContext);
  
  const [savedPetName] = useState(route.params?.petName || "");
  const [savedPetType] = useState(route.params?.petType || "animal");

  const [messages, setMessages] = useState([
    { 
      id: 'welcome_1',
      from: "bot", 
      text: "Bună! 👋 Sunt asistentul tău pentru găsirea și rezervarea hotelurilor de animale.\n\nCum te pot ajuta astăzi?" 
    }
  ]);
  
  const [input, setInput] = useState("");
  const [hotels, setHotels] = useState([]);
  const [hotelsShown, setHotelsShown] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    "Caut hotel pentru câine în București",
    "Vreau hotel pentru pisică în Cluj",
    "Hotel pentru hamster în Timișoara",
    "Vreau să fac o rezervare"
  ]);
  
  const [isReservationMode, setIsReservationMode] = useState(false);
  const [reservationStep, setReservationStep] = useState(null);
  const [reservationData, setReservationData] = useState({
    petName: "", petType: "", ownerName: "", ownerEmail: "", ownerPhone: "", checkIn: "", checkOut: "", specialRequests: ""
  });
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hideHotels, setHideHotels] = useState(false);
  const [pendingPetSearch, setPendingPetSearch] = useState(null);

  const scrollViewRef = useRef();
  const sessionId = useRef(`session_${Date.now()}`).current;

  useEffect(() => {
    if (route?.params?.initialPrompt) {
      const prompt = route.params.initialPrompt;
      
      const welcomeMsgId = generateId('bot_welcome_pet');
      setMessages(prev => [...prev, {
        id: welcomeMsgId,
        from: "bot",
        text: `Am primit datele pentru ${savedPetName}! 🐾\n\nPentru a-ți oferi cele mai bune recomandări, în ce oraș cauți hotelul?`
      }]);
      
      setPendingPetSearch(prompt);
      setQuickReplies(["În București", "În Cluj", "În Timișoara", "În Brașov"]);
      navigation.setParams({ initialPrompt: null }); 
    }
  }, [route?.params?.initialPrompt]);

  const generateId = (prefix = 'msg') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
  const validateDate = (dateStr) => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date >= today;
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "Data invalida";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Data invalida";
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const askQuestion = (question) => {
    setMessages(prev => [...prev, { id: generateId('bot'), from: "bot", text: question }]);
  };

  const send = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    if (!messageText) setInput("");
    
    setMessages(prev => [...prev, { id: generateId('user'), from: "user", text: textToSend }]);

    if (isReservationMode && reservationStep) {
      await processReservationStep(textToSend);
      return;
    }

    if (textToSend.toLowerCase().includes("rezerv") || textToSend.toLowerCase() === "vreau să fac o rezervare") {
      startReservationFlow();
      return;
    }

    let apiPrompt = textToSend;
    if (pendingPetSearch) {
      apiPrompt = `${pendingPetSearch} Te rog să-mi recomanzi hoteluri pentru el în zona/orașul ${textToSend}.`;
      setPendingPetSearch(null);
    } else if (savedPetName) {
      apiPrompt = `[Context ascuns: Utilizatorul vorbește despre animalul său, un ${savedPetType} pe nume ${savedPetName}. Răspunde natural, nu-l mai întreba cum îl cheamă sau ce e.]\n\n` + textToSend;
    }

    setIsLoading(true);
    setQuickReplies([]);
    try {
      const currentHistory = [...messages, { id: generateId('user'), from: "user", text: textToSend }];
      
      const response = await api.sendMessage(apiPrompt, sessionId, hotelsShown, currentHistory);
      
      if (response.hotels && response.hotels.length > 0) {
        const hotelsWithIds = response.hotels.map(h => ({ 
          ...h, 
          uniqueId: h.id ? h.id.toString() : generateId('hotel') 
        }));
        setHotels(prev => [...prev, ...hotelsWithIds]);
        setHotelsShown(prev => [...prev, ...hotelsWithIds.map(h => h.uniqueId)]);
      
      }

      if (response.text) askQuestion(response.text);
    } catch (err) {
      askQuestion("Ne pare rău, a apărut o eroare de comunicare. Te rog încearcă din nou.");
    } finally {
      setIsLoading(false);
    }
  };

  const startReservationFlow = (hotel = null) => {
    setHideHotels(true);
    setIsReservationMode(true);
    setQuickReplies([]);
    if (hotel) setSelectedHotel(hotel);
    
    if (savedPetName) {
      setReservationData(prev => ({ ...prev, petName: savedPetName, petType: savedPetType }));
      
      if (user && user.name) {
        setReservationData(p => ({ ...p, ownerName: user.name }));
        if (user.email) {
          setReservationData(p => ({ ...p, ownerEmail: user.email }));
          setReservationStep('ownerPhone');
          askQuestion(`🏨 Rezervare la "${hotel ? hotel.name : 'hotel'}".\n\nAm completat automat datele pentru **${savedPetName}** și datele tale de cont.\n\n**Pasul 5:** Care este numărul tău de telefon?`);
        } else {
          setReservationStep('ownerEmail');
          askQuestion(`🏨 Rezervare la "${hotel ? hotel.name : 'hotel'}".\n\nAm completat automat datele pentru **${savedPetName}** și numele tău.\n\n**Pasul 4:** Care este adresa ta de email?`);
        }
      } else {
        setReservationStep('ownerName');
        askQuestion(`🏨 Rezervare la "${hotel ? hotel.name : 'hotel'}".\n\nAm preluat automat datele pentru **${savedPetName}**.\n\n**Pasul 3:** Care este numele tău complet?`);
      }
    } else {
      setReservationStep('petName');
      const introMsg = hotel 
        ? `🏨 Rezervare la "${hotel.name}".\n\n**Pasul 1:** Care este numele animalului tău?`
        : "Să începem rezervarea!\n\n**Pasul 1:** Care este numele animalului tău?";
      askQuestion(introMsg);
    }
  };

  const processReservationStep = async (userInput) => {
    const trimmedInput = userInput.trim();

    if (trimmedInput.toLowerCase() === "anulează" || trimmedInput.toLowerCase() === "anuleaza") {
      cancelReservation();
      return;
    }

    switch (reservationStep) {
      case 'petName':
        setReservationData(p => ({ ...p, petName: trimmedInput }));
        setReservationStep('petType');
        askQuestion("**Pasul 2:** Ce tip de animal este? (ex: câine, pisică)");
        break;
      case 'petType':
        setReservationData(p => ({ ...p, petType: trimmedInput }));
        setReservationStep('ownerName');
        
        if (user && user.name) {
            setReservationData(p => ({ ...p, ownerName: user.name }));
            setReservationStep('ownerEmail'); 
            
            if (user.email) {
                 setReservationData(p => ({ ...p, ownerEmail: user.email }));
                 setReservationStep('ownerPhone');
                 askQuestion(`**Pasul 5:** Numărul tău de telefon? (Am completat automat: ${user.name}, ${user.email})`);
            } else {
                 askQuestion(`**Pasul 4:** Care este adresa ta de email? (Nume: ${user.name})`);
            }
        } else {
            askQuestion("**Pasul 3:** Care este numele tău complet?");
        }
        break;
      case 'ownerName':
        setReservationData(p => ({ ...p, ownerName: trimmedInput }));
        setReservationStep('ownerEmail');
        askQuestion("**Pasul 4:** Care este adresa ta de email?");
        break;
      case 'ownerEmail':
        if (!validateEmail(trimmedInput)) return askQuestion("⚠️ Email invalid. Încearcă din nou.");
        setReservationData(p => ({ ...p, ownerEmail: trimmedInput }));
        setReservationStep('ownerPhone');
        askQuestion("**Pasul 5:** Numărul tău de telefon?");
        break;
      case 'ownerPhone':
        if (!validatePhone(trimmedInput)) return askQuestion("⚠️ Telefon invalid (10 cifre).");
        setReservationData(p => ({ ...p, ownerPhone: trimmedInput }));
        setReservationStep('checkIn');
        askQuestion("**Pasul 6:** Data check-in (AAAA-LL-ZZ)");
        break;
      case 'checkIn':
        if (!validateDate(trimmedInput)) return askQuestion("⚠️ Dată invalidă (AAAA-LL-ZZ).");
        setReservationData(p => ({ ...p, checkIn: trimmedInput }));
        setReservationStep('checkOut');
        askQuestion("**Pasul 7:** Data check-out (AAAA-LL-ZZ)");
        break;
      case 'checkOut':
        if (!validateDate(trimmedInput) || new Date(trimmedInput) <= new Date(reservationData.checkIn)) {
          return askQuestion("⚠️ Data de check-out trebuie să fie validă și DUPĂ data de check-in.");
        }
        setReservationData(p => ({ ...p, checkOut: trimmedInput }));
        setReservationStep('specialRequests');
        askQuestion("**Pasul 8:** Cerințe speciale? (sau scrie 'fara')");
        break;
      case 'specialRequests':
        const finalRequests = trimmedInput.toLowerCase() === 'fara' ? '' : trimmedInput;
        const completeData = { ...reservationData, specialRequests: finalRequests };
        setReservationData(completeData);
        setReservationStep('confirmation');
        
        const price = selectedHotel?.pricePerNight || selectedHotel?.price_from || 100;
        const diffTime = Math.abs(new Date(completeData.checkOut) - new Date(completeData.checkIn));
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const total = price * nights;

        const summary = `📋 **SUMAR REZERVARE**\n\n🏨 **Hotel:** ${selectedHotel?.name || 'Hotel'}\n💰 **Total:** ${total} RON (${nights} nopți)\n🐾 **Animal:** ${completeData.petName}\n👤 **Proprietar:** ${completeData.ownerName}\n📅 **Perioadă:** ${formatDateForDisplay(completeData.checkIn)} - ${formatDateForDisplay(completeData.checkOut)}\n\nConfirmi rezervarea? **(Da/Nu)**`;
        askQuestion(summary);
        setQuickReplies(['Da', 'Nu']);
        break;
      case 'confirmation':
        if (trimmedInput.toLowerCase() === 'da') {
          setIsLoading(true);
          try {
            await confirmReservation();
          } finally {
            setIsLoading(false);
          }
        } else if (trimmedInput.toLowerCase() === 'nu') {
          cancelReservation();
        } else {
          askQuestion("⚠️ Te rog răspunde cu 'Da' pentru a confirma sau 'Nu' pentru a anula.");
        }
        break;
    }
  };

  const confirmReservation = async () => {
    try {
      const diffTime = Math.abs(new Date(reservationData.checkOut) - new Date(reservationData.checkIn));
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      const total = (selectedHotel?.pricePerNight || selectedHotel?.price_from || 100) * nights;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://172.20.10.2:3000/api/book/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          hotel_id: selectedHotel?.id || null,
          user_id: user ? user.id : 1,
          pet_name: reservationData.petName,
          pet_type: reservationData.petType,
          owner_name: reservationData.ownerName,
          owner_email: reservationData.ownerEmail,
          owner_phone: reservationData.ownerPhone,
          check_in: reservationData.checkIn,
          check_out: reservationData.checkOut,
          price: total
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      if (response.ok && result.success) {
        askQuestion("✅ **REZERVARE TRIMISĂ CU SUCCES!**\n\nCererea ta a fost procesată. Vei primi un email de confirmare în scurt timp. 🐾");
        resetReservation();
      } else {
        throw new Error(result.message || 'Eroare necunoscută la server.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        askQuestion("❌ Eroare Timeout: Serverul nu a răspuns. Verifică conexiunea.");
      } else {
        askQuestion("❌ Eroare la trimiterea rezervării. Încearcă din nou.");
      }
    }
  };

  const cancelReservation = () => {
    askQuestion("❌ Rezervarea a fost anulată.");
    resetReservation();
  };

  const resetReservation = () => {
    setIsReservationMode(false);
    setReservationStep(null);
    setReservationData({ 
      petName: savedPetName || "", 
      petType: savedPetType || "", 
      ownerName: "", ownerEmail: "", ownerPhone: "", checkIn: "", checkOut: "", specialRequests: "" 
    });
    setSelectedHotel(null);
    setHideHotels(false);
    setQuickReplies(["Caut hotel pentru câine în București", "Vreau hotel pentru pisică în Cluj", "Vreau să fac o rezervare"]);
  };

  const bookHotel = (hotel) => {
    Alert.alert(
      "Rezervare hotel",
      `Vrei să faci o rezervare la ${hotel.name}?`,
      [
        { text: "Anulează", style: "cancel" },
        { text: "În chat", onPress: () => startReservationFlow(hotel) },
        { text: "Formular", onPress: () => navigation.navigate('Reservation', { hotelId: hotel.id, hotelName: hotel.name }) }
      ]
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, hotels]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView style={styles.chatContainer} ref={scrollViewRef} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.messageContainer, m.from === "bot" ? styles.botMessage : styles.userMessage]}>
            <Text style={[styles.messageText, m.from === "bot" ? styles.botMessageText : styles.userMessageText]}>{m.text}</Text>
          </View>
        ))}

        {hotels.length > 0 && !hideHotels && !isReservationMode && (
          <View style={styles.hotelsSection}>
            <Text style={styles.hotelsTitle}>🏨 {hotels.length} hoteluri găsite:</Text>
            {hotels.map((hotel) => (
              <TouchableOpacity key={hotel.uniqueId} onPress={() => bookHotel(hotel)} style={styles.hotelCard} activeOpacity={0.7}>
                <View style={styles.hotelHeader}>
                  <View style={{flex: 1}}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    <Text style={styles.hotelCity}>📍 {hotel.city}</Text>
                  </View>
                  {hotel.rating && (
                    <View style={styles.ratingContainer}><Text style={styles.ratingText}>⭐ {hotel.rating}</Text></View>
                  )}
                </View>
                <Text style={styles.priceText}>💰 {hotel.pricePerNight || hotel.price_from || 100} RON/noapte</Text>
                <View style={styles.bookButton}><Text style={styles.bookButtonText}>📅 Rezervă acum →</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}> Se procesează...</Text>
          </View>
        )}

        {quickReplies.length > 0 && !isLoading && (
          <View style={styles.quickRepliesContainer}>
            {quickReplies.map((r, i) => (
              <TouchableOpacity key={i} onPress={() => send(r)} style={styles.quickReplyButton} activeOpacity={0.7}>
                <Text style={styles.quickReplyText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isReservationMode && (
          <View style={styles.reservationIndicator}>
            <Text style={styles.reservationIndicatorText}>
              🏨 Rezervare activă - Pasul {getReservationStepNumber(reservationStep)}/9
            </Text>
            <TouchableOpacity onPress={cancelReservation} style={styles.cancelReservationButton}>
              <Text style={{color:'#fff'}}>❌ Anulează</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput style={styles.textInput} value={input} onChangeText={setInput} placeholder="Scrie aici..." onSubmitEditing={() => send()} editable={!isLoading} />
        <TouchableOpacity onPress={() => send()} disabled={!input.trim() || isLoading} style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}><Text style={{color:'#fff', fontSize: 16}}>➤</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getReservationStepNumber = (step) => {
  const steps = {
    'petName': 1, 'petType': 2, 'ownerName': 3, 'ownerEmail': 4, 'ownerPhone': 5, 'checkIn': 6, 'checkOut': 7, 'specialRequests': 8, 'confirmation': 9
  };
  return steps[step] || 1;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  chatContainer: { flex: 1, padding: 15 },
  chatContent: { paddingBottom: 20 },
  messageContainer: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: "80%" },
  botMessage: { alignSelf: "flex-start", backgroundColor: "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#007AFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  botMessageText: { color: "#000" },
  userMessageText: { color: "#fff" },
  hotelsSection: { marginTop: 15, marginBottom: 10 },
  hotelsTitle: { fontWeight: "bold", fontSize: 15, marginBottom: 10, color: "#333" },
  hotelCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  hotelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hotelName: { fontWeight: "bold", fontSize: 16, color: "#333", marginBottom: 5 },
  hotelCity: { color: "#666", fontSize: 14, marginBottom: 8 },
  ratingContainer: { backgroundColor: "#ffd700", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, alignItems: 'center' },
  ratingText: { fontWeight: "bold", fontSize: 14, color: "#333" },
  priceText: { color: "#007AFF", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  bookButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 8 },
  bookButtonText: { color: "#fff", fontWeight: "600", textAlign: "center", fontSize: 14 },
  loadingContainer: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderRadius: 16, alignSelf: "flex-start", marginVertical: 4, alignItems: "center" },
  loadingText: { color: "#666", fontSize: 14, marginLeft: 8 },
  quickRepliesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  quickReplyButton: { backgroundColor: "#f0f0f0", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, margin: 4, borderWidth: 1, borderColor: "#e0e0e0" },
  quickReplyText: { color: "#007AFF", fontSize: 14 },
  inputContainer: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0e0e0", alignItems: "center", gap: 10 },
  textInput: { flex: 1, backgroundColor: "#f9f9f9", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", fontSize: 15 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center", shadowColor: "#007AFF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  sendButtonDisabled: { backgroundColor: "#ccc", shadowOpacity: 0 },
  reservationIndicator: { padding: 12, backgroundColor: "#e6f7ff", borderRadius: 12, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: "#b3e0ff" },
  reservationIndicatorText: { color: "#007AFF", fontWeight: "600", fontSize: 14, marginBottom: 8 },
  cancelReservationButton: { backgroundColor: "#ff4444", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 }
});