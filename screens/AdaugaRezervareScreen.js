import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../api'

const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdaugaRezervareScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useContext(AuthContext);

  const currentHotelId = route.params?.hotelId || (user?.hotel_ids && user.hotel_ids.length > 0 ? user.hotel_ids[0] : user?.hotel_id);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [ownerEmail, setOwnerEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [disabledDatesMap, setDisabledDatesMap] = useState({});
  const [fullDatesArray, setFullDatesArray] = useState([]);
  const [acceptedAnimals, setAcceptedAnimals] = useState([]);

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!currentHotelId) {
        setLoading(false);
        return;
      }

      try {
        const animalsRes = await fetch(`${API_BASE_URL}/api/dashboard/accepted-animals/${currentHotelId}`);
        const animalsJson = await animalsRes.json();
        if (animalsJson.success && animalsJson.animals.length > 0) {
          setAcceptedAnimals(animalsJson.animals);
          setSelectedAnimalId(animalsJson.animals[0].id);
        }

        const response = await fetch(`${API_BASE_URL}/api/dashboard/${currentHotelId}`);
        const json = await response.json();
        
        if (json.success) {
          calculateDisabledDates(json.bookingIntervals, json.stats.capacitateTotala);
        }
      } catch (error) {
        Alert.alert("Eroare", "Nu am putut încărca datele calendarului.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [currentHotelId]);

  const calculateDisabledDates = (intervals, capacity) => {
    let map = {};
    let fullDates = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    let pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    while(pastDate < today) {
      map[getLocalDateString(pastDate)] = { disabled: true, disableTouchEvent: true, color: '#f1f5f9', textColor: '#cbd5e1' };
      pastDate.setDate(pastDate.getDate() + 1);
    }

    if (capacity > 0) {
      let checkDate = new Date(today);
      for(let i=0; i<365; i++) {
        const dateStr = getLocalDateString(checkDate);
        let count = 0;
        
        intervals.forEach(b => {
          if (b.status !== 'anulat' && b.status !== 'rejected') {
            const s = getLocalDateString(new Date(b.start_date));
            const e = getLocalDateString(new Date(b.end_date));
            if(dateStr >= s && dateStr <= e) count++;
          }
        });

        if(count >= capacity) {
          fullDates.push(dateStr);
          map[dateStr] = { 
            disabled: true, 
            disableTouchEvent: true, 
            color: '#fee2e2', 
            textColor: '#ef4444',
            customStyles: {
              text: { textDecorationLine: 'line-through', color: '#ef4444', fontWeight: 'bold' }
            }
          };
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    }

    setFullDatesArray(fullDates);
    setDisabledDatesMap(map);
  };

  const handleDayPress = (day) => {
    if (disabledDatesMap[day.dateString] && disabledDatesMap[day.dateString].disabled) {
      return;
    }

    if (!dates.start || (dates.start && dates.end)) {
      setDates({ start: day.dateString, end: '' });
    } else {
      if (day.dateString >= dates.start) {
        setDates({ ...dates, end: day.dateString });
      } else {
        setDates({ start: day.dateString, end: '' });
      }
    }
  };

  const calculateTotal = () => {
    if(!dates.start || !dailyPrice) return 0;
    const start = new Date(dates.start);
    const end = dates.end ? new Date(dates.end) : new Date(dates.start);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days * parseFloat(dailyPrice);
  };

  const getCombinedMarkedDates = () => {
    let combined = { ...disabledDatesMap };
    
    if (dates.start) {
      if (!dates.end || dates.start === dates.end) {
        combined[dates.start] = { ...combined[dates.start], startingDay: true, endingDay: true, color: '#2563EB', textColor: 'white' };
      } else {
        let d = new Date(dates.start);
        const end = new Date(dates.end);
        
        combined[getLocalDateString(d)] = { ...combined[getLocalDateString(d)], startingDay: true, color: '#2563EB', textColor: 'white' };
        d.setDate(d.getDate() + 1);
        
        while (d < end) {
          combined[getLocalDateString(d)] = { ...combined[getLocalDateString(d)], color: '#60a5fa', textColor: 'white' };
          d.setDate(d.getDate() + 1);
        }
        combined[getLocalDateString(end)] = { ...combined[getLocalDateString(end)], endingDay: true, color: '#2563EB', textColor: 'white' };
      }
    }
    return combined;
  };

  const handleSave = async () => {
    const finalEndDate = dates.end ? dates.end : dates.start;

    if (!selectedAnimalId || !petName || !ownerEmail || !dates.start || !finalEndDate || !dailyPrice) {
      Alert.alert("Eroare", "Te rog completează toate câmpurile obligatorii.");
      return;
    }

    let checkD = new Date(dates.start);
    let endD = new Date(finalEndDate);
    while(checkD <= endD) {
       if (fullDatesArray.includes(getLocalDateString(checkD))) {
           Alert.alert("Eroare", "Perioada selectată include zile în care hotelul este deja plin!");
           return;
       }
       checkD.setDate(checkD.getDate() + 1);
    }

    const priceTotalCalculated = calculateTotal();
    const selectedAnimalObj = acceptedAnimals.find(a => a.id === selectedAnimalId);
    const petType = selectedAnimalObj ? selectedAnimalObj.name : null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/add-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: currentHotelId,
          animal_id: selectedAnimalId,
          pet_type: petType,
          pet_name: petName,
          owner_email: ownerEmail, 
          start_date: dates.start,
          end_date: finalEndDate,
          price_total: priceTotalCalculated
        })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        Alert.alert("Succes", "Rezervarea a fost adăugată cu succes!");
        navigation.goBack();
      } else {
        Alert.alert("Eroare", json.message || "A apărut o problemă.");
      }
    } catch (error) {
      Alert.alert("Eroare", "Eroare de conexiune la server.");
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adaugă Rezervare</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        
        <Text style={styles.label}>Tip animal *</Text>
        <View style={styles.animalSelectionContainer}>
          {acceptedAnimals.map((animal) => (
            <TouchableOpacity 
              key={animal.id} 
              style={[
                styles.animalBadge, 
                selectedAnimalId === animal.id && styles.animalBadgeSelected
              ]}
              onPress={() => setSelectedAnimalId(animal.id)}
            >
              <Text style={[
                styles.animalBadgeText, 
                selectedAnimalId === animal.id && styles.animalBadgeTextSelected
              ]}>
                {animal.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Email proprietar *</Text>
        <TextInput
          style={styles.input}
          value={ownerEmail}
          onChangeText={setOwnerEmail}
          placeholder="Ex: client@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Nume animal *</Text>
        <TextInput
          style={styles.input}
          value={petName}
          onChangeText={setPetName}
          placeholder="Ex: Rex"
        />

        <Text style={styles.label}>Preț pe zi (RON) *</Text>
        <TextInput
          style={styles.input}
          value={dailyPrice}
          onChangeText={setDailyPrice}
          placeholder="Ex: 100"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Perioadă Cazare *</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            markingType={'period'}
            onDayPress={handleDayPress}
            markedDates={getCombinedMarkedDates()}
          />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total de plată:</Text>
          <Text style={styles.totalValue}>{calculateTotal()} RON</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Salvează Rezervarea</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 8, marginTop: 10 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
    borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 10
  },
  animalSelectionContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  animalBadge: { 
    backgroundColor: '#e2e8f0', paddingVertical: 10, paddingHorizontal: 20, 
    borderRadius: 20, marginRight: 10, marginBottom: 10 
  },
  animalBadgeSelected: { backgroundColor: '#2563EB' },
  animalBadgeText: { color: '#475569', fontWeight: 'bold' },
  animalBadgeTextSelected: { color: '#ffffff' },
  calendarContainer: {
    backgroundColor: '#fff', borderRadius: 16, padding: 10, marginTop: 5, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  totalContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#eff6ff', padding: 18, borderRadius: 12, marginBottom: 20
  },
  totalLabel: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#2563EB' },
  saveBtn: {
    backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center'
  },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});