import React, { useState, useRef, useEffect, useContext } from "react";
import { 
  View, TextInput, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet, Keyboard
} from "react-native";
import { api } from "../api";
import { AuthContext } from "../context/AuthContext";
import PetBackground from "./PetBackground";
import API_BASE_URL from '../api'
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen({ navigation, route }) {
  
  const { user } = useContext(AuthContext);
  
  const [savedPetName] = useState(route.params?.petName);
  const [savedPetType] = useState(route.params?.petType);
  const [detectedPetType, setDetectedPetType] = useState("");

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
      setQuickReplies(["În București", "În Cluj", "În Timișoara"]);
      navigation.setParams({ initialPrompt: null }); 
    }
  }, [route?.params?.initialPrompt]);

  const generateId = (prefix = 'msg') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ''));
  
  const checkDateValidity = (dateStr, minDateStr = null) => {
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return { valid: false, reason: "format" };
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
        return { valid: false, reason: "not_exist" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
        return { valid: false, reason: "past" };
    }

    if (minDateStr) {
       const [my, mm, md] = minDateStr.split('-').map(Number);
       const minD = new Date(my, mm - 1, md);
       minD.setHours(0,0,0,0);
       if (date <= minD) {
           return { valid: false, reason: "before_checkin" };
       }
    }

    return { valid: true };
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "Data invalidă";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Data invalidă";
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const askQuestion = (question) => {
    setMessages(prev => [...prev, { id: generateId('bot'), from: "bot", text: question }]);
  };

  const send = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    if (!messageText) setInput("");

    setHotels([]);
    
    setMessages(prev => [...prev, { id: generateId('user'), from: "user", text: textToSend }]);

    if (isReservationMode && reservationStep) {
      await processReservationStep(textToSend);
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
      
      if (response.context && response.context.animal) {
        setDetectedPetType(response.context.animal);
      }
      if (response.hotels && response.hotels.length > 0) {
        const hotelsWithIds = response.hotels.map(h => ({ 
          ...h, 
          uniqueId: h.id ? h.id.toString() : generateId('hotel') 
        }));
        setHotels(hotelsWithIds);
        setHotelsShown(prev => [...prev, ...hotelsWithIds.map(h => h.uniqueId)]);
      }

      if (response.text) askQuestion(response.text);
    } catch (err) {
      askQuestion("Ne pare rău, a apărut o eroare de comunicare. Te rog încearcă din nou. 🛠️");
    } finally {
      setIsLoading(false);
    }
  };

  const startReservationFlow = (hotel = null) => {
    setTimeout(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, 300);
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
          askQuestion(`🏨 Rezervare excelentă la **"${hotel ? hotel.name : 'hotel'}"**!\n\nAm preluat deja datele pentru **${savedPetName}** 🐾 și email-ul tău.\n\n**Pasul 5:** La ce număr de telefon te putem contacta? 📱`);
        } else {
          setReservationStep('ownerEmail');
          askQuestion(`🏨 Ne bucurăm că ai ales **"${hotel ? hotel.name : 'hotel'}"**!\n\nAm completat automat datele pentru micuțul **${savedPetName}** 🐾.\n\n**Pasul 4:** Pe ce adresă de email îți putem trimite confirmarea? 📧`);
        }
      } else {
        setReservationStep('ownerName');
        askQuestion(`🏨 Să începem rezervarea la **"${hotel ? hotel.name : 'hotel'}"**!\n\nDatele pentru **${savedPetName}** au fost adăugate 🐾.\n\n**Pasul 3:** Îmi poți spune numele tău complet, te rog? 👤`);
      }
    } else {
      setReservationStep('petName');
      const introMsg = hotel 
        ? `🏨 Minunat! Ai ales ${hotel.name}.\n\nPasul 1: Cum îl cheamă pe prietenul tău necuvântător? 🐾`
        : "Să începem rezervarea! 🎉\n\nPasul 1: Cum îl cheamă pe animăluțul tău? 🐾";
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
        const knownType = (savedPetType && savedPetType !== "animal") ? savedPetType : detectedPetType;
        if (knownType) {
          setReservationData(p => ({ ...p, petType: knownType }));

          if (user && user.name) {
              setReservationData(p => ({ 
                  ...p, 
                  ownerName: user.name, 
                  ownerEmail: user.email || "" 
              }));

              if (user.email) {
                  setReservationStep('ownerPhone');
                  askQuestion(`Pasul 5: Știu deja că ${trimmedInput} este un ${knownType} 🐾.\nAm preluat automat datele contului tău (${user.name}, ${user.email}) ✅. Așa că am bifat pașii 2, 3 și 4 din procesul cererii de rezervare.\n\nLa ce număr de telefon te putem găsi la nevoie? 📱`);
              } else {
                  setReservationStep('ownerEmail');
                  askQuestion(`Pasul 4: Știu deja că ${trimmedInput} este un ${knownType} 🐾 și ți-am salvat numele (${user.name}) ✅.\n\nPe ce adresă de email vrei să îți trimitem statusul rezervării? 📧`);
              }
          } else {
              setReservationStep('ownerName');
              askQuestion(`Pasul 3: Perfect, deci ${trimmedInput} este un ${knownType}! 🐾 Acum despre tine. Care este numele tău? 👤`);
          }
        } else {
        setReservationStep('petType');
        askQuestion(`Pasul 2: Ce tip de animal este ${trimmedInput}? (ex: câine, pisică, iepure) 🐶🐱`);
        }
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
                 askQuestion(`Pasul 5: Am completat automat detaliile tale corespondente pașilor 3 și 4 fiindcă este deja conectat(${user.name}, ${user.email}) ✅.\n\nLa ce număr de telefon te putem găsi la nevoie? 📱`);
            } else {
                 askQuestion(`Pasul 4: Am salvat numele (${user.name}) ✅.\n\nPe ce adresă de e-mail vrei să îți trimitem statusul rezervării? 📧`);
            }
        } else {
            askQuestion("Pasul 3: Acum despre tine! Care este numele tău ? 👤");
        }
        break;
      case 'ownerName':
        setReservationData(p => ({ ...p, ownerName: trimmedInput }));
        setReservationStep('ownerEmail');
        askQuestion("Pasul 4: Perfect! Pe ce adresă de email îți vom trimite statusul de confirmare? 📧");
        break;
      case 'ownerEmail':
        if (!validateEmail(trimmedInput)) return askQuestion("Ups! 🙈 Email-ul nu pare a fi corect. Te rog scrie-l din nou, cu atenție!");
        setReservationData(p => ({ ...p, ownerEmail: trimmedInput }));
        setReservationStep('ownerPhone');
        askQuestion("Pasul 5: La ce număr de telefon te putem contacta în caz de ceva? 📱");
        break;
      case 'ownerPhone':
        if (!validatePhone(trimmedInput)) return askQuestion("Ups! 📱 Numărul trebuie să conțină 10 cifre valide. Mai încearcă o dată!");
        setReservationData(p => ({ ...p, ownerPhone: trimmedInput }));
        setReservationStep('checkIn');
        askQuestion("Pasul 6: În ce zi dorești să înceapă vacanța animăluțului tău (Check-in)? 📅\n(Scrie data sub forma AAAA-LL-ZZ, ex: 2026-07-15)");
        break;
      case 'checkIn':
        const statusIn = checkDateValidity(trimmedInput);
        if (!statusIn.valid) {
            if (statusIn.reason === "past") return askQuestion("Ups! 🙈 Data aceasta a trecut deja (avem nevoie de o mașină a timpului pentru asta 🕰️). Te rog alege o dată începând de astăzi înainte!");
            if (statusIn.reason === "not_exist") return askQuestion("Hmm... 🤔 Această dată nu există în calendar (poate luna are mai puține zile?). Te rog verifică și scrie din nou!");
            return askQuestion("Formatul nu este recunoscut 😅. Te rog scrie data folosind formatul AAAA-LL-ZZ (ex: 2026-07-15).");
        }
        setReservationData(p => ({ ...p, checkIn: trimmedInput }));
        setReservationStep('checkOut');
        askQuestion("Pasul 7: Super! 🎉 Până în ce zi va rămâne la noi (Check-out)? 📅\n(Scrie data sub forma AAAA-LL-ZZ)");
        break;
      case 'checkOut':
        const statusOut = checkDateValidity(trimmedInput, reservationData.checkIn);
        if (!statusOut.valid) {
            if (statusOut.reason === "past") return askQuestion("Această dată e în trecut. Te rog alege o dată viitoare!");
            if (statusOut.reason === "not_exist") return askQuestion("Hmm... 🤔 Această dată nu există calendaristic. Verifică te rog luna și ziua!");
            if (statusOut.reason === "before_checkin") return askQuestion("Atenție! 🐾 Data plecării (check-out) trebuie să fie neapărat după data de sosire (check-in). Încearcă din nou!");
            return askQuestion("Formatul nu este recunoscut 😅. Te rog respectă formatul AAAA-LL-ZZ.");
        }
        setReservationData(p => ({ ...p, checkOut: trimmedInput }));
        setReservationStep('specialRequests');
        askQuestion("Pasul 8: Aproape gata! Ai anumite cerințe speciale pentru animalul tău? 🦴\n(ex: necesită medicamente, alergic la ceva, etc. - sau scrie pur și simplu 'fără')");
        break;
      case 'specialRequests':
        const finalRequests = trimmedInput.toLowerCase() === 'fara' || trimmedInput.toLowerCase() === 'fără' ? '' : trimmedInput;
        const completeData = { ...reservationData, specialRequests: finalRequests };
        setReservationData(completeData);
        setReservationStep('confirmation');
        
        const price = selectedHotel?.pricePerNight || selectedHotel?.price_from || 100;
        const diffTime = Math.abs(new Date(completeData.checkOut) - new Date(completeData.checkIn));
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const total = price * nights;

        const summary = `✨ Totul arată minunat! Iată sumarul rezervării tale: ✨\n\n🏨 Hotel: ${selectedHotel?.name }\n💰 Total: ${total} RON (${nights} nopți)\n🐾 Animal: ${completeData.petName} (${completeData.petType})\n👤 Proprietar: ${completeData.ownerName}\n📅 Perioadă: ${formatDateForDisplay(completeData.checkIn)} - ${formatDateForDisplay(completeData.checkOut)}\n\nTrimitem cererea către recepție? (Da/Nu)`;
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
          askQuestion("Așteptăm o confirmare clară! ✨ Răspunde cu 'Da' pentru a finaliza sau 'Nu' pentru a anula.");
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

      const response = await fetch(`${API_BASE_URL}/api/book/bookings`, {
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
        askQuestion("✅ REZERVARE TRIMISĂ CU SUCCES! 🎉\n\nAbia așteptăm să ne vizitați! Vei primi un email de confirmare în cel mai scurt timp. 🐾");
        resetReservation();
      } else {
        throw new Error(result.message || 'Eroare necunoscută la server.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        askQuestion("❌ Ups! Conexiunea este lentă și serverul nu a răspuns la timp. Verifică internetul!");
      } else {
        askQuestion(`❌ Eroare: ${err.message}\n\nÎncearcă din nou!`);
      }
    }
  };

  const cancelReservation = () => {
    askQuestion("❌ Rezervarea a fost anulată cu succes! Te mai așteptăm. 👋");
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
      `Vrei să începi o rezervare la ${hotel.name}? 🐾`,
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


  const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  const showSub = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    (e) => setKeyboardHeight(e.endCoordinates.height)
  );
  const hideSub = Keyboard.addListener(
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    () => setKeyboardHeight(0)
  );
  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);

  const insets = useSafeAreaInsets();

  return (
    <PetBackground>
      <View style={{flex: 1}} >
        
   <ScrollView style={styles.chatContainer} ref={scrollViewRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.messageContainer, m.from === "bot" ? styles.botMessage : styles.userMessage]}>
            <Text style={[styles.messageText, m.from === "bot" ? styles.botMessageText : styles.userMessageText]}>{m.text}</Text>
          </View>
        ))}

        {hotels.length > 0 && !hideHotels && !isReservationMode && (
          <View style={styles.hotelsSection}>
            <Text style={styles.hotelsTitle}> {hotels.length} hoteluri găsite:</Text>
            {hotels.map((hotel, index) => (
              <TouchableOpacity key={`hotel_${hotel.id}_${index}`} onPress={() => bookHotel(hotel)} style={styles.hotelCard} activeOpacity={0.7}>
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
            <Text style={styles.loadingText}> Se procesează... 🐾</Text>
          </View>
        )}

        {quickReplies.length > 0 && !isLoading && (
          <View style={styles.quickRepliesContainer}>
            {quickReplies.map((r, i) => (
              <TouchableOpacity key={`reply_${r}_${i}`} onPress={() => send(r)} style={styles.quickReplyButton} activeOpacity={0.7}>
                <Text style={styles.quickReplyText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isReservationMode && (
          <View style={styles.reservationIndicator}>
            <Text style={styles.reservationIndicatorText}>
               Rezervare activă - Pasul {getReservationStepNumber(reservationStep)}/9
            </Text>
            <TouchableOpacity onPress={cancelReservation} style={styles.cancelReservationButton}>
              <Text style={{color:'#fff'}}>❌ Anulează</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
    <TextInput style={styles.textInput} value={input} onChangeText={setInput} placeholder="Scrie mesajul tău aici..." onSubmitEditing={() => send()} editable={!isLoading} />
    <TouchableOpacity onPress={() => send()} disabled={!input.trim() || isLoading} style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}><Text style={{color:'#fff', fontSize: 16}}>➤</Text></TouchableOpacity>
  </View>
  </View>
</PetBackground>
  );
}

const getReservationStepNumber = (step) => {
  const steps = {
    'petName': 1, 'petType': 2, 'ownerName': 3, 'ownerEmail': 4, 'ownerPhone': 5, 'checkIn': 6, 'checkOut': 7, 'specialRequests': 8, 'confirmation': 9
  };
  return steps[step] || 1;
};

const styles = StyleSheet.create({
  container: { flex: 1},
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
  inputContainer: {flexDirection: "row", padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e0e0e0", alignItems: "center", gap: 10,   paddingBottom: 20,
},
  textInput: { flex: 1, backgroundColor: "#f9f9f9", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", fontSize: 15 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center", shadowColor: "#007AFF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  sendButtonDisabled: { backgroundColor: "#ccc", shadowOpacity: 0 },
  reservationIndicator: { padding: 12, backgroundColor: "#e6f7ff", borderRadius: 12, marginTop: 10, alignItems: 'center', borderWidth: 1, borderColor: "#b3e0ff" },
  reservationIndicatorText: { color: "#007AFF", fontWeight: "600", fontSize: 14, marginBottom: 8 },
  cancelReservationButton: { backgroundColor: "#ff4444", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 }
});