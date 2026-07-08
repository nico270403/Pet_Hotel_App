import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '../api'

const AVAILABLE_ANIMALS = [
  'Câine', 'Pisică', 'Rozătoare', 'Papagal', 'Reptilă', 
  'Iepure', 'Pește', 'Porcusor de guineea', 'Arici', 
  'Veveriță', 'Hamster', 'Broască țestoasă', 'Reptile mici',
  'Chinchilla', 'Dihor domestic', 'Gerbil'
];

export default function AddHotelScreen({ navigation }) {
  const { user, setUser, logout } = useContext(AuthContext); 
  
  const [showGuestForm, setShowGuestForm] = useState(false);

  const [managerName, setManagerName] = useState(user?.name !== 'Oaspete' ? user?.name : '');
  const [managerEmail, setManagerEmail] = useState(user?.email || '');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [selectedAnimals, setSelectedAnimals] = useState([]); 
  
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    if (user?.isGuest && !showGuestForm) {
      navigation.setOptions({ headerShown: false });
    } else {
      navigation.setOptions({ headerShown: true, title: 'Adaugă Locație Nouă' });
    }
  }, [navigation, user, showGuestForm]);

  const pickMainImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setMainImage(result.assets[0].uri);
  };

  const pickGalleryImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setGallery([...gallery, ...newImages]);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setGallery(gallery.filter((_, index) => index !== indexToRemove));
  };

  const toggleAnimal = (animal) => {
    if (selectedAnimals.includes(animal)) setSelectedAnimals(selectedAnimals.filter(a => a !== animal));
    else setSelectedAnimals([...selectedAnimals, animal]);
  };

  if (user?.isGuest && !showGuestForm) {
    return (
      <View style={styles.promoContainer}>
        <Text style={{ fontSize: 80, marginBottom: 10 }}></Text>
        <Text style={styles.promoTitle}>  PET HOTEL - partenerul tău pentru gestionarea activității unităților pe care le administrezi  </Text>
        <Text style={styles.promoTitle}>Dezvoltă-ți afacerea cu noi!</Text>
        <View style={styles.promoList}>
          <Text style={styles.promoItem}> Atrage clienți noi lunar!</Text>
          <Text style={styles.promoItem}> Gestionează rezervările direct din telefon!</Text>
          <Text style={styles.promoItem}> Acces asupra vizualizării detaliilor importante: </Text>
          <Text> - sume încasate în orice interval de timp </Text>
          <Text> - vizualizarea gradului de ocupare în orice zi dorită </Text>
          <Text> - tipurile de animale care frecventează unitatea </Text>

        </View>
        <Text style={styles.promoSubtitle}>Înscrie-ți unitatea de cazare gratuit și începe să primești rezervări imediat.</Text>
        
        <TouchableOpacity style={styles.promoBtn} onPress={() => setShowGuestForm(true)}>
          <Text style={styles.promoBtnText}>Creează cont manager acum</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{ marginTop: 25 }} onPress={logout}>
          <Text style={{ color: '#6b7280', fontSize: 15, fontWeight: '600' }}>← Înapoi la Autentificare</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCreateHotel = async () => {
    if (!name || !capacity || !managerName || !city || !county || !phone || !price || selectedAnimals.length === 0) {
      Alert.alert("Eroare", "Te rog completează toate datele obligatorii (marcate cu *) și alege cel puțin un animal!");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert("Telefon Invalid", "Numărul de telefon trebuie să conțină exact 10 cifre.");
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

        const regResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: managerName, email, password, role: 'manager' })
        });
        const regData = await regResponse.json();

        if (!regResponse.ok || !regData.success) {
          Alert.alert("Eroare Cont", regData.message || "Eroare la înregistrare.");
          setLoading(false); return;
        }
        finalUserId = regData.user.id;
      }

      const formData = new FormData();
      formData.append('userId', finalUserId);
      formData.append('manager_name', managerName);
      formData.append('email', managerEmail);
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('website', website);
      formData.append('county', county);
      formData.append('city', city);
      formData.append('address', address);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('capacity', capacity);
      formData.append('price', price);
      formData.append('short_description', shortDesc);
      formData.append('long_description', longDesc);
      formData.append('animals', JSON.stringify(selectedAnimals));

      if (mainImage) {
        const filename = mainImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('mainImage', { uri: mainImage, name: filename, type });
      }

      gallery.forEach((imgUri) => {
        const filename = imgUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('gallery', { uri: imgUri, name: filename, type });
      });

      const response = await fetch(`${API_BASE_URL}/api/dashboard/create-hotel`, {
        method: 'POST', body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const newHotelId = result.hotelId || result.id;
        const currentHotelIds = user?.hotels || [];
        
        Alert.alert(
          "Felicitări! ", 
          "Unitatea a fost configurată cu succes! Vei fi direcționat către panoul de control al unității adăugate.", 
          [{ 
            text: "OK", 
            onPress: () => {
              setUser({ 
                id: finalUserId, 
                name: managerName, 
                email: user?.isGuest ? email : user.email, 
                role: 'manager', 
                hotels: [...currentHotelIds, {id: newHotelId, name: name}]
              });
              setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'HotelDashboard' }] });
              }, 100);
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (user?.isGuest && showGuestForm){
            setShowGuestForm(false);
          }
          }}
        >
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.mainTitle}>{user?.isGuest ? " &  Creare Cont " : null}</Text>
        </View>
        <View style={{ width: 28 }} />
        {/* <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={15} color="#ef4444" style={{marginRight: 4}}/>
          <Text style={styles.logoutText}> Înapoi</Text>
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {user?.isGuest && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>0. Date pentru conectare (Login)</Text>
            <Text style={styles.label}>Email conectare *</Text>
            <TextInput style={styles.input} placeholder="hotel@exemplu.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Parolă (Minim 12 caractere) *</Text>
            <TextInput style={styles.input} placeholder="********" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Informații Administrator</Text>
          <Text style={styles.label}>Numele managerului *</Text>
          <TextInput style={styles.input} placeholder="Ex: Maria Popa" value={managerName} onChangeText={setManagerName} />

          <Text style={styles.label}>Adresa de email a managerului *</Text>
          <TextInput style={styles.input} placeholder="Ex: contact@hotel.ro" value={managerEmail} onChangeText={setManagerEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Informații Unitate de Cazare</Text>
          <Text style={styles.label}>Numele unității *</Text>
          <TextInput style={styles.input} placeholder="Ex: All Pets Resort" value={name} onChangeText={setName} />

          <Text style={styles.label}>Telefon de contact * (10 cifre)</Text>
          <TextInput style={styles.input} placeholder="Ex: 0740123456" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />

          <Text style={styles.label}>Website (Opțional)</Text>
          <TextInput style={styles.input} placeholder="Ex: www.hotelulmeu.ro" value={website} onChangeText={setWebsite} autoCapitalize="none" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Locație</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>Județ *</Text>
              <TextInput style={styles.input} placeholder="Ex: Timiș" value={county} onChangeText={setCounty} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Localitate *</Text>
              <TextInput style={styles.input} placeholder="Ex: Timișoara" value={city} onChangeText={setCity} />
            </View>
          </View>

          <Text style={styles.label}>Adresă completă *</Text>
          <TextInput style={styles.input} placeholder="Ex: Str. Florilor, Nr. 10" value={address} onChangeText={setAddress} />

          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>Latitudine (Opțional)</Text>
              <TextInput style={styles.input} placeholder="Ex: 45.7489" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Longitudine (Opțional)</Text>
              <TextInput style={styles.input} placeholder="Ex: 21.2087" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
            </View>
          </View>
          <Text style={styles.helperText}>Coordonatele ajută clienții să găsească unitatea de cazare pe harta integrată.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Fotografii</Text>
          <Text style={styles.label}>Imagine Principală (Profil) *</Text>
          <TouchableOpacity style={styles.imageUploader} onPress={pickMainImage}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.previewMainImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={30} color="#6b7280" />
                <Text style={styles.imageUploaderText}>Apasă pentru a adăuga poza principală</Text>
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Detalii și Tarife</Text>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flex: 1, marginRight: 10}}>
              <Text style={styles.label}>Capacitate (Locuri) *</Text>
              <TextInput style={styles.input} placeholder="Ex: 20" keyboardType="numeric" value={capacity} onChangeText={setCapacity} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.label}>Preț per zi (RON) *</Text>
              <TextInput style={styles.input} placeholder="Ex: 80" keyboardType="numeric" value={price} onChangeText={setPrice} />
            </View>
          </View>

          <Text style={styles.label}>Scurtă descriere (Pentru lista unităților de cazare) *</Text>
          <TextInput style={[styles.input, styles.textAreaShort]} placeholder="Ex: Oaza de liniște pentru prietenul tău blănos..." multiline value={shortDesc} onChangeText={setShortDesc} />

          <Text style={styles.label}>Descriere detaliată (Pagina de detalii a unității) *</Text>
          <TextInput style={[styles.input, styles.textAreaLong]} placeholder="Ex: Oferim spații de joacă generoase, hrană premium și personal dedicat 24/7..." multiline value={longDesc} onChangeText={setLongDesc} />

          <Text style={[styles.label, { marginTop: 1 }]}>Bifează ce animale acceptă unitatea pe care o administrezi: *</Text>
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
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreateHotel} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{user?.isGuest ? "Salvează și Crează Contul" : "Adaugă Unitate"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 3, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  mainTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  container: { flex: 1, padding: 5 },
  card: { backgroundColor: '#fff', padding: 5, borderRadius: 16, marginBottom: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 6, marginLeft: 2 },
  helperText: { fontSize: 12, color: '#9ca3af', marginTop: -10, marginBottom: 15, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 10, fontSize: 15, marginBottom: 15, backgroundColor: '#f9fafb', color: '#1f2937' },
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
  animalChip: { paddingVertical: 8, paddingHorizontal: 7, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', marginRight: 8, marginBottom: 8 },
  animalChipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  animalChipText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
  animalChipTextSelected: { color: '#ffffff' },
  button: { backgroundColor: '#10b981', padding: 10, borderRadius: 12, alignItems: 'center', marginVertical: -5, elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  promoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 7, backgroundColor: '#f9fafb' },
  promoTitle: { fontSize: 26, fontWeight: 'bold', color: '#3e679f', textAlign: 'center', marginBottom: 9 },
  promoList: { alignSelf: 'flex-start', marginVertical: 20 },
  promoItem: { fontSize: 16, color: '#374151', marginBottom: 10, fontWeight: '600' },
  promoSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  promoBtn: { backgroundColor: '#10b981', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 2 },
  promoBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});