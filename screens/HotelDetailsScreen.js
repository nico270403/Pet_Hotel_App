import React, { useState, useEffect, useLayoutEffect, useContext } from "react";
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
  Dimensions,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from 'react-native-maps';
import API_BASE_URL from '../api'

import { AuthContext } from '../context/AuthContext'; 

const { width } = Dimensions.get("window"); 
const API_BASE = `${API_BASE_URL}/api`;

const HotelDetailsScreen = ({ route, navigation }) => {
  const { hotelId } = route.params;
  const [hotel, setHotel] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const { logout } = useContext(AuthContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Detalii Hotel",
      headerTitleAlign: 'left', 
      headerTitleContainerStyle: {
        marginLeft: -15, 
      },
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => {
            Alert.alert("Deconectare", "Ești sigur că vrei să ieși?", [
              { text: "Anulează", style: "cancel" },
              { text: "Da", onPress: logout, style: "destructive" }
            ]);
          }}
          style={styles.logoutButton} 
        >
          <Text style={styles.headerLogoutText}>Deconectare</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const resHotel = await fetch(`${API_BASE}/hotels/${hotelId}`);
        if (!resHotel.ok) throw new Error("Hotel not found");
        const hotelData = await resHotel.json();
        setHotel(hotelData.hotel);

        const resImages = await fetch(`${API_BASE}/hotel_images/${hotelId}`);
        const imagesData = await resImages.json();
        setImages(
          imagesData.length > 0
            ? imagesData.map((img) => ({ uri: img.image_url }))
            : [{ uri: hotelData.hotel?.image_url || "https://placedog.net/400/300?random=1" }]
        );

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

  const hasCoordinates = hotel.latitude && hotel.longitude;
  const hotelLocation = hasCoordinates ? {
    latitude: parseFloat(hotel.latitude),
    longitude: parseFloat(hotel.longitude),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}> 
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.imageWrapper}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item.uri }} style={{ width: width, height: 280 }} resizeMode="contain" />
            )}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.ratingBadge}>
               <Text style={styles.ratingText}>⭐ {hotel.rating || "Nou"}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color="#666" />
            <Text style={styles.location}>{hotel.city}, {hotel.address}</Text>
          </View>

          <Text style={styles.sectionTitle}>Despre Locație</Text>
          <Text style={styles.description}>{hotel.long_description || hotel.short_description || "Descriere indisponibilă."}</Text>
          
          <Text style={styles.sectionTitle}>Animale Acceptate 🐾</Text>
          <View style={styles.animalsContainer}>
            {hotel.animals && hotel.animals.length > 0 ? (
              hotel.animals.map((animal, index) => (
                <View key={index} style={styles.animalChip}>
                  <Text style={styles.animalChipText}>{animal}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.description}>Nu au fost specificate animale.</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Locație pe Hartă 🗺️</Text>
          {hasCoordinates ? (
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
          ) : (
            <View style={styles.noMapContainer}>
              <Ionicons name="map-outline" size={40} color="#9ca3af" />
              <Text style={styles.noMapText}>Locația exactă pe hartă nu este disponibilă pentru acest hotel.</Text>
            </View>
          )}

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
            
            {!hotel.phone && !hotel.email && !hotel.website && (
              <Text style={styles.description}>Nicio informație de contact disponibilă.</Text>
            )}
          </View>
        </View>
      </ScrollView>

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
  
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginRight: 0, 
  },
  headerLogoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },

  imageWrapper: { backgroundColor: '#f9fafb', width: '100%', alignItems: 'center' },
  content: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  hotelName: { fontSize: 26, fontWeight: "bold", color: '#1f2937', flex: 1 },
  ratingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontWeight: 'bold', color: '#d97706' },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  location: { fontSize: 16, color: "#666", marginLeft: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: '#111827' },
  description: { fontSize: 15, lineHeight: 24, color: '#4b5563' },

  animalsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  animalChip: { 
    backgroundColor: '#dbeafe', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 16, 
    marginRight: 8, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  animalChipText: { color: '#1d4ed8', fontWeight: '600', fontSize: 14 },

  reviewCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    width: 250, 
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
    marginBottom: 10,
  },
  reviewName: { fontWeight: 'bold', fontSize: 16, color: '#1f2937', marginBottom: 5 },
  reviewStars: { fontSize: 14, color: '#fbbf24', marginBottom: 8 },
  reviewComment: { fontSize: 14, color: '#4b5563', fontStyle: 'italic' },

  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  map: { width: '100%', height: '100%' },
  
  noMapContainer: {
    height: 150,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20
  },
  noMapText: { color: '#6b7280', marginTop: 10, textAlign: 'center', fontSize: 14 },

  contactContainer: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  contactText: { marginLeft: 10, fontSize: 16, color: '#374151' },

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
    elevation: 20, 
    shadowColor: "#000", 
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