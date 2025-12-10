import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ReservationScreen() {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [showCheckinPicker, setShowCheckinPicker] = useState(false);
  const [showCheckoutPicker, setShowCheckoutPicker] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch("http://172.20.10.2:3000/api/hotels");
        const data = await response.json();
        setHotels(data.hotels);
      } catch (err) {
        console.error("Eroare fetch hoteluri:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const calculateTotal = () => {
    if (!checkin || !checkout || !selectedHotel) return 0;
    const diffTime = checkout - checkin;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * selectedHotel.price_from;
  };

  const handleConfirm = async () => {
    if (!selectedHotel || !checkin || !checkout) return;
    const booking = {
      hotel_id: selectedHotel.id,
      pet_name: "Max", // poți adăuga pet selectat din alt ecran
      owner_name: "Owner",
      start_date: checkin.toISOString().split("T")[0],
      end_date: checkout.toISOString().split("T")[0],
      services: "Dog walking",
      price: calculateTotal()
    };

    try {
      const response = await fetch("http://172.20.10.2:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Succes", "Rezervarea a fost creată!");
        setSelectedHotel(null);
        setCheckin(null);
        setCheckout(null);
      } else {
        Alert.alert("Eroare", "Nu s-a putut crea rezervarea");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Eroare", "Server error");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Make a Reservation</Text>

      <Text style={styles.label}>Select Hotel</Text>
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
          </TouchableOpacity>
        )}
        style={{ marginBottom: 20 }}
      />

      <Text style={styles.label}>Check-in</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckinPicker(true)}>
        <Text style={styles.dateBtnText}>{checkin ? checkin.toDateString() : "Select Check-in"}</Text>
      </TouchableOpacity>
      {showCheckinPicker && (
        <DateTimePicker
          value={checkin || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowCheckinPicker(false);
            if (date) setCheckin(date);
          }}
        />
      )}

      <Text style={styles.label}>Check-out</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCheckoutPicker(true)}>
        <Text style={styles.dateBtnText}>{checkout ? checkout.toDateString() : "Select Check-out"}</Text>
      </TouchableOpacity>
      {showCheckoutPicker && (
        <DateTimePicker
          value={checkout || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowCheckoutPicker(false);
            if (date) setCheckout(date);
          }}
        />
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>
          {selectedHotel && checkin && checkout ? `$${calculateTotal()}` : " RON"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, (!selectedHotel || !checkin || !checkout) && { backgroundColor: "#94a3b8" }]}
        disabled={!selectedHotel || !checkin || !checkout}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f3f6fb" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  hotelButton: { padding: 12, backgroundColor: "#e5e7eb", borderRadius: 12, marginRight: 10 },
  hotelButtonSelected: { backgroundColor: "#2563eb" },
  hotelButtonText: { color: "#1f2937", fontWeight: "600" },
  hotelButtonTextSelected: { color: "#fff" },
  dateBtn: { padding: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#d1d5db", marginBottom: 16 },
  dateBtnText: { color: "#1f2937", fontWeight: "600" },
  totalContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20, padding: 16, backgroundColor: "#fff", borderRadius: 12 },
  totalLabel: { fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  confirmBtn: { backgroundColor: "#2563eb", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});
