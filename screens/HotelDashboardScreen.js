// // import React, { useState, useEffect, useContext } from 'react';
// // import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
// // import { AuthContext } from '../context/AuthContext';
// // import { Ionicons } from '@expo/vector-icons'; 
// // import { Calendar } from 'react-native-calendars'; 
// // import { useNavigation, CommonActions } from '@react-navigation/native';

// // export default function HotelDashboardScreen() { 
// //   const navigation = useNavigation();
// //   const { user, logout } = useContext(AuthContext);

// //   if (user?.isGuest) {
// //     return (
// //       <View style={styles.promoContainer}>
// //         <TouchableOpacity 
// //           style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}
// //           onPress={logout} 
// //         >
// //           <Ionicons name="arrow-back" size={32} color="#1f2937" />
// //         </TouchableOpacity>

// //         <Text style={{ fontSize: 80, marginBottom: 10, marginTop: 40 }}>🏨</Text>
// //         <Text style={styles.promoTitle}>Dezvoltă-ți afacerea cu noi!</Text>
// //         <View style={styles.promoList}>
// //           <Text style={styles.promoItem}>✅ Atrage mii de clienți noi lunar</Text>
// //           <Text style={styles.promoItem}>✅ Gestionează rezervările direct din telefon</Text>
// //           <Text style={styles.promoItem}>✅ Primești plăți sigure prin aplicație</Text>
// //         </View>
// //         <Text style={styles.promoSubtitle}>Înscrie-ți pet-hotelul sau clinica veterinară gratuit și începe să primești rezervări imediat.</Text>
        
// //         <TouchableOpacity style={styles.promoBtn} onPress={logout}>
// //           <Text style={styles.promoBtnText}>Creează Cont Hotel Acum</Text>
// //         </TouchableOpacity>
// //       </View>
// //     );
// //   }

// //   const [data, setData] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [filtruNume, setFiltruNume] = useState('Luna Curentă');
// //   const [datesParam, setDatesParam] = useState({ start: '', end: '' });
// //   const [markedDates, setMarkedDates] = useState({});

// //   const fetchDashboardData = async (filterDates = datesParam) => {
// //     try {
// //       let url = `http://172.20.10.2:3000/api/dashboard/${user?.hotel_id}`;
// //       if (filterDates.start && filterDates.end) url += `?startDate=${filterDates.start}&endDate=${filterDates.end}`;
// //       const response = await fetch(url);
// //       const json = await response.json();
// //       if (response.ok && json.success) {
// //         setData(json);
// //         genereazaZileCalendar(json.bookingIntervals);
// //       }
// //     } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
// //   };

// //   const genereazaZileCalendar = (intervals) => {
// //     if (!intervals || intervals.length === 0) return;
// //     let marked = {};
// //     intervals.forEach(interval => {
// //       let start = new Date(interval.start_date);
// //       let end = new Date(interval.end_date);
// //       while (start <= end) {
// //         let dataString = start.toISOString().split('T')[0];
// //         marked[dataString] = { selected: true, marked: true, selectedColor: '#ef4444', dotColor: '#ffffff' };
// //         start.setDate(start.getDate() + 1);
// //       }
// //     });
// //     setMarkedDates(marked);
// //   };

// //   useEffect(() => { if (user?.hotel_id) fetchDashboardData(); }, [user, datesParam]);

// //   if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;

// //   return (
// //     <View style={styles.mainContainer}>
// //       <View style={styles.headerContainer}>
// //         {/* Am înlocuit Săgeata cu butonul de LOGOUT */}
// //         <TouchableOpacity 
// //           onPress={logout} 
// //           style={{ padding: 5 }}
// //         >
// //           <Ionicons name="log-out-outline" size={28} color="#fff" />
// //         </TouchableOpacity>

// //         <View style={{ flex: 1, alignItems: 'center' }}>
// //           <Text style={styles.headerTitle}>Panou</Text>
// //         </View>

// //         <TouchableOpacity 
// //           onPress={() => {
// //             if (user?.hotel_id) {
// //               navigation.navigate('EditHotel', { hotelId: user.hotel_id });
// //             } else {
// //               Alert.alert("Eroare", "ID-ul hotelului nu este disponibil.");
// //             }
// //           }} 
// //           style={{ padding: 5 }}
// //         >
// //           <Ionicons name="create-outline" size={28} color="#fff" />
// //         </TouchableOpacity>
// //       </View>

// //       <ScrollView style={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}>
// //         {/* STATISTICI: Acest bloc e identic cu al tău */}
// //         <View style={styles.statsGrid}>
// //           <View style={[styles.card, styles.shadow]}>
// //             <View style={styles.cardHeader}>
// //               <Ionicons name="bed-outline" size={20} color="#3b82f6" /><Text style={styles.cardLabel}>Ocupate Azi</Text>
// //             </View>
// //             <Text style={[styles.cardNumber, { color: '#3b82f6' }]}>{data?.stats?.locuriOcupate || 0}</Text>
// //           </View>
// //           <View style={[styles.card, styles.shadow]}>
// //             <View style={styles.cardHeader}>
// //               <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" /><Text style={styles.cardLabel}>Libere Azi</Text>
// //             </View>
// //             <Text style={[styles.cardNumber, { color: '#10b981' }]}>{data?.stats?.locuriLibere || 0}</Text>
// //           </View>
// //           <View style={[styles.cardFull, styles.shadow]}>
// //             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
// //               <View style={styles.cardHeader}>
// //                 <Ionicons name="wallet-outline" size={20} color="#f59e0b" /><Text style={styles.cardLabel}>Venit ({filtruNume})</Text>
// //               </View>
// //             </View>
// //             <Text style={[styles.cardNumber, { color: '#f59e0b', fontSize: 28 }]}>{parseFloat(data?.stats?.venitCalculat || 0).toFixed(0)} RON</Text>
// //           </View>
// //         </View>

// //         <Text style={styles.subHeader}>📅 Grad de Ocupare Calendar</Text>
// //         <View style={[styles.calendarCard, styles.shadow]}>
// //           <Calendar theme={{ todayTextColor: '#2563EB', arrowColor: '#2563EB', dotColor: '#2563EB' }} markedDates={markedDates} />
// //         </View>
// //         <View style={{height: 40}}></View>
// //       </ScrollView>
// //     </View>
// //   );
// // }


// // const styles = StyleSheet.create({
// //   mainContainer: { flex: 1, backgroundColor: '#f1f5f9' },
// //   loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
// //   headerContainer: {
// //     backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30,
// //     borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row',
// //     justifyContent: 'space-between', alignItems: 'center', elevation: 5
// //   },
// //   headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#ffffff' },
// //   welcomeText: { fontSize: 15, color: '#bfdbfe', marginTop: 5 },
// //   logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
// //   scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
// //   statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
// //   card: { width: '48%', padding: 18, borderRadius: 20, backgroundColor: '#ffffff', marginBottom: 15 },
// //   cardFull: { width: '100%', padding: 20, borderRadius: 20, backgroundColor: '#ffffff', marginBottom: 15 },
// //   cardHeader: { flexDirection: 'row', alignItems: 'center' },
// //   cardLabel: { fontSize: 14, color: '#64748b', marginLeft: 6, fontWeight: '600' },
// //   cardNumber: { fontSize: 26, fontWeight: '800', marginTop: 5 },
// //   subHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 15, marginBottom: 15, marginLeft: 5 },
  
// //   filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
// //   filterBtn: { backgroundColor: '#f1f5f9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, width: '30%', alignItems: 'center' },
// //   filterBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  
// //   calendarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 10, marginBottom: 20 },
// //   legendRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 5 },
// //   legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
// //   legendText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  
// //   shadow: { elevation: 3, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },

// //   promoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#fff' },
// //   promoTitle: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 20 },
// //   promoList: { alignSelf: 'flex-start', marginVertical: 20 },
// //   promoItem: { fontSize: 16, color: '#374151', marginBottom: 10, fontWeight: '600' },
// //   promoSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
// //   promoBtn: { backgroundColor: '#10b981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
// //   promoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
// // });


// import React, { useState, useEffect, useContext } from 'react';
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
// import { AuthContext } from '../context/AuthContext';
// import { Ionicons } from '@expo/vector-icons'; 
// import { Calendar } from 'react-native-calendars'; 
// import { useNavigation } from '@react-navigation/native';
// import Svg, { Circle } from 'react-native-svg';

// const getLocalDateString = (dateInput) => {
//   const d = new Date(dateInput);
//   const year = d.getFullYear();
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const day = String(d.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// };

// export default function HotelDashboardScreen() { 
//   const navigation = useNavigation();
//   const { user, logout } = useContext(AuthContext);

//   const todayString = getLocalDateString(new Date());
//   const [selectedDate, setSelectedDate] = useState(todayString);
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [dailyStats, setDailyStats] = useState({ ocupate: 0, libere: 0, rataOcupare: 0 });
//   const [dayBookings, setDayBookings] = useState([]);
//   const [sosiriAzi, setSosiriAzi] = useState([]);
//   const [plecariAzi, setPlecariAzi] = useState([]);
//   const [showIncomeModal, setShowIncomeModal] = useState(false);
//   const [incomeDates, setIncomeDates] = useState({ start: '', end: '' });

//   if (user?.isGuest) {
//     return (
//       <View style={styles.promoContainer}>
//         <TouchableOpacity 
//           style={styles.guestBackBtn}
//           onPress={logout} 
//         >
//           <Ionicons name="arrow-back" size={32} color="#1f2937" />
//         </TouchableOpacity>
//         <Text style={styles.promoEmoji}>🏨</Text>
//         <Text style={styles.promoTitle}>Dezvoltă-ți afacerea cu noi!</Text>
//         <View style={styles.promoList}>
//           <Text style={styles.promoItem}>✅ Atrage mii de clienți noi lunar</Text>
//           <Text style={styles.promoItem}>✅ Gestionează rezervările direct din telefon</Text>
//           <Text style={styles.promoItem}>✅ Primești plăți sigure prin aplicație</Text>
//         </View>
//         <Text style={styles.promoSubtitle}>Înscrie-ți pet-hotelul sau clinica veterinară gratuit și începe să primești rezervări imediat.</Text>
//         <TouchableOpacity style={styles.promoBtn} onPress={logout}>
//           <Text style={styles.promoBtnText}>Creează Cont Hotel Acum</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const fetchDashboardData = async (filterDates = incomeDates) => {
//     try {
//       let url = `http://172.20.10.2:3000/api/dashboard/${user?.hotel_id}`;
//       if (filterDates.start && filterDates.end) url += `?startDate=${filterDates.start}&endDate=${filterDates.end}`;
      
//       const response = await fetch(url);
//       const json = await response.json();
      
//       if (response.ok && json.success) {
//         setData(json);
//         calculeazaOcuparePentruZiua(selectedDate, json.bookingIntervals, json.stats.capacitateTotala);
//       }
//     } catch (error) { 
//       console.error(error); 
//     } finally { 
//       setLoading(false); 
//       setRefreshing(false); 
//     }
//   };

//   const calculeazaOcuparePentruZiua = (dateStr, intervals, capacitate) => {
//     if (!intervals) return;
    
//     let ocupate = 0;
//     let rezervari = [];
//     let sosiri = [];
//     let plecari = [];

//     intervals.forEach(b => {
//       // Folosim funcția nouă pentru a evita decalajul de fus orar
//       const startYMD = getLocalDateString(b.start_date);
//       const endYMD = getLocalDateString(b.end_date);

//       // Verificăm pur și simplu string-urile
//       if (dateStr >= startYMD && dateStr <= endYMD) {
//         rezervari.push(b);
//         ocupate++;
//       }
      
//       if (startYMD === dateStr) sosiri.push(b);
//       if (endYMD === dateStr) plecari.push(b);
//     });

//     setDayBookings(rezervari);
//     setSosiriAzi(sosiri);
//     setPlecariAzi(plecari);
    
//     const libereCalculat = Math.max(0, (capacitate || 0) - ocupate);
//     const rata = capacitate > 0 ? Math.round((ocupate / capacitate) * 100) : 0;

//     setDailyStats({
//       ocupate: ocupate,
//       libere: libereCalculat,
//       rataOcupare: rata
//     });
//   };

//   const onDayPress = (day) => {
//     setSelectedDate(day.dateString);
//     calculeazaOcuparePentruZiua(day.dateString, data?.bookingIntervals, data?.stats?.capacitateTotala);
//   };

//   const generateMarkedDates = () => {
//     let marked = {};
//     if (data?.bookingIntervals) {
//       data.bookingIntervals.forEach(interval => {
//         let start = new Date(interval.start_date);
//         let end = new Date(interval.end_date);
        
//         // Evităm eventualele probleme de ore ascunse setându-le la miezul nopții local
//         start.setHours(0, 0, 0, 0);
//         end.setHours(0, 0, 0, 0);

//         while (start <= end) {
//           let dataString = getLocalDateString(start);
//           marked[dataString] = { marked: true, dotColor: '#ef4444' };
//           start.setDate(start.getDate() + 1);
//         }
//       });
//     }
    
//     marked[selectedDate] = { 
//       ...marked[selectedDate], 
//       selected: true, 
//       selectedColor: '#2563EB' 
//     };
//     return marked;
//   };

//   useEffect(() => { 
//     if (user?.hotel_id) fetchDashboardData(); 
//   }, [user, incomeDates]);

//   if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;

//   const radius = 35;
//   const strokeWidth = 8;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDashoffset = circumference - (circumference * dailyStats.rataOcupare) / 100;

//   return (
//     <View style={styles.mainContainer}>
//       <View style={styles.headerContainer}>
//         <TouchableOpacity onPress={logout} style={{ padding: 5 }}>
//           <Ionicons name="log-out-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>{data?.hotelName || "Panou"}</Text>
//         <TouchableOpacity 
//           onPress={() => navigation.navigate('EditHotel', { hotelId: user.hotel_id })} 
//           style={{ padding: 5 }}
//         >
//           <Ionicons name="create-outline" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView 
//         style={styles.scrollContent} 
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}
//       >
//         <Text style={styles.dateSubtitle}>Statistici pentru: {selectedDate === todayString ? "Astăzi" : selectedDate}</Text>
        
//         <View style={styles.statsGrid}>
//           <View style={[styles.card, styles.shadow]}>
//             <View style={styles.cardHeader}>
//               <Ionicons name="bed-outline" size={20} color="#ef4444" />
//               <Text style={styles.cardLabel}>Ocupate</Text>
//             </View>
//             <Text style={[styles.cardNumber, { color: '#ef4444' }]}>{dailyStats.ocupate}</Text>
//           </View>
          
//           <View style={[styles.card, styles.shadow]}>
//             <View style={styles.cardHeader}>
//               <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
//               <Text style={styles.cardLabel}>Libere</Text>
//             </View>
//             <Text style={[styles.cardNumber, { color: '#10b981' }]}>{dailyStats.libere}</Text>
//           </View>

//           <View style={[styles.cardFull, styles.shadow, styles.occupancyRow]}>
//             <View style={styles.occupancyTextContainer}>
//               <View style={styles.cardHeader}>
//                 <Ionicons name="pie-chart-outline" size={20} color="#2563EB" />
//                 <Text style={styles.cardLabel}>Rată Ocupare</Text>
//               </View>
//               <Text style={styles.occupancyDetails}>Capacitate totală: {data?.stats?.capacitateTotala}</Text>
//             </View>
//             <View style={styles.progressContainer}>
//               <Svg width="90" height="90" viewBox="0 0 90 90">
//                 <Circle cx="45" cy="45" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
//                 <Circle 
//                   cx="45" cy="45" r={radius} 
//                   stroke={dailyStats.rataOcupare >= 80 ? "#ef4444" : dailyStats.rataOcupare >= 50 ? "#f59e0b" : "#10b981"} 
//                   strokeWidth={strokeWidth} 
//                   fill="none" 
//                   strokeDasharray={circumference} 
//                   strokeDashoffset={strokeDashoffset} 
//                   strokeLinecap="round"
//                   transform="rotate(-90 45 45)"
//                 />
//               </Svg>
//               <View style={styles.progressTextContainer}>
//                 <Text style={styles.progressText}>{dailyStats.rataOcupare}%</Text>
//               </View>
//             </View>
//           </View>
          
//           <TouchableOpacity 
//             style={[styles.cardFull, styles.shadow]}
//             onPress={() => setShowIncomeModal(true)}
//           >
//             <View style={styles.incomeHeader}>
//               <View style={styles.cardHeader}>
//                 <Ionicons name="wallet-outline" size={20} color="#f59e0b" />
//                 <Text style={styles.cardLabel}>
//                   Venit {incomeDates.start ? `(${incomeDates.start} - ${incomeDates.end})` : "(Luna Curentă)"}
//                 </Text>
//               </View>
//               <Ionicons name="filter-outline" size={20} color="#cbd5e1" />
//             </View>
//             <Text style={[styles.cardNumber, { color: '#f59e0b', fontSize: 28 }]}>
//               {parseFloat(data?.stats?.venitCalculat || 0).toFixed(0)} RON
//             </Text>
//             <Text style={styles.hintText}>Apasă pentru a schimba perioada</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.alertsContainer}>
//           <View style={[styles.alertBox, styles.arrivalBox, styles.shadow]}>
//             <Ionicons name="log-in-outline" size={24} color="#059669" />
//             <View style={styles.alertTextWrapper}>
//               <Text style={styles.alertTitle}>Sosiri ({selectedDate})</Text>
//               <Text style={styles.alertCount}>{sosiriAzi.length} animăluțe</Text>
//             </View>
//           </View>
//           <View style={[styles.alertBox, styles.departureBox, styles.shadow]}>
//             <Ionicons name="log-out-outline" size={24} color="#dc2626" />
//             <View style={styles.alertTextWrapper}>
//               <Text style={styles.alertTitle}>Plecări ({selectedDate})</Text>
//               <Text style={styles.alertCount}>{plecariAzi.length} animăluțe</Text>
//             </View>
//           </View>
//         </View>

//         <Text style={styles.subHeader}>📅 Calendar Rezervări</Text>
//         <View style={[styles.calendarCard, styles.shadow]}>
//           <Calendar 
//             theme={{ todayTextColor: '#2563EB', arrowColor: '#2563EB' }} 
//             markedDates={generateMarkedDates()} 
//             onDayPress={onDayPress}
//           />
//         </View>

//         <Text style={styles.subHeader}>🐾 Cazări în data de {selectedDate}</Text>
//         {dayBookings.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyStateText}>Nicio rezervare pentru această zi.</Text>
//           </View>
//         ) : (
//           dayBookings.map((booking, index) => (
//             <View key={index} style={[styles.bookingItem, styles.shadow]}>
//               <View style={styles.bookingIcon}>
//                 <Ionicons name="paw" size={24} color="#2563EB" />
//               </View>
//               <View style={styles.bookingInfo}>
//                 <Text style={styles.bookingName}>{booking.pet_name}</Text>
//                 <Text style={styles.bookingDates}>
//                   {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
//                 </Text>
//               </View>
//             </View>
//           ))
//         )}
        
//         <View style={{height: 100}}></View>
//       </ScrollView>

//       <TouchableOpacity 
//         style={[styles.fab, styles.shadow]} 
//         onPress={() => navigation.navigate('AdaugaRezervare')} 
//       >
//         <Ionicons name="add" size={32} color="#ffffff" />
//       </TouchableOpacity>

//       <Modal visible={showIncomeModal} animationType="slide" transparent={true}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Alege perioada pentru venit</Text>
//             <Calendar
//               markingType={'period'}
//               onDayPress={(day) => {
//                 if (!incomeDates.start || (incomeDates.start && incomeDates.end)) {
//                   setIncomeDates({ start: day.dateString, end: '' });
//                 } else {
//                   if (new Date(day.dateString) > new Date(incomeDates.start)) {
//                     setIncomeDates({ ...incomeDates, end: day.dateString });
//                   } else {
//                     setIncomeDates({ start: day.dateString, end: '' });
//                   }
//                 }
//               }}
//               markedDates={{
//                 [incomeDates.start]: { startingDay: true, color: '#f59e0b', textColor: 'white' },
//                 [incomeDates.end]: { endingDay: true, color: '#f59e0b', textColor: 'white' }
//               }}
//             />
//             <View style={styles.modalActions}>
//               <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowIncomeModal(false)}>
//                 <Text style={styles.modalBtnText}>Închide</Text>
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={styles.modalBtnApply} 
//                 onPress={() => {
//                   setShowIncomeModal(false);
//                   fetchDashboardData();
//                 }}
//               >
//                 <Text style={styles.modalBtnTextApply}>Aplică</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
//   loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   headerContainer: {
//     backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25,
//     borderBottomLeftRadius: 25, borderBottomRightRadius: 25, flexDirection: 'row',
//     justifyContent: 'space-between', alignItems: 'center', elevation: 5
//   },
//   headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
//   scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
//   dateSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 10, marginTop: 10, fontWeight: '600' },
//   statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   card: { width: '48%', padding: 18, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
//   cardFull: { width: '100%', padding: 20, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
//   cardHeader: { flexDirection: 'row', alignItems: 'center' },
//   cardLabel: { fontSize: 14, color: '#64748b', marginLeft: 8, fontWeight: '600' },
//   cardNumber: { fontSize: 28, fontWeight: '800', marginTop: 8 },
//   hintText: { fontSize: 11, color: '#94a3b8', marginTop: 5 },
//   subHeader: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 10, marginBottom: 15 },
//   calendarCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 20 },
//   shadow: { elevation: 3, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
//   bookingItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
//   bookingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
//   bookingInfo: { flex: 1 },
//   bookingName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
//   bookingDates: { fontSize: 13, color: '#64748b', marginTop: 2 },
//   emptyState: { padding: 20, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12 },
//   emptyStateText: { color: '#94a3b8', fontStyle: 'italic' },
//   occupancyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   occupancyTextContainer: { flex: 1 },
//   occupancyDetails: { fontSize: 13, color: '#94a3b8', marginTop: 5, marginLeft: 28 },
//   progressContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
//   progressTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
//   progressText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
//   alertsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
//   alertBox: { width: '48%', padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
//   arrivalBox: { backgroundColor: '#d1fae5' },
//   departureBox: { backgroundColor: '#fee2e2' },
//   alertTextWrapper: { marginLeft: 10 },
//   alertTitle: { fontSize: 12, color: '#475569', fontWeight: '600' },
//   alertCount: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
//   incomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
//   fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
//   modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
//   modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
//   modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
//   modalBtnCancel: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 10, width: '48%', alignItems: 'center' },
//   modalBtnApply: { padding: 12, backgroundColor: '#f59e0b', borderRadius: 10, width: '48%', alignItems: 'center' },
//   modalBtnText: { color: '#475569', fontWeight: '600' },
//   modalBtnTextApply: { color: '#fff', fontWeight: 'bold' },
//   promoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#fff' },
//   guestBackBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
//   promoEmoji: { fontSize: 80, marginBottom: 10, marginTop: 40 },
//   promoTitle: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 20 },
//   promoList: { alignSelf: 'flex-start', marginVertical: 20 },
//   promoItem: { fontSize: 16, color: '#374151', marginBottom: 10, fontWeight: '600' },
//   promoSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
//   promoBtn: { backgroundColor: '#10b981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
//   promoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
// });


import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
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

export default function HotelDashboardScreen() { 
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);

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

  const fetchDashboardData = async (filterDates = incomeDates) => {
    try {
      let url = `http://172.20.10.2:3000/api/dashboard/${user?.hotel_id}`;
      if (filterDates.start && filterDates.end) url += `?startDate=${filterDates.start}&endDate=${filterDates.end}`;
      
      const response = await fetch(url);
      const json = await response.json();
      
      if (response.ok && json.success) {
        setData(json);
        calculeazaOcuparePentruZiua(selectedDate, json.bookingIntervals, json.stats.capacitateTotala);
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const calculeazaOcuparePentruZiua = (dateStr, intervals, capacitate) => {
    if (!intervals) return;
    
    let ocupate = 0;
    let rezervari = [];
    let sosiri = [];
    let plecari = [];
    let spStats = {};

    intervals.forEach(b => {
      const startYMD = getLocalDateString(b.start_date);
      const endYMD = getLocalDateString(b.end_date);

      if (dateStr >= startYMD && dateStr <= endYMD) {
        rezervari.push(b);
        ocupate++;
        
        const spName = b.species_name || 'Necunoscut';
        spStats[spName] = (spStats[spName] || 0) + 1;
      }
      
      if (startYMD === dateStr) sosiri.push(b);
      if (endYMD === dateStr) plecari.push(b);
    });

    setDayBookings(rezervari);
    setSosiriAzi(sosiri);
    setPlecariAzi(plecari);
    setSpeciesStats(spStats);
    
    const libereCalculat = Math.max(0, (capacitate || 0) - ocupate);
    const rata = capacitate > 0 ? Math.round((ocupate / capacitate) * 100) : 0;

    setDailyStats({
      ocupate: ocupate,
      libere: libereCalculat,
      rataOcupare: rata
    });
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    calculeazaOcuparePentruZiua(day.dateString, data?.bookingIntervals, data?.stats?.capacitateTotala);
  };

  const generateMarkedDates = () => {
    let marked = {};
    if (data?.bookingIntervals) {
      data.bookingIntervals.forEach(interval => {
        let start = new Date(interval.start_date);
        let end = new Date(interval.end_date);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        while (start <= end) {
          let dataString = getLocalDateString(start);
          marked[dataString] = { marked: true, dotColor: '#ef4444' };
          start.setDate(start.getDate() + 1);
        }
      });
    }
    
    marked[selectedDate] = { 
      ...marked[selectedDate], 
      selected: true, 
      selectedColor: '#2563EB' 
    };
    return marked;
  };

  useEffect(() => { 
    if (user?.hotel_id) fetchDashboardData(); 
  }, [user, incomeDates]);

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;

  const radius = 35;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * dailyStats.rataOcupare) / 100;

  const getEmojiForSpecies = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('cain') || lower.includes('câin')) return '🐶';
    if (lower.includes('pisic')) return '🐱';
    if (lower.includes('pas') || lower.includes('păs')) return '🦜';
    if (lower.includes('iep')) return '🐰';
    return '🐾';
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={logout} style={{ padding: 5 }}>
          <Ionicons name="log-out-outline" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{data?.hotelName || "Panou"}</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditHotel', { hotelId: user.hotel_id })} 
          style={{ padding: 5 }}
        >
          <Ionicons name="create-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}
      >
        <Text style={styles.dateSubtitle}>Statistici pentru: {selectedDate === todayString ? "Astăzi" : selectedDate}</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bed-outline" size={20} color="#ef4444" />
              <Text style={styles.cardLabel}>Ocupate</Text>
            </View>
            <Text style={[styles.cardNumber, { color: '#ef4444' }]}>{dailyStats.ocupate}</Text>
          </View>
          
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.cardLabel}>Libere</Text>
            </View>
            <Text style={[styles.cardNumber, { color: '#10b981' }]}>{dailyStats.libere}</Text>
          </View>

          {Object.keys(speciesStats).length > 0 && (
            <View style={[styles.cardFull, styles.shadow, { paddingVertical: 15 }]}>
              <Text style={[styles.cardLabel, { marginBottom: 10, marginLeft: 0 }]}>Cazări per specie în această zi</Text>
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
          )}

          <View style={[styles.cardFull, styles.shadow, styles.occupancyRow]}>
            <View style={styles.occupancyTextContainer}>
              <View style={styles.cardHeader}>
                <Ionicons name="pie-chart-outline" size={20} color="#2563EB" />
                <Text style={styles.cardLabel}>Rată Ocupare</Text>
              </View>
              <Text style={styles.occupancyDetails}>Capacitate totală: {data?.stats?.capacitateTotala}</Text>
            </View>
            <View style={styles.progressContainer}>
              <Svg width="90" height="90" viewBox="0 0 90 90">
                <Circle cx="45" cy="45" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
                <Circle 
                  cx="45" cy="45" r={radius} 
                  stroke={dailyStats.rataOcupare >= 80 ? "#ef4444" : dailyStats.rataOcupare >= 50 ? "#f59e0b" : "#10b981"} 
                  strokeWidth={strokeWidth} 
                  fill="none" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                />
              </Svg>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>{dailyStats.rataOcupare}%</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.cardFull, styles.shadow]}
            onPress={() => setShowIncomeModal(true)}
          >
            <View style={styles.incomeHeader}>
              <View style={styles.cardHeader}>
                <Ionicons name="wallet-outline" size={20} color="#f59e0b" />
                <Text style={styles.cardLabel}>
                  Venit {incomeDates.start ? `(${incomeDates.start} - ${incomeDates.end})` : "(Luna Curentă)"}
                </Text>
              </View>
              <Ionicons name="filter-outline" size={20} color="#cbd5e1" />
            </View>
            <Text style={[styles.cardNumber, { color: '#f59e0b', fontSize: 28 }]}>
              {parseFloat(data?.stats?.venitCalculat || 0).toFixed(0)} RON
            </Text>
            <Text style={styles.hintText}>Apasă pentru a schimba perioada</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsContainer}>
          <View style={[styles.alertBox, styles.arrivalBox, styles.shadow]}>
            <Ionicons name="log-in-outline" size={24} color="#059669" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Sosiri</Text>
              <Text style={styles.alertCount}>{sosiriAzi.length} rezervări</Text>
            </View>
          </View>
          <View style={[styles.alertBox, styles.departureBox, styles.shadow]}>
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.alertTitle}>Plecări</Text>
              <Text style={styles.alertCount}>{plecariAzi.length} rezervări</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subHeader}>📅 Calendar Rezervări</Text>
        <View style={[styles.calendarCard, styles.shadow]}>
          <Calendar 
            theme={{ todayTextColor: '#2563EB', arrowColor: '#2563EB' }} 
            markedDates={generateMarkedDates()} 
            onDayPress={onDayPress}
          />
        </View>

        <Text style={styles.subHeader}>🐾 Cazări în data de {selectedDate}</Text>
        {dayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nicio rezervare pentru această zi.</Text>
          </View>
        ) : (
          dayBookings.map((booking, index) => (
            <View key={index} style={[styles.bookingItem, styles.shadow]}>
              <View style={styles.bookingIcon}>
                <Text style={{fontSize: 20}}>{getEmojiForSpecies(booking.species_name || '')}</Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.pet_name} <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: 'normal'}}>({booking.species_name})</Text></Text>
                <Text style={styles.bookingDates}>
                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: booking.status === 'approved' ? '#d1fae5' : '#fef3c7' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: booking.status === 'approved' ? '#059669' : '#d97706' }
                ]}>{booking.status}</Text>
              </View>
            </View>
          ))
        )}
        
        <View style={{height: 100}}></View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, styles.shadow]} 
        onPress={() => navigation.navigate('AdaugaRezervare')} 
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={showIncomeModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alege perioada pentru venit</Text>
            <Calendar
              markingType={'period'}
              onDayPress={(day) => {
                if (!incomeDates.start || (incomeDates.start && incomeDates.end)) {
                  setIncomeDates({ start: day.dateString, end: '' });
                } else {
                  if (new Date(day.dateString) > new Date(incomeDates.start)) {
                    setIncomeDates({ ...incomeDates, end: day.dateString });
                  } else {
                    setIncomeDates({ start: day.dateString, end: '' });
                  }
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
              <TouchableOpacity 
                style={styles.modalBtnApply} 
                onPress={() => {
                  setShowIncomeModal(false);
                  fetchDashboardData();
                }}
              >
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
  headerContainer: {
    backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', elevation: 5
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  dateSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 10, marginTop: 10, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 18, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
  cardFull: { width: '100%', padding: 20, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 14, color: '#64748b', marginLeft: 8, fontWeight: '600' },
  cardNumber: { fontSize: 28, fontWeight: '800', marginTop: 8 },
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
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
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
  speciesName: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' }
});