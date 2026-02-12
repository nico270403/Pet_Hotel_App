import React, { useContext, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native'; 

export default function BookingsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  
  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Backend-ul returnează toate rezervările, indiferent de status (in asteptare, aprobata, respinsa)
      const response = await fetch(`http://172.20.10.2:3000/api/auth/my-bookings/${user.id}`);
      const data = await response.json();
      
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error("Eroare la istoricul rezervărilor:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchBookings();
      }else {
        setBookings([]); 
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#dcfce7'; // Verde
      case 'rejected': return '#fee2e2'; // Roșu
      case 'cancelled': return '#f3f4f6'; // Gri
      default: return '#fef9c3'; // Galben 
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '✅ Aprobată';
      case 'rejected': return '❌ Respinsă';
      case 'cancelled': return '🚫 Anulată';
      default: return '⏳ În așteptare';
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Trebuie să fii logat.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.btn}>
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
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: getStatusColor(item.status) === '#dcfce7' ? 'green' : 'orange' }]}>
              <View style={{flex:1}}>
                <Text style={styles.hotelName}>{item.hotel_name}</Text>
                <Text style={{color: '#555'}}>
                  📅 {new Date(item.start_date).toLocaleDateString('ro-RO')} ➝ {new Date(item.end_date).toLocaleDateString('ro-RO')}
                </Text>
                <Text style={{fontWeight:'bold', marginTop:5}}>💰 {item.price_total} RON</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={{ fontSize:12, fontWeight:'bold' }}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 5, elevation: 2 },
  hotelName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statusBadge: { padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center', height: 40 },
  btn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 5, marginTop: 10 }
});