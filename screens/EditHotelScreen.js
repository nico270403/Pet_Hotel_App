import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '../api';

const AVAILABLE_ANIMALS = [
  'Câine', 'Pisică', 'Rozătoare', 'Papagal', 'Reptilă', 
  'Iepure', 'Pește', 'Porcusor de guineea', 'Arici', 
  'Veveriță', 'Hamster', 'Broască țestoasă', 'Reptile mici'
];

export default function EditHotelScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { hotelId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState(''); 
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');

  
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    fetchHotelData();
  }, []);

  const fetchHotelData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/hotel-details/${hotelId}`);
      if (!response.ok) throw new Error('Eroare rețea');
      const data = await response.json();
      
      if (data) {
        setName(data.name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setWebsite(data.website || '');
        
        setCounty(data.county || '');
        setCity(data.city || '');
        setAddress(data.address || '');
        
        setCapacity(data.capacity ? data.capacity.toString() : '');
        setPrice(data.price_per_day ? data.price_per_day.toString() : ''); 
        setShortDesc(data.short_description || '');
        setLongDesc(data.long_description || '');
        
        setSelectedAnimals(data.animals || []);
        
        if (data.image_url) {
          const imageUrl = data.image_url.startsWith('http') 
            ? data.image_url 
            : `${API_BASE_URL}/${data.image_url.startsWith('uploads/') ? data.image_url : 'uploads/'+data.image_url}`;
          setMainImage(imageUrl);
        }
      } else {
        Alert.alert("Eroare", "Datele nu au fost găsite.");
      }
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut încărca datele. Verifică conexiunea.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimal = (animal) => {
    if (selectedAnimals.includes(animal)) {
      setSelectedAnimals(selectedAnimals.filter(a => a !== animal));
    } else {
      setSelectedAnimals([...selectedAnimals, animal]);
    }
  };

  const pickMainImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setMainImage(result.assets[0].uri);
    }
  };

  const pickGalleryImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setGallery([...gallery, ...newImages]);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setGallery(gallery.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async () => {
    if (!name || !capacity || !price || !city || !county || selectedAnimals.length === 0) {
      Alert.alert("Eroare", "Te rog completează datele obligatorii (Nume, Capacitate, Preț, Județ, Oraș, Animale)!");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('website', website);
      formData.append('county', county);
      formData.append('city', city);
      formData.append('address', address);
      formData.append('capacity', capacity);
      formData.append('price', price); 
      formData.append('short_description', shortDesc);
      formData.append('long_description', longDesc);
      formData.append('animals', JSON.stringify(selectedAnimals));

      if (mainImage && !mainImage.startsWith('http')) {
        const filename = mainImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('mainImage', { uri: mainImage, name: filename, type });
      }

      gallery.forEach((imgUri) => {
        if (!imgUri.startsWith('http')) {
          const filename = imgUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('gallery', { uri: imgUri, name: filename, type });
        }
      });

      const response = await fetch(`${API_BASE_URL}/api/dashboard/update-hotel/${hotelId}`, {
        method: 'PUT',
        body: formData 
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert("Succes", "Datele au fost actualizate cu succes!");
        navigation.goBack();
      } else {
        Alert.alert("Eroare", result.message || "A apărut o problemă la salvare.");
      }
    } catch (error) {
      Alert.alert("Eroare", "Eroare de conexiune la server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.mainTitle}>Editează Locația</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#1f2937" style={{marginRight: 4}}/>
          <Text style={styles.backText}>Înapoi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* INFORMAȚII GENERALE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Informații Generale</Text>
          
          <Text style={styles.label}>Numele unității de cazare *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Telefon de contact</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Adresa de email a managerului</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Website (Opțional)</Text>
          <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />
        </View>

        {/* LOCAȚIE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Locație</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>Județ *</Text>
              <TextInput style={styles.input} value={county} onChangeText={setCounty} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Localitate *</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>
          </View>
          
          <Text style={styles.label}>Adresă </Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Ex: Str. Florilor Nr. 10" />
        </View>

        {/* FOTOGRAFII */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Fotografii</Text>
          <Text style={styles.label}>Imagine Principală (Profil)</Text>
          <TouchableOpacity style={styles.imageUploader} onPress={pickMainImage}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.previewMainImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={30} color="#6b7280" />
                <Text style={styles.imageUploaderText}>Apasă pentru a schimba poza</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Galerie (Mai multe poze)</Text>
          <TouchableOpacity style={styles.galleryUploaderBtn} onPress={pickGalleryImages}>
            <Ionicons name="images-outline" size={20} color="#2563eb" />
            <Text style={styles.galleryUploaderText}>Adaugă poze în galerie</Text>
          </TouchableOpacity>

          {gallery.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {gallery.map((img, index) => (
                <View key={index} style={styles.galleryImageContainer}>
                  <Image source={{ uri: img }} style={styles.galleryImage} />
                  <TouchableOpacity style={styles.deleteImageBtn} onPress={() => removeGalleryImage(index)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* DETALII CAZARE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Detalii Cazare</Text>
          
          {/* <-- Rând nou cu Capacitate și Preț --> */}
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>Capacitate totală (Locuri) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Preț per zi (RON) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 10 }]}>Animale Acceptate: *</Text>
          <View style={styles.animalsContainer}>
            {AVAILABLE_ANIMALS.map((animal) => {
              const isSelected = selectedAnimals.includes(animal);
              return (
                <TouchableOpacity key={animal} style={[styles.animalChip, isSelected && styles.animalChipSelected]} onPress={() => toggleAnimal(animal)}>
                  <Text style={[styles.animalChipText, isSelected && styles.animalChipTextSelected]}>{animal} {isSelected ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 15 }]}>Scurtă descriere (Pentru listă)</Text>
          <TextInput style={[styles.input, styles.textAreaShort]} value={shortDesc} onChangeText={setShortDesc} multiline placeholder="Apare în ecranul principal..." />

          <Text style={styles.label}>Descriere Lungă (Pagina hotelului)</Text>
          <TextInput style={[styles.input, styles.textAreaLong]} value={longDesc} onChangeText={setLongDesc} multiline placeholder="Toate detaliile importante..." />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvează Modificările</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  backText: { color: '#1f2937', fontWeight: 'bold', fontSize: 13 },
  container: { flex: 1, padding: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 15, backgroundColor: '#f9fafb', color: '#1f2937' },
  textAreaShort: { height: 80, textAlignVertical: 'top' },
  textAreaLong: { height: 120, textAlignVertical: 'top' },
  
  imageUploader: { height: 150, borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', marginBottom: 20, overflow: 'hidden' },
  imageUploaderText: { color: '#6b7280', marginTop: 10, fontSize: 14 },
  previewMainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  galleryUploaderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 10 },
  galleryUploaderText: { marginLeft: 8, color: '#2563eb', fontWeight: 'bold' },
  galleryScroll: { flexDirection: 'row', marginBottom: 10 },
  galleryImageContainer: { marginRight: 10, position: 'relative' },
  galleryImage: { width: 80, height: 80, borderRadius: 10 },
  deleteImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fff', borderRadius: 12 },
  
  animalsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  animalChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', marginRight: 8, marginBottom: 8 },
  animalChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  animalChipText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
  animalChipTextSelected: { color: '#ffffff' },
  
  button: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 10, elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});