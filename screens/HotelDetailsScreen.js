import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = 400; // sau Dimensions.get('window').width
const API_BASE = "http://172.20.10.2:3000/api";

const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotelId } = route.params;
  const [hotel, setHotel] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const resHotel = await fetch(`${API_BASE}/hotels/${hotelId}`);
        if (!resHotel.ok) throw new Error("Hotel not found");
        const hotelData = await resHotel.json();
        setHotel(hotelData);

        const resImages = await fetch(`${API_BASE}/hotel_images/${hotelId}`);
        const imagesData = await resImages.json();
        setImages(
          imagesData.length > 0
            ? imagesData.map((img) => ({ uri: img.image_url }))
            : [{ uri: hotelData.image_url || "https://placedog.net/400/300?random=1" }]
        );
      } catch (err) {
        console.error("Error fetching hotel details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId]);

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16 }}>Loading hotel details...</Text>
      </View>
    );

  if (!hotel)
    return (
      <View style={styles.loadingContainer}>
        <Text>Hotel not found.</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Carousel imagini */}
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={{ width: SCREEN_WIDTH, height: 250 }} />
        )}
      />

      <View style={styles.content}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        <Text style={styles.location}>{hotel.city}, {hotel.address}</Text>
        <Text style={styles.rating}>⭐ {hotel.rating}</Text>
        <Text style={styles.description}>{hotel.short_description}</Text>
      </View>

      {/* Contact */}
      <View style={styles.contact}>
        <TouchableOpacity onPress={() => hotel.phone && Linking.openURL(`tel:${hotel.phone}`)}>
          <Text>Call: {hotel.phone || "N/A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => hotel.email && Linking.openURL(`mailto:${hotel.email}`)}>
          <Text>Email: {hotel.email || "N/A"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => hotel.website && Linking.openURL(hotel.website)}>
          <Text>Website: {hotel.website || "N/A"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  hotelName: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  location: { fontSize: 16, color: "#666", marginBottom: 4 },
  rating: { fontSize: 16, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20 },
  contact: { padding: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" },
});

export default HotelDetailsScreen;


