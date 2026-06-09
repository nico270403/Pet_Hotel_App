import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView, TextInput, Alert, Modal
} from "react-native";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { AuthContext } from "../context/AuthContext";
import PetBackground from "./PetBackground";

LocaleConfig.locales['ro'] = {
  monthNames: ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
  dayNames: ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'],
  dayNamesShort: ['Dum','Lun','Mar','Mie','Joi','Vin','Sâm'],
  today: 'Azi'
};
LocaleConfig.defaultLocale = 'ro';

export default function ReservationScreen({ route, navigation }) {
  const { hotelId } = route.params || {};
  
  const { user } = useContext(AuthContext);

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [ownerEmail, setOwnerEmail] = useState(user?.email || "");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");

  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState('checkin'); 
  const [unavailableDates, setUnavailableDates] = useState({}); 

  useEffect(() => {
    if (selectedHotel) {
      fetch(`http://172.20.10.2:3000/api/book/unavailable-dates/${selectedHotel.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const marked = {};
            data.fullDates.forEach(date => {
              marked[date] = { disabled: true, disableTouchEvent: true, color: '#fca5a5', textColor: '#b91c1c' };
            });
            setUnavailableDates(marked);
          }
        })
        .catch(err => console.error(err));
    } else {
      setUnavailableDates({});
    }
  }, [selectedHotel]);

  useEffect(() => {
    if (user) {
      setOwnerName(user.name);
      setOwnerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch("http://172.20.10.2:3000/api/hotels");
        const data = await response.json();
        setHotels(data.hotels || data);
        
        if (hotelId) {
          const foundHotel = (data.hotels || data).find(h => h.id === hotelId);
          if (foundHotel) {
            setSelectedHotel(foundHotel);
          }
        }
      } catch (err) {
        console.error("Eroare fetch hoteluri:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, [hotelId]);

  const calculateTotal = () => {
    if (!checkin || !checkout || !selectedHotel) return 0;
    const diffTime = checkout - checkin;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const pricePerDay = selectedHotel.price_from || selectedHotel.price || 100;
    return diffDays * pricePerDay;
  };

  const handleConfirm = async () => {
    if (!selectedHotel || !checkin || !checkout || !ownerEmail) {
      Alert.alert("Eroare", "Completează toate câmpurile obligatorii!");
      return;
    }

    const booking = {
      hotel_id: selectedHotel.id,
      user_id: user ? user.id : 1,
      pet_name: petName || "Necunoscut",
      pet_type: petType || "Necunoscut",
      owner_name: ownerName || "Client",
      owner_email: ownerEmail,
      check_in: checkin.toISOString().split("T")[0],
      check_out: checkout.toISOString().split("T")[0],
      price: calculateTotal()
    };

    try {
      const response = await fetch("http://172.20.10.2:3000/api/book/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(booking)
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert(
          "✅ Rezervare efectuată cu succes!",
          `Revenim în cel mai scurt timp posibil cu un email în legătură cu statusul rezervării tale.`,
          [
            { 
              text: "Vezi Istoric", 
              onPress: () => navigation.navigate('Home', { screen: 'MyBookings' }) 
            }
          ]
        );
        
        setPetName("");
        setPetType("");
        setCheckin(null);
        setCheckout(null);
        setSelectedHotel(null);
      } else {
        Alert.alert("❌ Eroare la efectuarea cererii de rezervare!", data.message || "Nu s-a putut crea rezervarea");
      }
    } catch (err) {
      console.error('❌ Eroare fetch:', err);
      Alert.alert("❌ Eroare server", "Te rog încearcă din nou");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <PetBackground> 
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completează cerearea de rezervare</Text>

      <Text style={styles.label}>👤 Date personale</Text>
      <TextInput style={styles.input} placeholder="Numele tău complet" placeholderTextColor="#9ca3af" value={ownerName} onChangeText={setOwnerName} />
      <TextInput style={styles.input} placeholder="Email (pentru confirmare)*" placeholderTextColor="#9ca3af" value={ownerEmail} onChangeText={setOwnerEmail} keyboardType="email-address" autoCapitalize="none" />
      
      <Text style={styles.label}>🐾 Date animal</Text>
      <TextInput style={styles.input} placeholder="Nume animal (ex: Max)" placeholderTextColor="#9ca3af" value={petName} onChangeText={setPetName} />
      <TextInput style={styles.input} placeholder="Tip animal (ex: câine, pisică)" placeholderTextColor="#9ca3af" value={petType} onChangeText={setPetType} />

      <Text style={styles.label}>🏨 Selectează Hotel</Text>
      <FlatList
        data={hotels}
        horizontal
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.hotelButton, selectedHotel?.id === item.id && styles.hotelButtonSelected]}
            onPress={() => setSelectedHotel(item)}
          >
            <Text style={[styles.hotelButtonText, selectedHotel?.id === item.id && styles.hotelButtonTextSelected]}>
              {item.name}
            </Text>
            <Text style={[styles.hotelSubText, selectedHotel?.id === item.id && styles.hotelSubTextSelected]}>
              {item.city} • {item.price_from || 100} RON/zi
            </Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 20 }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>📅 Check-in</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => { setCalendarMode('checkin'); setShowCalendar(true); }}>
            <Text style={styles.dateBtnText}>{checkin ? checkin.toLocaleDateString('ro-RO') : "Selectează"}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>📅 Check-out</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => { setCalendarMode('checkout'); setShowCalendar(true); }}>
            <Text style={styles.dateBtnText}>{checkout ? checkout.toLocaleDateString('ro-RO') : "Selectează"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>💰 Total:</Text>
        <Text style={styles.totalValue}>
          {selectedHotel && checkin && checkout ? `${calculateTotal()} RON` : "Completează datele"}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.confirmBtn, (!selectedHotel || !checkin || !checkout || !ownerEmail) && styles.confirmBtnDisabled]}
        disabled={!selectedHotel || !checkin || !checkout || !ownerEmail}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>📨 Trimite cerere de rezervare</Text>
      </TouchableOpacity>

      {/* AICI ESTE MODALUL CU CALENDARUL PE CARE ÎL UITASEI */}
      <Modal visible={showCalendar} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarPopup}>
            <Calendar
              minDate={new Date().toISOString().split('T')[0]} 
              markedDates={{
                ...unavailableDates,
                ...(checkin ? { [checkin.toISOString().split('T')[0]]: { selected: true, selectedColor: '#2563eb' } } : {}),
                ...(checkout ? { [checkout.toISOString().split('T')[0]]: { selected: true, selectedColor: '#2563eb' } } : {})
              }}
              onDayPress={(day) => {
                const selectedDate = new Date(day.dateString);
                if (calendarMode === 'checkin') {
                  setCheckin(selectedDate);
                  if (checkout && selectedDate >= checkout) setCheckout(null);
                } else {
                  setCheckout(selectedDate);
                }
                setShowCalendar(false); 
              }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeBtnText}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
    </PetBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, minHeight: '100%' },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 12,
    fontSize: 16,
    color: "#000"
  },
  hotelButton: { 
    padding: 15,
    backgroundColor: "#e5e7eb", 
    borderRadius: 12, 
    marginRight: 10,
    minWidth: 150,
    alignItems: 'center'
  },
  hotelButtonSelected: { backgroundColor: "#2563eb" },
  hotelButtonText: { color: "#1f2937", fontWeight: "600", fontSize: 16 },
  hotelButtonTextSelected: { color: "#fff" },
  hotelSubText: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  hotelSubTextSelected: { color: "#dbeafe" },
  dateBtn: { 
    padding: 15, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    alignItems: 'center'
  },
  dateBtnText: { color: "#1f2937", fontWeight: "600", fontSize: 15 },
  totalContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginVertical: 25, 
    padding: 20, 
    backgroundColor: "#fff", 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2563eb"
  },
  totalLabel: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  confirmBtn: { 
    backgroundColor: "#2563eb", 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: "center",
    marginBottom: 30
  },
  confirmBtnDisabled: { backgroundColor: "#94a3b8" },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 17 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  calendarPopup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeBtn: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center'
  },
  closeBtnText: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 16
  }
});