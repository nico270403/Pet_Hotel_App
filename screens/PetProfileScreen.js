// screens/PetProfileScreen.js
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

export default function PetProfileScreen({ navigation }) {
  // State pentru câmpurile formularului
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [allergies, setAllergies] = useState("");
  const [image, setImage] = useState("");

  // Lista animalelor adăugate
  const [pets, setPets] = useState([]);

  // Adaugă sau actualizează un animal
  const handleSavePet = () => {
    if (!name || !species || !breed || !age || !image) {
      Alert.alert("Incomplete", "Please fill all fields including image URL.");
      return;
    }

    const newPet = { id: Date.now().toString(), name, species, breed, age, allergies, image };
    setPets(prev => [...prev, newPet]);

    // Reset câmpuri
    setName("");
    setSpecies("");
    setBreed("");
    setAge("");
    setAllergies("");
    setImage("");
  };

  // Șterge un animal
  const handleDeletePet = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this pet?", [
      { text: "Cancel" },
      { text: "Delete", onPress: () => setPets(prev => prev.filter(p => p.id !== id)) }
    ]);
  };

  // Editează un animal: populatează câmpurile formularului și șterge din listă
  const handleEditPet = (pet) => {
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setAge(pet.age);
    setAllergies(pet.allergies);
    setImage(pet.image);
    setPets(prev => prev.filter(p => p.id !== pet.id));
  };

  return (
    <FlatList
      data={pets}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Pet Profile</Text>

          {/* Formular adăugare animal */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ex: Soy" />

            <Text style={styles.label}>Species</Text>
            <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="ex: Caine / Pisica / etc." />

            <Text style={styles.label}>Breed</Text>
            <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="ex: Labrador" />

            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="ex: 2 ani" />

            <Text style={styles.label}>Allergies</Text>
            <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="Nu/Specifica" />

            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="Enter image URL" />
          </View>

          {/* Butoane */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.btnSave} onPress={handleSavePet}>
              <Text style={styles.btnText}>Save Pet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAskAI} onPress={() => Alert.alert("Ask AI", "This can open AI chat")}>
              <Text style={styles.btnText}>Ask AI</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listTitle}>My Pets</Text>
          {pets.length === 0 && <Text style={{ color: "#6b7280", marginBottom: 12 }}>No pets added yet.</Text>}
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.petCard}>
          {item.image ? <Image source={{ uri: item.image }} style={styles.petAvatar} /> : null}
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petDetails}>{item.species} | {item.breed} | {item.age}</Text>
            {item.allergies ? <Text style={styles.petDetails}>Allergies: {item.allergies}</Text> : null}
          </View>
          <View style={styles.petActions}>
            <TouchableOpacity onPress={() => handleEditPet(item)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePet(item.id)}>
              <Text style={styles.deleteBtn}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={{ padding: 20, backgroundColor: "#f9fafb", paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  inputCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  label: { fontWeight: "600", color: "#374151", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, marginTop: 6 },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  btnSave: { backgroundColor: "#2563eb", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnAskAI: { backgroundColor: "#10b981", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700" },
  listTitle: { fontSize: 20, fontWeight: "600", marginBottom: 10 },
  petCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center", elevation: 1 },
  petAvatar: { width: 70, height: 70, borderRadius: 35, marginRight: 12 },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: "700" },
  petDetails: { fontSize: 14, color: "#6b7280" },
  petActions: { flexDirection: "column" },
  editBtn: { color: "#2563eb", marginBottom: 4 },
  deleteBtn: { color: "#ef4444" }
});
