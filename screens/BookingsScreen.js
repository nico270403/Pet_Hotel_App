import React, { useContext, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native'; 

export default function BookingsScreen({ navigation }) {
const { user, logout } = useContext(AuthContext);  const { initPaymentSheet, presentPaymentSheet } = useStripe(); 

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState(null); 

  const fetchBookings = async () => {
    if (!user || user.isGuest) return;
    setLoading(true);
    try {
      const response = await fetch(`http://172.20.10.2:3000/api/auth/my-bookings/${user.id}`);
      const data = await response.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (err) {
      console.error("Eroare la istoric:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user && !user.isGuest) {
        fetchBookings();
      } else {
        setBookings([]); 
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handlePayment = async (booking) => {
    setPayingId(booking.id);
    try {
      const response = await fetch("http://172.20.10.2:3000/api/payment/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: booking.price_total }),
      });
      const data = await response.json();

      if (!data.clientSecret) {
        Alert.alert("Eroare Backend", data.error || "Nu s-a putut inițializa plata.");
        setPayingId(null);
        return;
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Pet Hotel App',
        paymentIntentClientSecret: data.clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (initError) {
        Alert.alert("Eroare", initError.message);
        setPayingId(null);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          Alert.alert("Eroare plată", paymentError.message);
        }
        setPayingId(null);
        return;
      }

      const updateRes = await fetch(`http://172.20.10.2:3000/api/payment/mark-paid/${booking.id}`, {
        method: "PUT",
      });
      
      const rawText = await updateRes.text();
      console.log("Răspuns server:", rawText);

      try {
        const updateData = JSON.parse(rawText);

        if (updateData.success) {
          Alert.alert("Succes! 🎉", "Plata a fost realizată și înregistrată.");
          await fetchBookings(); 
        } else {
          Alert.alert("Atenție", "Plata a mers, dar statusul nu s-a actualizat. Eroare: " + updateData.error);
        }
      } catch (parseError) {
        console.error("Nu s-a putut parsa JSON. Serverul a returnat:", rawText);
        Alert.alert("Succes! 🎉", "Plata a reușit, dar dă un refresh manual pentru a vedea noul status.");
        await fetchBookings();
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Eroare", "Nu ne-am putut conecta la serverul de plăți.");
    } finally {
      setPayingId(null);
    }
  };

  const getStatusColor = (status) => {
    const s = status ? status.toLowerCase() : ''; 
    if (s === 'paid') return '#dbeafe'; 
    if (s === 'approved' || s === 'confirmed') return '#dcfce7'; 
    if (s === 'rejected' || s === 'declined' || s === 'canceled') return '#fee2e2'; 
    return '#fef9c3'; 
  };

  const getStatusText = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'paid') return '💳 Plătită';
    if (s === 'approved' || s === 'confirmed') return '✅ Confirmată';
    if (s === 'rejected' || s === 'declined') return '❌ Respinsă';
    if (s === 'canceled') return '🚫 Anulată';
    return '⏳ În așteptare';
  };

  if (!user || user.isGuest) {
    return (
      <View style={styles.center}>
        <Text>Trebuie să fii logat.</Text>
        <TouchableOpacity onPress={logout} style={styles.btn}>
          <Text style={{color:'#fff'}}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Istoric Rezervări 📅</Text>
      
      {bookings.length === 0 && !loading ? (
        <View style={styles.center}>
          <Text style={{color: '#666', fontSize: 16}}>Nu ai nicio rezervare în istoric.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const isApproved = item.status.toLowerCase() === 'approved' || item.status.toLowerCase() === 'confirmed';
            const isCompleted = new Date() > new Date(item.end_date);
            const canReview = isCompleted && (item.status === 'paid' || item.status === 'approved') && !item.reviewed;
            return (
              <View style={[styles.card, { borderLeftColor: getStatusColor(item.status) === '#dcfce7' ? 'green' : getStatusColor(item.status) === '#dbeafe' ? 'blue' : 'orange' }]}>
                
                {/* Informatii Rezervare */}
                <View style={styles.cardHeader}>
                  <View style={{flex:1}}>
                    <Text style={styles.hotelName}>{item.hotel_name}</Text>
                    <Text style={{color: '#555'}}>
                      📅 {new Date(item.start_date).toLocaleDateString('ro-RO')} ➝ {new Date(item.end_date).toLocaleDateString('ro-RO')}
                    </Text>
                    <Text style={{color: '#4b5563', marginTop: 4, fontWeight: '500'}}>
                      🐶 Animal: {item.pet_name || "Nespecificat"}
                    </Text>
                    <Text style={{fontWeight:'bold', marginTop:5, color: '#1f2937'}}>💰 Total: {item.price_total} RON</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={{ fontSize:12, fontWeight:'bold' }}>{getStatusText(item.status)}</Text>
                  </View>
                </View>

                {/* BUTONUL DE PLATA - Apare DOAR dacă e aprobata */}
                {isApproved && (
                  <TouchableOpacity 
                    style={styles.payBtn}
                    onPress={() => handlePayment(item)}
                    disabled={payingId === item.id}
                  >
                    {payingId === item.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.payBtnText}>💳 Plătește Online</Text>
                    )}
                  </TouchableOpacity>
                )}

                {canReview && (
                  <TouchableOpacity 
                    style={[styles.payBtn, { backgroundColor: '#f59e0b' }]} 
                    onPress={() => navigation.navigate('Review', { booking: item })}
                  >
                    <Text style={styles.payBtnText}>⭐ Lasă o recenzie</Text>
                  </TouchableOpacity>
                )}
    
                {item.reviewed && (
                  <Text style={{ color: '#10b981', marginTop: 10, fontStyle: 'italic' }}>✅ Ai evaluat această ședere</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hotelName: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#111827' },
  statusBadge: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
  btn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 5, marginTop: 10 },
  
  
  payBtn: {
    backgroundColor: '#10b981', 
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  }
});