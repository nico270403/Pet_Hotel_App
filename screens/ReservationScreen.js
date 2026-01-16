// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   ScrollView,
//   Alert
// } from "react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";

// export default function ReservationScreen() {
//   const [hotels, setHotels] = useState([]);
//   const [selectedHotel, setSelectedHotel] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [checkin, setCheckin] = useState(null);
//   const [checkout, setCheckout] = useState(null);
//   const [showCheckinPicker, setShowCheckinPicker] = useState(false);
//   const [showCheckoutPicker, setShowCheckoutPicker] = useState(false);

//   useEffect(() => {
//     const fetchHotels = async () => {
//       try {
//         const response = await fetch("http://172.20.10.2:3000/api/hotels");
//         const data = await response.json();
//         setHotels(data.hotels);
//       } catch (err) {
//         console.error("Eroare fetch hoteluri:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchHotels();
//   }, []);

//   const calculateTotal = () => {
//     if (!checkin || !checkout || !selectedHotel) return 0;
//     const diffTime = checkout - checkin;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays * selectedHotel.price_from;
//   };

//   const handleConfirm = async () => {
//     if (!selectedHotel || !checkin || !checkout) return;
//     const booking = {
//       hotel_id: selectedHotel.id,
//       pet_name: "Max", // poți adăuga pet selectat din alt ecran
//       owner_name: "Owner",
//       start_date: checkin.toISOString().split("T")[0],
//       end_date: checkout.toISOString().split("T")[0],
//       services: "Dog walking",
//       price: calculateTotal()
//     };

//     try {
//       const response = await fetch("http://172.20.10.2:3000/api/bookings", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(booking)
//       });
//       const data = await response.json();
//       if (data.success) {
//         Alert.alert("Succes", "Rezervarea a fost creată!");
//         setSelectedHotel(null);
//         setCheckin(null);
//         setCheckout(null);
//       } else {
//         Alert.alert("Eroare", "Nu s-a putut crea rezervarea");
//       }
//     } catch (err) {
//       console.error(err);
//       Alert.alert("Eroare", "Server error");
//     }
//   };

//   if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: "center" }} />;

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>Make a Reservation</Text>

//       <Text style={styles.label}>Select Hotel</Text>
//       <FlatList
//         data={hotels}
//         horizontal
//         keyExtractor={item => item.id.toString()}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={[
//               styles.hotelButton,
//               selectedHotel?.id === item.id && styles.hotelButtonSelected
//             ]}
//             onPress={() => setSelectedHotel(item)}
//           >
//             <Text style={[
//               styles.hotelButtonText,
//               selectedHotel?.id === item.id && styles.hotelButtonTextSelected
//             ]}>
//               {item.name}
//             </Text>
//           </TouchableOpacity>
//         )}
//         style={{ marginBottom: 20 }}
//       />

//       <Text style={styles.label}>Check-in</Text>
//       <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckinPicker(true)}>
//         <Text style={styles.dateBtnText}>{checkin ? checkin.toDateString() : "Select Check-in"}</Text>
//       </TouchableOpacity>
//       {showCheckinPicker && (
//         <DateTimePicker
//           value={checkin || new Date()}
//           mode="date"
//           display="default"
//           onChange={(e, date) => {
//             setShowCheckinPicker(false);
//             if (date) setCheckin(date);
//           }}
//         />
//       )}

//       <Text style={styles.label}>Check-out</Text>
//       <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckoutPicker(true)}>
//         <Text style={styles.dateBtnText}>{checkout ? checkout.toDateString() : "Select Check-out"}</Text>
//       </TouchableOpacity>
//       {showCheckoutPicker && (
//         <DateTimePicker
//           value={checkout || new Date()}
//           mode="date"
//           display="default"
//           onChange={(e, date) => {
//             setShowCheckoutPicker(false);
//             if (date) setCheckout(date);
//           }}
//         />
//       )}

//       <View style={styles.totalContainer}>
//         <Text style={styles.totalLabel}>Total:</Text>
//         <Text style={styles.totalValue}>
//           {selectedHotel && checkin && checkout ? `$${calculateTotal()}` : " RON"}
//         </Text>
//       </View>

//       <TouchableOpacity
//         style={[styles.confirmBtn, (!selectedHotel || !checkin || !checkout) && { backgroundColor: "#94a3b8" }]}
//         disabled={!selectedHotel || !checkin || !checkout}
//         onPress={handleConfirm}
//       >
//         <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, backgroundColor: "#f3f6fb" },
//   title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
//   label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
//   hotelButton: { padding: 12, backgroundColor: "#e5e7eb", borderRadius: 12, marginRight: 10 },
//   hotelButtonSelected: { backgroundColor: "#2563eb" },
//   hotelButtonText: { color: "#1f2937", fontWeight: "600" },
//   hotelButtonTextSelected: { color: "#fff" },
//   dateBtn: { padding: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", marginBottom: 16 },
//   dateBtnText: { color: "#1f2937", fontWeight: "600" },
//   totalContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20, padding: 16, backgroundColor: "#fff", borderRadius: 12 },
//   totalLabel: { fontSize: 18, fontWeight: "700" },
//   totalValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
//   confirmBtn: { backgroundColor: "#2563eb", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
//   confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 }
// });
// ReservationScreen.js - Versiune îmbunătățită
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, ScrollView, TextInput // 🆕 ADAUGĂ TextInput
} from "react-native";

import { Alert } from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

export default function ReservationScreen({ route, navigation }) {
  // 🆕 Primește hotelId din navigare
  const { hotelId } = route.params || {};
  
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🆕 ADAUGĂ CÂMPURI PENTRU EMAIL CONFIRMARE
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");

  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [showCheckinPicker, setShowCheckinPicker] = useState(false);
  const [showCheckoutPicker, setShowCheckoutPicker] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch("http://172.20.10.2:3000/api/hotels");
        const data = await response.json();
        setHotels(data.hotels || data); // Depinde de formatul răspunsului
        
        // 🆕 DACA AVEM hotelId, SELECTEAZĂ AUTOMAT HOTELUL
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
    // 🆕 Verifică dacă hotelul are price_from sau price
    const pricePerDay = selectedHotel.price_from || selectedHotel.price || 100;
    return diffDays * pricePerDay;
  };

  // 🆕 FUNCȚIE ÎMBUNĂTĂȚITĂ PENTRU REZERVARE + EMAIL
  const handleConfirm = async () => {
    if (!selectedHotel || !checkin || !checkout || !ownerEmail) {
      Alert.alert("Eroare", "Completează toate câmpurile obligatorii!");
      return;
    }

    const booking = {
      hotel_id: selectedHotel.id,
      user_id: 1,
      pet_name: petName || "Necunoscut",
      pet_type: petType || "Necunoscut",
      owner_name: ownerName || "Client",
      owner_email: ownerEmail, // 🆕 OBLIGATORIU PENTRU CONFIRMARE
      check_in: checkin.toISOString().split("T")[0],
      check_out: checkout.toISOString().split("T")[0],
      price: calculateTotal()
    };


    console.log("📤 Booking trimis:", booking);

    const response = await fetch("http://172.20.10.2:3000/api/book/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(booking)
  });
      
    const text = await response.text();
    console.log('📥 Status răspuns:', response.status);
    
    console.log('📥 Răspuns brut:', text);


  //     const data = await response.json();
  //     if (data.success) {
  //       Alert.alert(
  //         "✅ Rezervare trimisă!",
  //         `Am trimis o cerere de confirmare la ${ownerEmail}.\n\nVeți primi răspuns în scurt timp!`,
  //         [
  //           { text: "OK", onPress: () => navigation.goBack() }
  //         ]
  //       );
  //     } else {
  //       Alert.alert("Eroare", data.message || "Nu s-a putut crea rezervarea");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     Alert.alert("Eroare", "Server error - te rog încearcă din nou");
  //   }
  // };

   let data;
    try {
      data = JSON.parse(text);
    } catch  {
      Alert.alert("Eroare server", "Backend-ul nu răspunde corect");
      return;
    }
    
    if (data.success) {
      Alert.alert(
        "✅ Rezervare trimisă!",
        `Am trimis o cerere de confirmare la ${ownerEmail}.\n\nBooking ID: ${data.bookingId}`,
        [
          { 
            text: "OK", 
            onPress: () => navigation.navigate('HomeScreeen') // sau goBack()
          }
        ]
      );
      
      // Reset form
      setOwnerName("");
      setOwnerEmail("");
      setPetName("");
      setPetType("");
      setCheckin(null);
      setCheckout(null);
      setSelectedHotel(null);
    } else {
      Alert.alert("❌ Eroare", data.message || "Nu s-a putut crea rezervarea");
    }
  // } catch (err) {
  //   console.error('❌ Eroare fetch:', err);
  //   Alert.alert(
  //     "❌ Eroare server", 
  //     err.message || "Te rog încearcă din nou"
  //   );
  // }
};

  if (loading) {
    return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📅 Rezervare Hotel</Text>

      {/* 🆕 SECȚIUNE INFORMATII CLIENT */}
      <Text style={styles.label}>👤 Date personale</Text>
      <TextInput
        style={styles.input}
        placeholder="Numele tău complet"
        value={ownerName}
        onChangeText={setOwnerName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email (pentru confirmare)*"
        value={ownerEmail}
        onChangeText={setOwnerEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>🐾 Date animal</Text>
      <TextInput
        style={styles.input}
        placeholder="Nume animal (ex: Max)"
        value={petName}
        onChangeText={setPetName}
      />
      <TextInput
        style={styles.input}
        placeholder="Tip animal (ex: câine, pisică)"
        value={petType}
        onChangeText={setPetType}
      />

      {/* HOTEL SELECTION */}
      <Text style={styles.label}>🏨 Selectează Hotel</Text>
      <FlatList
        data={hotels}
        horizontal
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.hotelButton,
              selectedHotel?.id === item.id && styles.hotelButtonSelected
            ]}
            onPress={() => setSelectedHotel(item)}
          >
            <Text style={[
              styles.hotelButtonText,
              selectedHotel?.id === item.id && styles.hotelButtonTextSelected
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.hotelSubText,
              selectedHotel?.id === item.id && styles.hotelSubTextSelected
            ]}>
              {item.city} • {item.price_from || 100} RON/zi
            </Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 20 }}
      />

      {/* DATE SELECTION */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>📅 Check-in</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckinPicker(true)}>
            <Text style={styles.dateBtnText}>{checkin ? checkin.toLocaleDateString('ro-RO') : "Selectează"}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>📅 Check-out</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckoutPicker(true)}>
            <Text style={styles.dateBtnText}>{checkout ? checkout.toLocaleDateString('ro-RO') : "Selectează"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showCheckinPicker && (
        <DateTimePicker
          value={checkin || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(e, date) => {
            setShowCheckinPicker(false);
            if (date) {
              setCheckin(date);
              // Dacă checkout e înainte de checkin, resetează-l
              if (checkout && checkout < date) {
                setCheckout(null);
              }
            }
          }}
        />
      )}

      {showCheckoutPicker && (
        <DateTimePicker
          value={checkout || new Date(Date.now() + 86400000)} // Mâine implicit
          mode="date"
          display="default"
          minimumDate={checkin || new Date(Date.now() + 86400000)}
          onChange={(e, date) => {
            setShowCheckoutPicker(false);
            if (date) setCheckout(date);
          }}
        />
      )}

      {/* TOTAL */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>💰 Total:</Text>
        <Text style={styles.totalValue}>
          {selectedHotel && checkin && checkout ? `${calculateTotal()} RON` : "Completează datele"}
        </Text>
      </View>
      
      <Text style={styles.note}>
        ⚠️ După confirmare, vei primi un email la {ownerEmail || "adresa ta"} pentru aprobare finală.
      </Text>

      {/* CONFIRM BUTTON */}
      <TouchableOpacity
        style={[styles.confirmBtn, (!selectedHotel || !checkin || !checkout || !ownerEmail) && styles.confirmBtnDisabled]}
        disabled={!selectedHotel || !checkin || !checkout || !ownerEmail}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>📨 Trimite cerere de rezervare</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f3f6fb", minHeight: '100%' },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  input: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 12,
    fontSize: 16
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
  note: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: 'italic',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8
  },
  confirmBtn: { 
    backgroundColor: "#2563eb", 
    paddingVertical: 18, 
    borderRadius: 12, 
    alignItems: "center",
    marginBottom: 30
  },
  confirmBtnDisabled: { 
    backgroundColor: "#94a3b8" 
  },
  confirmBtnText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 17 
  }
});