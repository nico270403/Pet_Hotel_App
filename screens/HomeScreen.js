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
  ActivityIndicator
} from 'react-native';
import { getHotels } from '../dbHelpers';

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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('🚀 Starting data loading...');
      
      // First try to connect to backend
      try {
        await api.checkHealth();
        console.log('✅ Backend is running, using API');
        setUsingBackend(true);
        await loadHotelsFromAPI();
      } catch (backendError) {
        // Fallback to local SQLite
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
    // Folosește baseUrl-ul găsit de checkHealth
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
      source={{ uri: item.image_url || 'https://placedog.net/400/300?random=' + item.id }} 
      style={styles.hotelImage}
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pet Hotels</Text>
        <Text style={styles.headerSubtitle}>Find the perfect stay for your pet</Text>
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: usingBackend ? '#10b981' : '#6b7280' }
          ]} />
          <Text style={styles.statusText}>
            {usingBackend ? 'Connected to Server' : 'Using Local Data'}
          </Text>
        </View>
      </View>

      {/* Hotels List */}
      {hotels.length === 0 ? (
        renderEmptyState()
      ) : (
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

      {/* Refresh Button */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Space for refresh button
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  hotelImage: {
    width: '100%',
    height: 200,
  },
  hotelInfo: {
    padding: 16,
    position: 'relative',
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  hotelDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    backgroundColor: '#ffeb3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  dataSourceIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dataSourceText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;