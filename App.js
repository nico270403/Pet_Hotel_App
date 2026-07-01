import React, { useEffect, useState, useContext } from "react";
import { Platform, View, Text, ActivityIndicator, Alert, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from '@stripe/stripe-react-native';

import { AuthContext, AuthProvider } from "./context/AuthContext";
import { initDatabase } from "./database";
import hotelsSeed from "./assets/data/hotels.json";
import { addHotelDirect } from "./seedHelpers";

import HomeScreen from "./screens/HomeScreen";
import HotelDetailsScreen from "./screens/HotelDetailsScreen";
import PetProfileScreen from "./screens/PetProfileScreen";
import ReservationScreen from "./screens/ReservationScreen"; 
import ChatScreen from "./screens/ChatScreen";
import BookingsScreen from "./screens/BookingsScreen"; 
import ReviewScreen from "./screens/ReviewScreen";
import AdaugaRezervareScreen from './screens/AdaugaRezervareScreen'; 

import WelcomeScreen from "./screens/WelcomeScreen"; 
import AuthScreen from "./screens/AuthScreen"; 

import HotelDashboardScreen from "./screens/HotelDashboardScreen"; 
import AddHotelScreen from "./screens/AddHotelScreen"; 
import EditHotelScreen from "./screens/EditHotelScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user, logout } = useContext(AuthContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitleAlign: 'center',
        // headerRight: () => user ? (
        //   <TouchableOpacity 
        //     onPress={() => {
        //       Alert.alert("Deconectare", "Ești sigur că vrei să ieși?", [
        //         { text: "Anulează", style: "cancel" },
        //         { text: "Da", onPress: logout, style: "destructive" }
        //       ]);
        //     }} 
        //     style={{ marginRight: 15 }}
        //   >
        //     <Ionicons name="log-out-outline" size={26} color="#dc2626" />
        //   </TouchableOpacity>
        // ) : null,
        tabBarStyle: {
          height: 70,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          backgroundColor: "#fff",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "HomeTab") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Pets") iconName = focused ? "paw" : "paw-outline";
          else if (route.name === "AI") iconName = focused ? "chatbox-ellipses" : "chatbox-ellipses-outline";
          else if (route.name === "MyBookings") iconName = focused ? "list" : "list-outline";
          else if (route.name === "ReservationTab") iconName = focused ? "add-circle" : "add-circle-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: "Acasă" }} />
      <Tab.Screen name="Pets" component={PetProfileScreen} options={{ title: "Animale" }} />
      <Tab.Screen name="ReservationTab" component={ReservationScreen} options={{ title: "Rezervă" }} />
      <Tab.Screen name="MyBookings" component={BookingsScreen} options={{ title: "Istoric" , headerShown: false }} />
      <Tab.Screen name="AI" component={ChatScreen} options={{ title: "AI Chat" }} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Se inițializează...</Text>
    </View>
  );
}

function ErrorScreen({ error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Ionicons name="alert-circle" size={64} color="#dc2626" />
      <Text style={{ fontSize: 18, color: '#dc2626', textAlign: 'center', marginTop: 10 }}>{error}</Text>
    </View>
  );
}

function RootNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center", headerShadowVisible: false }}>
      {!user ? (
        <>
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }} 
          />
        </>
      ) : user.role === 'manager' ? (
        <>
          {((user.hotels && user.hotels.length > 0) || (user.hotel_ids && user.hotel_ids.length > 0)) && (
            <Stack.Screen 
              name="HotelDashboard" 
              component={HotelDashboardScreen} 
              options={{ headerShown: false }} 
            />
          )}
            <Stack.Screen 
              name="AddHotel" 
              component={AddHotelScreen} 
              options={{ title: 'Adaugă Locație Nouă' }} 
            />
            <Stack.Screen 
              name="EditHotel" 
              component={EditHotelScreen} 
              options={{ headerShown: false }} 
            />

            <Stack.Screen 
              name="AdaugaRezervare" 
              component={AdaugaRezervareScreen} 
              options={{ title: 'Adaugă Rezervare' }} 
            />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} options={{ title: "Detalii Hotel" }} />
          <Stack.Screen name="Reservation" component={ReservationScreen} options={{ title: "Rezervare" }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Recenzie" }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Asistent AI" }} />
          <Stack.Screen name="PetProfile" component={PetProfileScreen} options={{ title: "Profil Animal" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [appState, setAppState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(' Starting app...');
        await initDatabase();
        const seeded = await AsyncStorage.getItem("hotels_seeded");
        if (!seeded) {
          for (const hotel of hotelsSeed) await addHotelDirect(hotel);
          await AsyncStorage.setItem("hotels_seeded", "true");
        }
        setAppState('ready');
      } catch (err) {
        console.error(' Init failed:', err);
        setError(err.message);
        setAppState('error');
      }
    };
    initializeApp();
  }, []);

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error') return <ErrorScreen error={error} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content"  backgroundColor="#7899c2" translucent={false}/>
      
      <View style={styles.screenFrame}>
        <AuthProvider>
          <StripeProvider publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </StripeProvider>
        </AuthProvider>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7899c2',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  screenFrame: {
    flex: 1,
    borderWidth: 2,          
    borderColor: '#7899c2',  
    borderRadius: 24,        
    overflow: 'hidden',      
    margin: 4,               
    backgroundColor: '#ffffff' 
  }
});