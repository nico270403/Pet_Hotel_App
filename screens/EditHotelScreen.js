// import React, { useState, useEffect } from 'react';
// import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const AVAILABLE_ANIMALS = [
//   'Câine', 'Pisică', 'Rozătoare', 'Păsări', 'Reptilă', 
//   'Iepure', 'Pește', 'Porcusor de guineea', 'Arici', 
//   'Veveriță', 'Hamster', 'Broască țestoasă', 'Reptile mici'
// ];

// export default function EditHotelScreen({ route, navigation }) {
//   const { hotelId } = route.params;
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     name: '', city: '', phone: '', capacity: '', address: '', 
//     short_description: '', long_description: '', email: '', website: '', image_url: ''
//   });
//   const [selectedAnimals, setSelectedAnimals] = useState([]);

//   useEffect(() => {
//     fetch(`http://172.20.10.2:3000/api/dashboard/hotel-details/${hotelId}`)
//       .then(res => res.json())
//       .then(data => {
//         setFormData({
//           name: data.name || '', city: data.city || '', phone: data.phone || '',
//           capacity: data.capacity ? data.capacity.toString() : '0', address: data.address || '',
//           short_description: data.short_description || '', long_description: data.long_description || '',
//           email: data.email || '', website: data.website || '', image_url: data.image_url || ''
//         });
//         setSelectedAnimals(data.animals || []); 
//         setLoading(false);
//       }).catch(() => {
//         Alert.alert("Eroare", "Nu am putut încărca datele.");
//         setLoading(false);
//       });
//   }, [hotelId]);

//   const toggleAnimal = (animal) => {
//     if (selectedAnimals.includes(animal)) {
//       setSelectedAnimals(selectedAnimals.filter(a => a !== animal));
//     } else {
//       setSelectedAnimals([...selectedAnimals, animal]);
//     }
//   };

//   const handleUpdate = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`http://172.20.10.2:3000/api/dashboard/update-hotel/${hotelId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ...formData, animals: selectedAnimals }) 
//       });
//       if (response.ok) {
//         Alert.alert("Succes", "Datele au fost salvate!");
//         navigation.goBack(); 
//       }
//     } catch (e) { Alert.alert("Eroare", "Nu s-a putut salva."); } finally { setLoading(false); }
//   };

//   if (loading) return <ActivityIndicator style={{marginTop: 50}} size="large" color="#10b981" />;

//   return (
//     <ScrollView style={styles.container}>
//       <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
//         <Ionicons name="arrow-back" size={28} color="#1f2937" />
//       </TouchableOpacity>

//       <Text style={styles.title}>Editează Filtre și Detalii</Text>
      
//       {[
//         { key: 'name', label: 'Nume Hotel' },
//         { key: 'city', label: 'Oraș' },
//         { key: 'phone', label: 'Telefon' },
//         { key: 'email', label: 'Email Public' },
//         { key: 'website', label: 'Website' },
//         { key: 'address', label: 'Adresă' },
//         { key: 'capacity', label: 'Capacitate (Locuri)', type: 'numeric' },
//         { key: 'image_url', label: 'URL Imagine' }
//       ].map(field => (
//         <View key={field.key} style={{marginBottom: 15}}>
//           <Text style={styles.label}>{field.label}</Text>
//           <TextInput 
//             style={styles.input} 
//             value={formData[field.key]} 
//             keyboardType={field.type || 'default'}
//             onChangeText={t => setFormData({...formData, [field.key]: t})} 
//           />
//         </View>
//       ))}

//       <Text style={styles.label}>Descriere Scurtă</Text>
//       <TextInput style={styles.input} multiline value={formData.short_description} onChangeText={t => setFormData({...formData, short_description: t})} />

//       <Text style={styles.label}>Descriere Lungă (Pagina de profil)</Text>
//       <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} multiline value={formData.long_description} onChangeText={t => setFormData({...formData, long_description: t})} />

//       <Text style={[styles.label, { marginTop: 15, marginBottom: 10 }]}>Animale Acceptate (Filtre)</Text>
//       <View style={styles.animalsContainer}>
//         {AVAILABLE_ANIMALS.map((animal) => {
//           const isSelected = selectedAnimals.includes(animal);
//           return (
//             <TouchableOpacity key={animal} style={[styles.animalChip, isSelected && styles.animalChipSelected]} onPress={() => toggleAnimal(animal)}>
//               <Text style={[styles.animalChipText, isSelected && styles.animalChipTextSelected]}>{animal}</Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       <TouchableOpacity style={styles.button} onPress={handleUpdate}>
//         <Text style={styles.buttonText}>Salvează Modificările</Text>
//       </TouchableOpacity>
//       <View style={{height: 50}} />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, backgroundColor: '#fff', flex: 1 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, color: '#1f2937' },
//   input: { borderWidth: 1, borderColor: '#d1d5db', padding: 14, borderRadius: 10, backgroundColor: '#f9fafb', fontSize: 16 },
//   label: { fontWeight: '600', marginBottom: 6, color: '#4b5563', marginLeft: 2 },
//   button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   animalsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
//   animalChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', marginRight: 8, marginBottom: 8 },
//   animalChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
//   animalChipText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
//   animalChipTextSelected: { color: '#ffffff' }
// });

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditHotelScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hotelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');

  useEffect(() => {
    fetchHotelData();
  }, []);

  const fetchHotelData = async () => {
    try {
      const response = await fetch(`http://172.20.10.2:3000/api/dashboard/hotel-details/${hotelId}`);
      if (!response.ok) {
        throw new Error('Eroare rețea');
      }
      const data = await response.json();
      
      if (data) {
        setName(data.name || '');
        setCity(data.city || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setWebsite(data.website || '');
        setAddress(data.address || '');
        setCapacity(data.capacity ? data.capacity.toString() : '');
        setImageUrl(data.image_url || '');
        setShortDesc(data.short_description || '');
        setLongDesc(data.long_description || '');
      } else {
        Alert.alert("Eroare", "Datele nu au fost găsite.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Nu am putut încărca datele. Verifică conexiunea la server.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`http://172.20.10.2:3000/api/dashboard/update-hotel/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, 
          city, 
          phone, 
          email, 
          website, 
          address, 
          capacity, 
          image_url: imageUrl, 
          short_description: shortDesc, 
          long_description: longDesc
        })
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert("Succes", "Datele au fost actualizate!");
        navigation.goBack();
      } else {
        Alert.alert("Eroare", result.message || "A apărut o problemă la salvare.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Eroare de conexiune la server.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editează Filtre și Detalii</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Text style={styles.label}>Nume Hotel</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Oraș</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} />

        <Text style={styles.label}>Telefon</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />

        <Text style={styles.label}>Adresă</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Capacitate (Locuri)</Text>
        <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} keyboardType="numeric" />

        <Text style={styles.label}>URL Imagine</Text>
        <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

        <Text style={styles.label}>Descriere Scurtă</Text>
        <TextInput style={[styles.input, styles.textAreaShort]} value={shortDesc} onChangeText={setShortDesc} multiline />

        <Text style={styles.label}>Descriere Lungă</Text>
        <TextInput style={[styles.input, styles.textAreaLong]} value={longDesc} onChangeText={setLongDesc} multiline />

        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
          <Text style={styles.saveBtnText}>Salvează Modificările</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e2e8f0' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  backBtn: { paddingRight: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  content: { paddingHorizontal: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#cbd5e1', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#94a3b8'
  },
  textAreaShort: { height: 80, textAlignVertical: 'top' },
  textAreaLong: { height: 120, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#2563EB', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 30
  },
  saveBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});