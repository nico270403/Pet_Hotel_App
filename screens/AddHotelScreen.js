import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AVAILABLE_ANIMALS = [
  'Câine', 'Pisică', 'Rozătoare', 'Păsări', 'Reptilă', 
  'Iepure', 'Pește', 'Porcusor de guineea', 'Arici', 
  'Veveriță', 'Hamster', 'Broască țestoasă', 'Reptile mici'
];

export default function AddHotelScreen({ navigation }) {
  const { user, setUser, logout } = useContext(AuthContext); 
  
  const [showGuestForm, setShowGuestForm] = useState(false);

  const [managerName, setManagerName] = useState(user?.name !== 'Oaspete' ? user?.name : '');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState([]); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  if (user?.isGuest && !showGuestForm) {
    return (
      <View style={styles.promoContainer}>
        <Text style={{ fontSize: 80, marginBottom: 10 }}>🏨</Text>
        <Text style={styles.promoTitle}>Dezvoltă-ți afacerea cu noi!</Text>
        <View style={styles.promoList}>
          <Text style={styles.promoItem}>✅ Atrage clienți noi lunar</Text>
          <Text style={styles.promoItem}>✅ Gestionează rezervările direct din telefon</Text>
          <Text style={styles.promoItem}>✅ Acces asupra vizualizarea detaliilor importante: sume încasate, rezervări, rata de ocupare. </Text>
        </View>
        <Text style={styles.promoSubtitle}>Înscrie-ți pet-hotelul gratuit și începe să primești rezervări imediat.</Text>
        
        <TouchableOpacity style={styles.promoBtn} onPress={() => setShowGuestForm(true)}>
          <Text style={styles.promoBtnText}>Creează Cont Hotel Acum</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ marginTop: 25 }} onPress={logout}>
          <Text style={{ color: '#6b7280', fontSize: 15, fontWeight: '600' }}>← Înapoi la Autentificare</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleAnimal = (animal) => {
    if (selectedAnimals.includes(animal)) {
      setSelectedAnimals(selectedAnimals.filter(a => a !== animal));
    } else {
      setSelectedAnimals([...selectedAnimals, animal]);
    }
  };

  const handleCreateHotel = async () => {
    if (!name || !capacity || !managerName || !city || selectedAnimals.length === 0) {
      Alert.alert("Eroare", "Te rog completează toate datele obligatorii și alege cel puțin un animal!");
      return;
    }

    setLoading(true);
    try {
      let finalUserId = user?.id;

      if (user?.isGuest) {
        if (!email || !password) {
          Alert.alert("Eroare", "Trebuie să completezi Email-ul și Parola pentru a crea contul!");
          setLoading(false); return;
        }
        if (password.length < 6) {
          Alert.alert("Securitate", "Parola trebuie să aibă minim 6 caractere!");
          setLoading(false); return;
        }

        const regResponse = await fetch('http://172.20.10.2:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: managerName, email, password, role: 'manager' })
        });
        const regData = await regResponse.json();

        if (!regResponse.ok || !regData.success) {
          Alert.alert("Eroare Cont", regData.message || "Acest email este deja folosit!");
          setLoading(false); return;
        }
        finalUserId = regData.user.id;
      }

      const response = await fetch('http://172.20.10.2:3000/api/dashboard/create-hotel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          city, 
          phone, 
          capacity: parseInt(capacity),
          userId: finalUserId,
          animals: selectedAnimals 
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const newHotelId = result.hotelId || result.hotel_id || result.id;
        
        Alert.alert(
          "Felicitări! 🎉", 
          "Contul tău și Hotelul au fost configurate cu succes!", 
          [{ 
            text: "Intră în Panou", 
            onPress: () => {
              setUser({ 
                id: finalUserId, 
                name: managerName, 
                email: user?.isGuest ? email : user.email, 
                role: 'manager', 
                hotel_id: newHotelId 
              });
            }
          }]
        );
      } else {
        Alert.alert("Eroare Server", result.message || "Probleme la salvarea hotelului.");
      }
    } catch (error) {
      Alert.alert("Eroare", "Nu mă pot conecta la server. Verifică IP-ul.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Configurează Hotelul 🏨</Text>
            <Text style={styles.subtitle}>Completează detaliile pentru afacerea ta.</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={28} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {user?.isGuest && (
          <View style={styles.guestSection}>
            <Text style={styles.sectionTitle}>1. Date pentru conectare</Text>
            <Text style={styles.label}>Email conectare *</Text>
            <TextInput style={styles.input} placeholder="hotel@exemplu.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Parolă (Minim 6 caractere) *</Text>
            <TextInput style={styles.input} placeholder="********" value={password} onChangeText={setPassword} secureTextEntry />
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>2. Detalii Afacere</Text>
          </View>
        )}

        <Text style={styles.label}>Numele Managerului *</Text>
        <TextInput style={styles.input} placeholder="Ex: Maria Popa" value={managerName} onChangeText={setManagerName} />

        <Text style={styles.label}>Numele Hotelului / Clinicii *</Text>
        <TextInput style={styles.input} placeholder="Ex: All Pets Resort" value={name} onChangeText={setName} />

        <Text style={styles.label}>Oraș *</Text>
        <TextInput style={styles.input} placeholder="Ex: Timișoara" value={city} onChangeText={setCity} />

        <Text style={styles.label}>Telefon de contact</Text>
        <TextInput style={styles.input} placeholder="Ex: 0740 000 000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Capacitate totală (Locuri) *</Text>
        <TextInput style={styles.input} placeholder="Câte animale poți caza simultan?" keyboardType="numeric" value={capacity} onChangeText={setCapacity} />

        <Text style={[styles.label, { marginTop: 10 }]}>Bifează din listă ce animale accepți: *</Text>
        <View style={styles.animalsContainer}>
          {AVAILABLE_ANIMALS.map((animal) => {
            const isSelected = selectedAnimals.includes(animal);
            return (
              <TouchableOpacity 
                key={animal} 
                style={[styles.animalChip, isSelected && styles.animalChipSelected]}
                onPress={() => toggleAnimal(animal)}
              >
                <Text style={[styles.animalChipText, isSelected && styles.animalChipTextSelected]}>
                  {animal} {isSelected ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreateHotel} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvează și Crează Contul</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10, marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  logoutBtn: { padding: 5, backgroundColor: '#fee2e2', borderRadius: 10 },
  guestSection: { backgroundColor: '#eff6ff', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 20, backgroundColor: '#fff' },
  animalsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
  animalChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', marginRight: 10, marginBottom: 10 },
  animalChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  animalChipText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
  animalChipTextSelected: { color: '#ffffff' },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  promoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#f9fafb' },
  promoTitle: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 20 },
  promoList: { alignSelf: 'flex-start', marginVertical: 20 },
  promoItem: { fontSize: 16, color: '#374151', marginBottom: 10, fontWeight: '600' },
  promoSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  promoBtn: { backgroundColor: '#10b981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 2 },
  promoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});