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
  Linking,
  Dimensions 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import MapView, { Marker } from 'react-native-maps';

const { width } = Dimensions.get("window"); 
const API_BASE = "http://172.20.10.2:3000/api";

const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotelId } = route.params;
  const [hotel, setHotel] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        // 1. Aducem detaliile hotelului
        const resHotel = await fetch(`${API_BASE}/hotels/${hotelId}`);
        if (!resHotel.ok) throw new Error("Hotel not found");
        const hotelData = await resHotel.json();
        setHotel(hotelData.hotel);

        // 2. Aducem imaginile
        const resImages = await fetch(`${API_BASE}/hotel_images/${hotelId}`);
        const imagesData = await resImages.json();
        setImages(
          imagesData.length > 0
            ? imagesData.map((img) => ({ uri: img.image_url }))
            : [{ uri: hotelData.hotel?.image_url || "https://placedog.net/400/300?random=1" }]
        );

        // 3. Aducem recenziile (CODUL NOU)
        try {
          const resReviews = await fetch(`${API_BASE}/reviews/hotel/${hotelId}`);
          const reviewsData = await resReviews.json();
          if (reviewsData.success) {
            setReviews(reviewsData.reviews);
          }
        } catch (err) {
          console.warn("Nu am putut încărca recenziile", err);
        }

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
        <Text style={{ marginTop: 16 }}>Se încarcă detaliile...</Text>
      </View>
    );

  if (!hotel)
    return (
      <View style={styles.loadingContainer}>
        <Text>Hotelul nu a fost găsit.</Text>
      </View>
    );

  
  const hotelLocation = {
    latitude: hotel.latitude || 45.7489, 
    longitude: hotel.longitude || 21.2087,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={{ flex: 1 }}> 
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <StatusBar barStyle="dark-content" />

        {/* Carousel imagini */}
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={{ width: width, height: 250 }} resizeMode="cover" />
          )}
        />

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.ratingBadge}>
               <Text style={styles.ratingText}>⭐ {hotel.rating || "4.5"}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#666" />
            <Text style={styles.location}>{hotel.city}, {hotel.address}</Text>
          </View>

          <Text style={styles.sectionTitle}>Despre Locație</Text>
          <Text style={styles.description}>{hotel.short_description || "Descriere indisponibilă."}</Text>

          {/* HARTĂ */}
          <Text style={styles.sectionTitle}>Locație pe Hartă 🗺️</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={hotelLocation}
              scrollEnabled={false} 
            >
              <Marker
                coordinate={hotelLocation}
                title={hotel.name}
                description={hotel.address}
              />
            </MapView>
          </View>
          {/* SECȚIUNE NOUĂ: Recenzii */}
          <Text style={styles.sectionTitle}>Părerea Clienților ({reviews.length})</Text>
          
          {reviews.length === 0 ? (
            <Text style={styles.description}>Acest hotel nu are recenzii încă.</Text>
          ) : (
            <FlatList
              data={reviews}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewName}>👤 {item.user_name}</Text>
                  <Text style={styles.reviewStars}>
                    {"⭐".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                  </Text>
                  <Text style={styles.reviewComment}>"{item.comment}"</Text>
                </View>
              )}
            />
          )}

          {/* Contact */}
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactContainer}>
            {hotel.phone && (
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`tel:${hotel.phone}`)}>
                <Ionicons name="call" size={20} color="#2563eb" />
                <Text style={styles.contactText}>{hotel.phone}</Text>
              </TouchableOpacity>
            )}
            
            {hotel.email && (
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(`mailto:${hotel.email}`)}>
                <Ionicons name="mail" size={20} color="#2563eb" />
                <Text style={styles.contactText}>{hotel.email}</Text>
              </TouchableOpacity>
            )}

            {hotel.website && (
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL(hotel.website)}>
                <Ionicons name="globe" size={20} color="#2563eb" />
                <Text style={styles.contactText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/*  Buton Fix Jos pentru Rezervare */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Preț estimativ</Text>
          <Text style={styles.priceValue}>{hotel.price_from || hotel.price || 100} RON <Text style={{fontSize: 14, fontWeight: 'normal'}}>/zi</Text></Text>
        </View>
        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Reservation', { hotelId: hotel.id })}
        >
          <Text style={styles.bookBtnText}>Rezervă Acum</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  hotelName: { fontSize: 26, fontWeight: "bold", color: '#1f2937', flex: 1 },
  ratingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontWeight: 'bold', color: '#d97706' },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  location: { fontSize: 16, color: "#666", marginLeft: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: '#111827' },
  description: { fontSize: 15, lineHeight: 24, color: '#4b5563' },

  // Stiluri Recenzii
  reviewCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    width: 250, // Lățime fixă ca să arate ca niște carduri
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
    marginBottom: 10,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 5,
  },
  reviewStars: {
    fontSize: 14,
    color: '#fbbf24',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },

  // Stiluri Hartă
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Stiluri Contact
  contactContainer: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  contactText: { marginLeft: 10, fontSize: 16, color: '#374151' },

  // Bara de jos fixă
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    elevation: 20, // umbră android
    shadowColor: "#000", // umbră ios
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  priceLabel: { color: '#6b7280', fontSize: 12 },
  priceValue: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' },
  bookBtn: { backgroundColor: '#2563eb', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default HotelDetailsScreen;