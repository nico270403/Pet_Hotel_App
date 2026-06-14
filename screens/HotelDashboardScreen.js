import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; 
import { Calendar } from 'react-native-calendars'; 
import { useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

const getLocalDateString = (dateInput) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
};

const translateStatus = (status) => {
  switch (status) {
    case 'approved': return 'APROBATĂ';
    case 'pending': return 'ÎN AȘTEPTARE';
    case 'rejected': return 'RESPINSĂ';
    case 'anulat': return 'ANULATĂ';
    case 'expirată': return 'EXPIRATĂ';
    case 'paid': return 'PLĂTITĂ';
    default: return status ? status.toUpperCase() : '';
  }
};
export default function HotelDashboardScreen() { 
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);

  // Extragem ID-ul primului hotel din noua structura user.hotels
  const [activeHotelId, setActiveHotelId] = useState(
    user?.hotels && user.hotels.length > 0 ? user.hotels[0].id : null
  );

  const todayString = getLocalDateString(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [dailyStats, setDailyStats] = useState({ ocupate: 0, libere: 0, rataOcupare: 0 });
  const [dayBookings, setDayBookings] = useState([]);
  const [speciesStats, setSpeciesStats] = useState({});
  const [sosiriAzi, setSosiriAzi] = useState([]);
  const [plecariAzi, setPlecariAzi] = useState([]);
  
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeDates, setIncomeDates] = useState({ start: '', end: '' });
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  
  const [hotelSelectorVisible, setHotelSelectorVisible] = useState(false);

  const fetchDashboardData = async (filterDates = incomeDates) => {
    if (!activeHotelId) {
      setLoading(false);
      return;
    }
    try {
      let url = `http://172.20.10.2:3000/api/dashboard/${activeHotelId}`;
      if (filterDates.start && filterDates.end) url += `?startDate=${filterDates.start}&endDate=${filterDates.end}`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (response.ok && json.success) {
        setData(json);
        calculeazaOcuparePentruZiua(selectedDate, json.bookingIntervals, json.stats.capacitateTotala);
      }
    } catch (error) { 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const calculeazaOcuparePentruZiua = (dateStr, intervals, capacitate) => {
    if (!intervals) return;
    let ocupate = 0; let rezervari = []; let sosiri = []; let plecari = []; let spStats = {};

    const todayYMD = getLocalDateString(new Date());

    intervals.forEach(b => {
      const startYMD = getLocalDateString(b.start_date);
      const endYMD = getLocalDateString(b.end_date);
      
      let statusPentruAfisare = b.status;
      if (statusPentruAfisare === 'pending' && startYMD < todayYMD) {
        statusPentruAfisare = 'expirată';
      }

      if (dateStr >= startYMD && dateStr <= endYMD) {
        rezervari.push({ ...b, display_status: statusPentruAfisare });
        
        if (b.status === 'approved' || b.status === 'paid') {
          ocupate++;
          const spName = b.species_name || 'Necunoscut';
          spStats[spName] = (spStats[spName] || 0) + 1;
        }
      }
      if (b.status === 'approved' || b.status === 'paid') {
        if (startYMD === dateStr) sosiri.push(b);
        if (endYMD === dateStr) plecari.push(b);
      }
    });

    setDayBookings(rezervari);
    setSosiriAzi(sosiri);
    setPlecariAzi(plecari);
    setSpeciesStats(spStats);
    
    const libereCalculat = Math.max(0, (capacitate || 0) - ocupate);
    const rata = capacitate > 0 ? Math.round((ocupate / capacitate) * 100) : 0;
    setDailyStats({ ocupate, libere: libereCalculat, rataOcupare: rata });
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    calculeazaOcuparePentruZiua(day.dateString, data?.bookingIntervals, data?.stats?.capacitateTotala);
  };

  const generateMarkedDates = () => {
    let marked = {};
    if (data?.bookingIntervals) {
      data.bookingIntervals.forEach(interval => {
        if (interval.status === 'anulat' || interval.status === 'rejected') return;
        
        let start = new Date(interval.start_date);
        let end = new Date(interval.end_date);
        start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
        
        while (start <= end) {
          let dataString = getLocalDateString(start);
          let dotColor = (interval.status === 'pending') ? '#f59e0b' : '#ef4444';

          if (marked[dataString] && marked[dataString].dotColor === '#ef4444') {
            dotColor = '#ef4444'; 
          }

          marked[dataString] = { marked: true, dotColor: dotColor };
          start.setDate(start.getDate() + 1);
        }
      });
    }
    marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#0d9488' };
    return marked;
  };

  useEffect(() => { 
    if (activeHotelId) {
      setLoading(true);
      fetchDashboardData(); 
    } else {
      setLoading(false);
    }
  }, [activeHotelId, incomeDates]);

  const handleLogoutConfirm = () => {
    Alert.alert(
      "Deconectare",
      "Ești sigur că vrei să te deconectezi?",
      [
        { text: "Anulează", style: "cancel" },
        { text: "Da, deconectează-mă", onPress: logout, style: "destructive" }
      ]
    );
  };

  const openActionModal = (booking) => {
    setActiveBooking(booking);
    setActionModalVisible(true);
  };

  const handleApproveBooking = async () => {
    try {
      const res = await fetch(`http://172.20.10.2:3000/api/book/${activeBooking.id}/accept`);
      if (res.ok) {
        Alert.alert("Succes", "Rezervarea a fost aprobată!");
        setActionModalVisible(false);
        fetchDashboardData();
      }
    } catch (error) { Alert.alert("Eroare", "Eroare de conexiune la server."); }
  };

  const handleRejectBooking = async () => {
    try {
      const res = await fetch(`http://172.20.10.2:3000/api/book/${activeBooking.id}/reject`);
      if (res.ok) {
        Alert.alert("Respinsă", "Cererea a fost respinsă.");
        setActionModalVisible(false);
        fetchDashboardData();
      }
    } catch (error) { Alert.alert("Eroare", "Eroare de conexiune la server."); }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await fetch(`http://172.20.10.2:3000/api/dashboard/booking/${activeBooking.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) { setActionModalVisible(false); fetchDashboardData(); }
    } catch (error) { }
  };

  const handleDeleteBooking = async () => {
    try {
      const res = await fetch(`http://172.20.10.2:3000/api/dashboard/booking/${activeBooking.id}`, { method: 'DELETE' });
      if (res.ok) { setActionModalVisible(false); fetchDashboardData(); }
    } catch (error) { }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0d9488" /></View>;

  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * dailyStats.rataOcupare) / 100;

  const getEmojiForSpecies = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('cain') || lower.includes('câin')) return '🐶';
    if (lower.includes('pisic')) return '🐱';
    if (lower.includes('peșt') || lower.includes('pest')) return '🐟';
    if (lower.includes('broasc') || lower.includes('țestoas')) return '🐢';
    if (lower.includes('aric')) return '🦔';
    if (lower.includes('pas') || lower.includes('păs')) return '🦜';
    if (lower.includes('iep')) return '🐰';
    if (lower.includes('hamster') || lower.includes('porcușor')) return '🐹';
    return '🐾';
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* HEADER NOU (Culori, Layout, Text sub butoane) */}
      <View style={styles.headerContainer}>
        
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleLogoutConfirm} style={styles.headerBtn}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.headerBtnText}>Deconectare</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerCenterBtn}
            onPress={() => setHotelSelectorVisible(true)}
          >
            <Text style={styles.headerCenterBtnText}>Alege unitatea</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" style={{marginLeft: 6}}/>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EditHotel', { hotelId: activeHotelId })} style={styles.headerBtn}>
            <Ionicons name="create-outline" size={24} color="#fff" />
            <Text style={styles.headerBtnText}>Editează detalii</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerBottomRow}>
          <Text style={styles.activeHotelName}>{data?.hotelName || "Se încarcă..."}</Text>
        </View>
        
      </View>

      <ScrollView style={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}>
        <Text style={styles.dateSubtitle}>Statistici pentru: {selectedDate === todayString ? "Astăzi" : formatDisplayDate(selectedDate)}</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Locuri ocupate</Text>
            </View>
            <Text style={[styles.cardNumber, { color: '#ef4444' }]}>{dailyStats.ocupate}</Text>
          </View>
          
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Locuri libere</Text>
            </View>
            <Text style={[styles.cardNumber, { color: '#10b981' }]}>{dailyStats.libere}</Text>
          </View>

          {Object.keys(speciesStats).length > 0 ? (
            <View style={[styles.cardFull, styles.shadow, { paddingVertical: 15 }]}>
              <Text style={[styles.cardLabel, { marginBottom: 10, marginLeft: 0 }]}>Cazări per specie ({formatDisplayDate(selectedDate)})</Text>
              <View style={styles.speciesContainer}>
                {Object.entries(speciesStats).map(([spName, count], idx) => (
                  <View key={idx} style={styles.speciesCircle}>
                    <Text style={styles.speciesEmoji}>{getEmojiForSpecies(spName)}</Text>
                    <Text style={styles.speciesCount}>{count}</Text>
                    <Text style={styles.speciesName}>{spName}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={[styles.cardFull, styles.shadow, styles.occupancyRow]}>
            <View style={styles.occupancyTextContainer}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart-outline" size={20} color="#0d9488" />
                <Text style={styles.cardLabel}>Rată Ocupare</Text>
              </View>
              <Text style={styles.occupancyDetails}>Capacitate totală: {data?.stats?.capacitateTotala}</Text>
            </View>
            <View style={styles.progressContainer}>
              <Svg width="90" height="90" viewBox="0 0 90 90">
                <Circle cx="45" cy="45" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
                <Circle cx="45" cy="45" r={radius} stroke={dailyStats.rataOcupare >= 80 ? "#ef4444" : dailyStats.rataOcupare >= 50 ? "#f59e0b" : "#10b981"} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 45 45)" />
              </Svg>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>{dailyStats.rataOcupare}%</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.cardFull, styles.shadow]} onPress={() => setShowIncomeModal(true)}>
            <View style={styles.incomeHeader}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet-outline" size={20} color="#f59e0b" />
                <Text style={styles.cardLabel}>Venit {incomeDates.start ? `(${formatDisplayDate(incomeDates.start)} - ${formatDisplayDate(incomeDates.end)})` : "(Luna Curentă)"}</Text>
              </View>
              <Ionicons name="filter-outline" size={20} color="#cbd5e1" />
            </View>
            <Text style={[styles.cardNumber, { color: '#f59e0b', fontSize: 28 }]}>{parseFloat(data?.stats?.venitCalculat || 0).toFixed(0)} RON</Text>
            <Text style={styles.hintText}>Apasă pentru a schimba perioada</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsContainer}>
          <View style={[styles.alertBox, styles.arrivalBox, styles.shadow]}>
            <Ionicons name="log-in-outline" size={24} color="#059669" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Sosiri: <Text style={styles.alertCount}>{sosiriAzi.length} </Text></Text>
            </View>
          </View>
          <View style={[styles.alertBox, styles.departureBox, styles.shadow]}>
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Plecări: <Text style={styles.alertCount}>{plecariAzi.length} </Text></Text> 
            </View>
          </View>
        </View>

        <Text style={styles.subHeader}>📅 Calendar Rezervări</Text>
        <View style={[styles.calendarCard, styles.shadow]}>
          <Calendar theme={{ todayTextColor: '#0d9488', arrowColor: '#0d9488' }} markedDates={generateMarkedDates()} onDayPress={onDayPress} />
        </View>

        <Text style={styles.subHeader}>🐾 Cazări în data de {formatDisplayDate(selectedDate)}</Text>
        {dayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nicio rezervare pentru această zi.</Text>
          </View>
        ) : (
          dayBookings.map((booking, index) => {
            const isInactive = ['anulat', 'rejected', 'expirată'].includes(booking.display_status);
            const isApproved = ['approved', 'paid'].includes(booking.display_status);
            
            let badgeBg = '#fef3c7'; 
            let badgeText = '#d97706';
            
            if (isApproved) { 
              badgeBg = '#d1fae5'; badgeText = '#059669'; 
            } else if (booking.display_status === 'anulat' || booking.display_status === 'rejected') { 
              badgeBg = '#fee2e2'; badgeText = '#ef4444'; 
            } else if (booking.display_status === 'expirată') { 
              badgeBg = '#f1f5f9'; badgeText = '#64748b'; 
            }

            return (
              <View key={index} style={[styles.bookingItem, styles.shadow, isInactive && { opacity: 0.6 }]}>
                <View style={styles.bookingIcon}>
                  <Text style={{fontSize: 20}}>{getEmojiForSpecies(booking.species_name || '')}</Text>
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={[styles.bookingName, isInactive && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>
                    {booking.pet_name} <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: 'normal'}}>({booking.species_name})</Text>
                  </Text>
                  <Text style={styles.bookingDates}>{formatDisplayDate(getLocalDateString(booking.start_date))} - {formatDisplayDate(getLocalDateString(booking.end_date))}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusText, { color: badgeText }]}>
                      {translateStatus(booking.display_status)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.optionsBtn} onPress={() => openActionModal(booking)}>
                  <Ionicons name="ellipsis-vertical" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{height: 100}}></View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fabExtended, styles.shadow]} 
        onPress={() => navigation.navigate('AdaugaRezervare', { hotelId: activeHotelId })}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.fabText}>Adaugă Rezervare</Text>
      </TouchableOpacity>

      <Modal visible={hotelSelectorVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>Alege unitatea</Text>
            {user?.hotels?.map((hotel) => (
              <TouchableOpacity 
                key={hotel.id} 
                style={[styles.actionBtn, activeHotelId === hotel.id && {backgroundColor: '#ccfbf1'}]} 
                onPress={() => {
                  setActiveHotelId(hotel.id);
                  setHotelSelectorVisible(false);
                }}
              >
                <Ionicons name="business" size={22} color={activeHotelId === hotel.id ? "#0d9488" : "#64748b"} />
                <Text style={[styles.actionBtnText, {color: activeHotelId === hotel.id ? "#0d9488" : "#475569"}]}>
                  {hotel.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#d1fae5', marginTop: 10 }]} 
              onPress={() => {
                setHotelSelectorVisible(false);
                navigation.navigate('AddHotel'); 
              }}
            >
              <Ionicons name="add-circle" size={22} color="#059669" />
              <Text style={[styles.actionBtnText, { color: "#059669", fontWeight: 'bold' }]}>
                Adaugă o nouă locație
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setHotelSelectorVisible(false)}>
              <Text style={styles.actionBtnTextCancel}>Închide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={actionModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>Acțiuni Rezervare</Text>
              <Text style={styles.actionPetName}>{activeBooking?.pet_name}</Text>
            </View>
            
            {activeBooking?.display_status === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#d1fae5' }]} onPress={handleApproveBooking}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#059669" />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>Aprobă Cererea</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={handleRejectBooking}>
                  <Ionicons name="close-circle-outline" size={22} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Respinge Cererea</Text>
                </TouchableOpacity>
              </>
            )}

            {(activeBooking?.display_status === 'approved' || activeBooking?.display_status === 'paid') && (
              <TouchableOpacity style={styles.actionBtnWarning} onPress={() => handleUpdateStatus('anulat')}>
                <Ionicons name="warning-outline" size={22} color="#f59e0b" />
                <Text style={styles.actionBtnTextWarning}>Anulează Rezervarea</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionBtnDanger} onPress={handleDeleteBooking}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={styles.actionBtnTextDanger}>Șterge Definitiv</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnCancel} onPress={() => setActionModalVisible(false)}>
              <Text style={styles.actionBtnTextCancel}>Înapoi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showIncomeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege perioada</Text>
            <Calendar
              markingType={'period'}
              onDayPress={(day) => {
                if (!incomeDates.start || (incomeDates.start && incomeDates.end)) {
                  setIncomeDates({ start: day.dateString, end: '' });
                } else {
                  if (day.dateString > incomeDates.start) setIncomeDates({ ...incomeDates, end: day.dateString });
                  else setIncomeDates({ start: day.dateString, end: '' });
                }
              }}
              markedDates={{
                [incomeDates.start]: { startingDay: true, color: '#f59e0b', textColor: 'white' },
                [incomeDates.end]: { endingDay: true, color: '#f59e0b', textColor: 'white' }
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowIncomeModal(false)}>
                <Text style={styles.modalBtnText}>Închide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnApply} onPress={() => { setShowIncomeModal(false); fetchDashboardData(); }}>
                <Text style={styles.modalBtnTextApply}>Aplică</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // STILURI HEADER NOU
  headerContainer: { 
    backgroundColor: '#0d9488', // Teal 600 - o culoare superba si eleganta
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    elevation: 8 
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerBtn: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 75 
  },
  headerBtnText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '600', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  headerCenterBtn: { 
    alignItems: 'center', 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: -5
  },
  headerCenterBtnText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  headerBottomRow: {
    marginTop: 20,
    alignItems: 'center'
  },
  activeHotelName: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#ffffff', 
    textAlign: 'center',
    letterSpacing: 0.5
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  dateSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 10, marginTop: 10, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 18, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
  cardFull: { width: '100%', padding: 20, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 14, color: '#64748b', marginLeft: 8, fontWeight: '600'},
  cardNumber: { fontSize: 28, fontWeight: '800', marginTop: 7, marginLeft: 40 },
  hintText: { fontSize: 11, color: '#94a3b8', marginTop: 5 },
  subHeader: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 10, marginBottom: 15 },
  calendarCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 20 },
  shadow: { elevation: 3, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  bookingItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  bookingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  bookingDates: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  optionsBtn: { padding: 10, marginLeft: 5 },
  emptyState: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12 },
  emptyStateText: { color: '#94a3b8', fontStyle: 'italic' },
  occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  occupancyTextContainer: { flex: 1 },
  occupancyDetails: { fontSize: 13, color: '#94a3b8', marginTop: 5, marginLeft: 28 },
  progressContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  progressTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  alertsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  alertBox: { width: '48%', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
  arrivalBox: { backgroundColor: '#d1fae5' },
  departureBox: { backgroundColor: '#fee2e2' },
  alertTextWrapper: { marginLeft: 10 },
  alertTitle: { fontSize: 12, color: '#475569', fontWeight: '600' },
  alertCount: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  incomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  
  fabExtended: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, 
    backgroundColor: '#0d9488', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 30, 
    zIndex: 100 
  },
  fabText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8 
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalBtnCancel: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 10, width: '48%', alignItems: 'center' },
  modalBtnApply: { padding: 12, backgroundColor: '#f59e0b', borderRadius: 10, width: '48%', alignItems: 'center' },
  modalBtnText: { color: '#475569', fontWeight: '600' },
  modalBtnTextApply: { color: '#fff', fontWeight: 'bold' },
  speciesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 5 },
  speciesCircle: { alignItems: 'center', justifyContent: 'center' },
  speciesEmoji: { fontSize: 24, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 30, overflow: 'hidden' },
  speciesCount: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 'bold', width: 20, height: 20, borderRadius: 10, textAlign: 'center', lineHeight: 20, overflow: 'hidden' },
  speciesName: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
  actionModalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '80%', alignSelf: 'center' },
  actionModalHeader: { marginBottom: 20, alignItems: 'center' },
  actionModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  actionPetName: { fontSize: 14, color: '#64748b', marginTop: 5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#f1f5f9', borderRadius: 12, marginBottom: 10 },
  actionBtnText: { color: '#475569', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  actionBtnWarning: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fef3c7', borderRadius: 12, marginBottom: 10 },
  actionBtnTextWarning: { color: '#d97706', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  actionBtnDanger: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fee2e2', borderRadius: 12, marginBottom: 10 },
  actionBtnTextDanger: { color: '#ef4444', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  actionBtnCancel: { padding: 15, backgroundColor: '#f8fafc', borderRadius: 12, alignItems: 'center', marginTop: 5 },
  actionBtnTextCancel: { color: '#64748b', fontSize: 16, fontWeight: 'bold' }
});