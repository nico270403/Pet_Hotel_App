import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { getHotels } from '../dbHelpers';
import MapView, { Marker, Callout } from 'react-native-maps';
import PetBackground from './PetBackground';

const API_URLS = [
  'http://172.20.10.2:3000', // IP-ul meu de rețea
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const api = {
  async checkHealth() {
    console.log('🔍 Testing backend connection...');
    
    for (const baseUrl of API_URLS) {
      try {
        console.log(`Trying: ${baseUrl}/api/health`);
        
        const response = await fetch(`${baseUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ BACKEND FOUND: ${baseUrl}`);
          return { ...data, baseUrl };
        }
      } catch (error) {
        console.log(`❌ Failed: ${baseUrl} - ${error.message}`);
        continue;
      }
    }
    throw new Error('Backend not reachable');
  },

  async getHotels(baseUrl) {
   console.log(`📡 Fetching from: ${baseUrl}/api/hotels`);
    const response = await fetch(`${baseUrl}/api/hotels`);
    const data = await response.json();
    return data;
  }
};


const HomeScreen = ({ navigation }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingBackend, setUsingBackend] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    console.log("🧠 Trimit semnal de încălzire către AI...");
    fetch('http://172.20.10.2:3000/api/chat/warmup')
      .then(res => res.json())
      .then(data => console.log("✅ AI Status:", data.message))
      .catch(err => console.log("⚠️ Eroare warmup:", err.message));
  }, []);
  
  const loadInitialData = async () => {
    try {
      console.log('🚀 Starting data loading...');
      
      try {
        await api.checkHealth();
        console.log('✅ Backend is running, using API');
        setUsingBackend(true);
        await loadHotelsFromAPI();
      } catch (backendError) {
        console.log('🔄 Backend not available, using local database');
        setUsingBackend(false);
        await loadHotelsFromLocal();
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      Alert.alert('Error', 'Could not load hotels data');
    } finally {
      setLoading(false);
    }
  };

  const loadHotelsFromAPI = async () => {
  try {
    console.log('📡 Fetching hotels from API...');
    const health = await api.checkHealth();
    const data = await api.getHotels(health.baseUrl);
    console.log('✅ Hotels loaded from API:', data.hotels?.length || 0);
    setHotels(data.hotels || []);
  } catch (error) {
    console.error('❌ API fetch failed, falling back to local:', error);
    await loadHotelsFromLocal();
  }
};

  const loadHotelsFromLocal = async () => {
    try {
      console.log('💾 Loading hotels from local database...');
      const hotelsData = await getHotels();
      console.log('✅ Hotels loaded locally:', hotelsData.length);
      setHotels(hotelsData);
    } catch (error) {
      console.error('❌ Local database error:', error);
      Alert.alert('Database Error', 'Could not load hotels from local storage');
      setHotels([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (usingBackend) {
        await loadHotelsFromAPI();
      } else {
        await loadHotelsFromLocal();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryConnection = async () => {
    setLoading(true);
    await loadInitialData();
  };


  const renderHotelItem = ({ item }) => (
  <TouchableOpacity 
    style={styles.hotelCard}
    onPress={() => navigation.navigate('HotelDetails', { hotelId: item.id })}

  >
    <Image 
      source={{ 
        uri: (item.image_url && item.image_url.trim() !== '') 
          ? item.image_url 
          : 'https://placedog.net/400/300?random=' + item.id 
      }} 
      style={styles.hotelImage}
      resizeMode="contain"
    />
    <View style={styles.hotelInfo}>
      <Text style={styles.hotelName}>{item.name || 'Unknown Hotel'}</Text>
      <Text style={styles.hotelLocation}>{item.city || 'Location not specified'}</Text>
      <Text style={styles.hotelDescription} numberOfLines={2}>
        {item.short_description || 'No description available'}
      </Text>
      <View style={styles.hotelFooter}>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating || 'N/A'}</Text>
        </View>
      </View>
      
    </View>
  </TouchableOpacity>
);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Hotels Found</Text>
      <Text style={styles.emptyText}>
        {usingBackend 
          ? 'No hotels available in the database.' 
          : 'No hotels found in local storage.'
        }
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetryConnection}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>Loading hotels...</Text>
      <Text style={styles.loadingSubtext}>
        {usingBackend ? 'Connecting to server' : 'Loading local data'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }


  const mapButton = (
    <TouchableOpacity 
      style={styles.mapToggleButton} 
      onPress={() => setShowMap(!showMap)}
    >
      <Text style={styles.mapToggleText}>{showMap ? "📋 Listă" : "🗺️ Hartă"}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }


  const homeQuote = (
    <Text style={styles.quoteText}>
      Găsește cazarea perfectă pentru animalul tău.
    </Text>
  );


  return (
    <PetBackground  leftSlot={homeQuote} rightSlot={mapButton}>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {loading ? (
        renderLoadingState()
      ) : showMap ? (
        /* VIZUALIZARE HARTĂ */
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.fullMap}
            initialRegion={{
              latitude: 45.7489, 
              longitude: 21.2087,
              latitudeDelta: 4, 
              longitudeDelta: 4,
            }}
          >
            {hotels.map((hotel) => (
              <Marker
                key={hotel.id?.toString()}
                coordinate={{
                  latitude: hotel.latitude || 45.7489,
                  longitude: hotel.longitude || 21.2087,
                }}
              >
                <Callout onPress={() => navigation.navigate('HotelDetails', { hotelId: hotel.id })}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{hotel.name}</Text>
                    <Text style={styles.calloutPrice}>💰 {hotel.price_from || 100} RON/zi</Text>
                    <Text style={styles.calloutLink}>Vezi detalii →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      ) : hotels.length === 0 ? (
        renderEmptyState()
      ) : (
        /* VIZUALIZARE LISTĂ (codul existent) */
        <FlatList
          data={hotels}
          renderItem={renderHotelItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* BUTONUL DE REFRESH */}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <Text style={styles.refreshButtonText}>
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
    </PetBackground>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { opacity: 0.02, resizeMode: 'repeat' },
  overlay: { flex: 1 }, 
  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  quoteText: {
    fontSize: 20,
    color: '#075955',
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#2563eb', marginBottom: 4 }, // Albastru principal
  headerSubtitle: { fontSize: 15, color: '#475569', marginBottom: 8, fontWeight: '500' },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#1e293b', marginTop: 16, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCard: {
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  listContainer: { padding: 20, paddingBottom: 100 }, 
  hotelCard: {
    backgroundColor: '#ffffff', borderRadius: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 8,
    elevation: 8, overflow: 'hidden'
  },
  hotelImage: { width: '100%', height: 200, backgroundColor: '#f1f5f9' },
  hotelInfo: { padding: 20 },
  hotelName: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  hotelLocation: { fontSize: 15, color: '#64748b', marginBottom: 10, fontWeight: '600' },
  hotelDescription: { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 16 },
  hotelFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  rating: { fontSize: 14, fontWeight: 'bold', color: '#d97706' },
  retryButton: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  refreshButton: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#1e3a8a', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 5 }, shadowRadius: 8
  },
  refreshButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  mapToggleButton: {
    backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', elevation: 4
  },
  mapToggleText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  fullMap: { width: '100%', height: '100%' },
  calloutContainer: { padding: 10, minWidth: 150, alignItems: 'center' },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  calloutPrice: { color: '#2563eb', fontWeight: 'bold', fontSize: 13, marginBottom: 5 },
  calloutLink: { color: '#64748b', fontSize: 11, fontStyle: 'italic', marginTop: 4 }
});

export default HomeScreen