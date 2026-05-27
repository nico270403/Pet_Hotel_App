import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert
} from "react-native";
import * as ImagePicker from 'expo-image-picker';

export default function PetProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [image, setImage] = useState(null); 

  const [pets, setPets] = useState([]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permisiune refuzată", "Avem nevoie de acces la galeria ta foto pentru a adăuga o poză animalului.");
      return;
    }

    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); 
    }
  };

  const handleSavePet = () => {
    if (!name || !species || !breed || !age) {
      Alert.alert("Incomplet", "Te rog completează toate câmpurile de bază (fără imagine).");
      return;
    }

    const newPet = { id: Date.now().toString(), name, species, breed, age, allergies, image };
    setPets(prev => [...prev, newPet]);

    setName(""); setSpecies(""); setBreed(""); setAge(""); setAllergies(""); setImage(null);
  };

  const handleDeletePet = (id) => {
    Alert.alert("Confirmare", "Sigur vrei să ștergi acest animal?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: () => setPets(prev => prev.filter(p => p.id !== id)) }
    ]);
  };

  const handleEditPet = (pet) => {
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setAge(pet.age);
    setAllergies(pet.allergies);
    setImage(pet.image);
    setPets(prev => prev.filter(p => p.id !== pet.id));
  };

  const askAIAboutPet = (pet) => {
    const promptText = `Datele animalului meu: Este un ${pet.species} (rasa ${pet.breed}), are ${pet.age}. ${pet.allergies ? `Are următoarele alergii/cerințe speciale: ${pet.allergies}.` : 'Nu are cerințe speciale.'} Numele lui este ${pet.name}.`;
    navigation.navigate('Chat', { initialPrompt: promptText, petName: pet.name });
  };

  return (
    <FlatList
      data={pets}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Profil Animal 🐾</Text>

          <View style={styles.inputCard}>
            <Text style={styles.label}>Nume</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ex: Max" />

            <Text style={styles.label}>Specie</Text>
            <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="ex: Câine / Pisică" />

            <Text style={styles.label}>Rasă</Text>
            <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="ex: Labrador" />

            <Text style={styles.label}>Vârstă</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="ex: 2 ani" />

            <Text style={styles.label}>Cerințe speciale / Alergii</Text>
            <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="ex: Fără" />

            {/* Zona pentru poză */}
            <Text style={styles.label}>Poză Profil (opțional)</Text>
            <View style={styles.imagePickerContainer}>
              {image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                    <Text style={styles.changeImageText}>Schimbă poza</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.btnPickImage} onPress={pickImage}>
                  <Text style={styles.btnPickImageText}>📸 Alege o poză din galerie</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity style={styles.btnSave} onPress={handleSavePet}>
              <Text style={styles.btnText}>Salvează Profil</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listTitle}>Animalele mele</Text>
          {pets.length === 0 && <Text style={{ color: "#6b7280", marginBottom: 12 }}>Nu ai adăugat niciun animal încă.</Text>}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.petCard}>
          {item.image ? <Image source={{ uri: item.image }} style={styles.petAvatar} /> : 
            <View style={[styles.petAvatar, {backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center'}]}>
              <Text style={{fontSize: 24}}>🐾</Text>
            </View>
          }
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petDetails}>{item.species} | {item.breed} | {item.age}</Text>
            {item.allergies ? <Text style={styles.petDetails}>Alergii: {item.allergies}</Text> : null}
            
            <TouchableOpacity style={styles.btnAskAISmall} onPress={() => askAIAboutPet(item)}>
              <Text style={styles.btnAskAIText}>✨ Găsește hotel pentru {item.name}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.petActions}>
            <TouchableOpacity onPress={() => handleEditPet(item)} style={{padding: 5}}>
              <Text style={styles.editBtn}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePet(item.id)} style={{padding: 5, marginTop: 10}}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={{ padding: 20, backgroundColor: "#f9fafb", paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: '#1f2937' },
  inputCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontWeight: "600", color: "#374151", marginTop: 10, fontSize: 14 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginTop: 6, fontSize: 15 },
  btnSave: { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  listTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, color: '#1f2937' },
  petCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 15, marginBottom: 12, alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  petAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  petInfo: { flex: 1 },
  petName: { fontSize: 18, fontWeight: "700", color: '#111827' },
  petDetails: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  petActions: { flexDirection: "column", marginLeft: 10 },
  editBtn: { fontSize: 18 },
  deleteBtn: { fontSize: 18 },
  btnAskAISmall: { backgroundColor: '#ecfdf5', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#10b981' },
  btnAskAIText: { color: '#059669', fontWeight: '600', fontSize: 13 },
  
  imagePickerContainer: { marginTop: 10 },
  btnPickImage: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  btnPickImageText: { color: '#4b5563', fontWeight: '600' },
  previewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  previewImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  changeImageBtn: { backgroundColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  changeImageText: { color: '#374151', fontSize: 13, fontWeight: '500' }
});