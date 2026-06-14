import React, { useContext, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, ImageBackground, SafeAreaView, StatusBar
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native'; 

export default function BookingsScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);  
  const { initPaymentSheet, presentPaymentSheet } = useStripe(); 

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

  const getCardBorderColor = (status, startDate) => {
    const s = status ? status.toLowerCase() : ''; 
    if (s === 'pending' || s === 'în așteptare') {
      const checkInDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkInDate < today ? '#ef4444' : '#f59e0b'; 
    }
    if (s === 'paid') return '#3b82f6'; 
    if (s === 'approved' || s === 'confirmed') return '#22c55e'; 
    if (s === 'rejected' || s === 'declined' || s === 'canceled') return '#ef4444'; 
    return '#d1d5db'; 
  };

  const renderBookingStatus = (status, startDate) => {
    const s = status ? status.toLowerCase() : '';
    
    if (s === 'pending' || s === 'în așteptare') {
      const checkInDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12 }}>⚠️ Expirată</Text>
          </View>
        );
      }
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
          <Text style={{ color: '#d97706', fontWeight: 'bold', fontSize: 12 }}>⏳ În așteptare</Text>
        </View>
      );
    }

    if (s === 'paid') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#dbeafe' }]}>
          <Text style={{ color: '#1d4ed8', fontWeight: 'bold', fontSize: 12 }}>💳 Plătită</Text>
        </View>
      );
    }
    
    if (s === 'approved' || s === 'confirmed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
          <Text style={{ color: '#15803d', fontWeight: 'bold', fontSize: 12 }}>✅ Confirmată</Text>
        </View>
      );
    }

    if (s === 'rejected' || s === 'declined') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
          <Text style={{ color: '#b91c1c', fontWeight: 'bold', fontSize: 12 }}>❌ Respinsă</Text>
        </View>
      );
    }

    if (s === 'canceled' || s === 'anulat') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#f3f4f6' }]}>
          <Text style={{ color: '#4b5563', fontWeight: 'bold', fontSize: 12 }}>🚫 Anulată</Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: '#e5e7eb' }]}>
        <Text style={{ color: '#4b5563', fontWeight: 'bold', fontSize: 12 }}>{status}</Text>
      </View>
    );
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
    <ImageBackground 
      source={require('../assets/paws-bg.png')} 
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        
        <View style={styles.topBar}>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}> Deconectare</Text>
          </TouchableOpacity>
        </View>
        
        {bookings.length === 0 && !loading ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nu ai nicio rezervare în istoric.</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={item => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isApproved = item.status.toLowerCase() === 'approved' || item.status.toLowerCase() === 'confirmed';
              const isCompleted = new Date() > new Date(item.end_date);
              const canPay = isApproved && !isCompleted;
              const canReview = isCompleted && (item.status.toLowerCase() === 'paid' || isApproved) && !item.reviewed;              
              return (
                <View style={[styles.card, { borderLeftColor: getCardBorderColor(item.status, item.start_date) }]}>
                  
                  <View style={styles.cardHeader}>
                    <View style={{flex:1, paddingRight: 10}}>
                      <Text style={styles.hotelName}>{item.hotel_name}</Text>
                      <Text style={{color: '#555'}}>
                        📅 {new Date(item.start_date).toLocaleDateString('ro-RO')} ➝ {new Date(item.end_date).toLocaleDateString('ro-RO')}
                      </Text>
                      <Text style={{color: '#4b5563', marginTop: 4, fontWeight: '500'}}>
                        🐶 Animal: {item.pet_name || "Nespecificat"}
                      </Text>
                      <Text style={{fontWeight:'bold', marginTop:5, color: '#1f2937'}}>💰 Total: {item.price_total} RON</Text>
                    </View>

                    {renderBookingStatus(item.status, item.start_date)}
                  </View>

                  {canPay && (
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
                    <Text style={{ color: '#10b981', marginTop: 10, fontStyle: 'italic', fontWeight: 'bold', textAlign: 'center' }}>
                      ✅ Ai evaluat această ședere
                    </Text>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  }, 
  backgroundImage: { 
    opacity: 0.3, 
    resizeMode: 'repeat' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'transparent' 
  }, 
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end', 
    paddingTop: 15, 
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#ef4444', 
    fontWeight: 'bold',
    fontSize: 14,
  },

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  emptyText: {
    color: '#475569', 
    fontSize: 16, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderRadius: 16, 
    fontWeight: '600', 
    overflow: 'hidden',
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 8
  },
  
  listContainer: { 
    paddingHorizontal: 24, 
    paddingBottom: 40 
  }, 
  card: { 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 24, 
    marginHorizontal: 24, 
    borderLeftWidth: 8, 
    elevation: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hotelName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 100 },
  btn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 12, marginTop: 16, minWidth: 120, alignItems: 'center' },
  payBtn: {
    backgroundColor: '#10b981', padding: 16, borderRadius: 12, marginTop: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4, 
  },
  payBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
