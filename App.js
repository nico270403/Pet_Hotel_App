import React, { useEffect, useState } from "react";
import { Platform, View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// === IMPORT ECRANE ===
import HomeScreen from "./screens/HomeScreen";
import HotelDetailsScreen from "./screens/HotelDetailsScreen";
import PetProfileScreen from "./screens/PetProfileScreen";
import ReservationScreen from "./screens/ReservationScreen"; // Formularul
import ChatScreen from "./screens/ChatScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import BookingsScreen from "./screens/BookingsScreen"; // Istoricul

// === IMPORT DATABASE & CONTEXT ===
import { initDatabase } from "./database";
import hotelsSeed from "./assets/data/hotels.json";
import { addHotelDirect } from "./seedHelpers";
import { AuthProvider } from "./context/AuthContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// === CONFIGURARE TAB-URI (MENIUL DE JOS) ===
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Pets") {
            iconName = focused ? "paw" : "paw-outline";
          } else if (route.name === "AI") {
            iconName = focused ? "chatbox-ellipses" : "chatbox-ellipses-outline";
          } else if (route.name === "MyBookings") { // Istoric
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "ReservationTab") { // Formular (Nume schimbat pentru a nu face conflict)
            iconName = focused ? "add-circle" : "add-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: "Acasă" }} 
      />
      
      <Tab.Screen 
        name="Pets" 
        component={PetProfileScreen} 
        options={{ title: "Animale" }} 
      />

      <Tab.Screen 
        name="ReservationTab" 
        component={ReservationScreen} 
        options={{ title: "Rezervă" }} 
      />

      <Tab.Screen 
        name="MyBookings" 
        component={BookingsScreen} 
        options={{ title: "Istoric" }} 
      />

      <Tab.Screen 
        name="AI" 
        component={ChatScreen} 
        options={{ title: "AI Chat" }} 
      />
    </Tab.Navigator>
  );
}

// === LOADING & ERROR ===
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

// === APP ===
export default function App() {
  const [appState, setAppState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app...');
        await initDatabase();
        const seeded = await AsyncStorage.getItem("hotels_seeded");
        if (!seeded) {
          for (const hotel of hotelsSeed) await addHotelDirect(hotel);
          await AsyncStorage.setItem("hotels_seeded", "true");
        }
        setAppState('ready');
      } catch (err) {
        console.error('❌ Init failed:', err);
        setError(err.message);
        setAppState('error');
      }
    };
    initializeApp();
  }, []);

  if (appState === 'loading') return <LoadingScreen />;
  if (appState === 'error') return <ErrorScreen error={error} />;

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{ headerTitleAlign: "center", headerShadowVisible: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />

          <Stack.Screen name="Home" component={MainTabs} options={{ headerShown: false }} />

          <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} options={{ title: "Detalii Hotel" }} />
          
          <Stack.Screen name="Reservation" component={ReservationScreen} options={{ title: "Rezervare" }} />
          
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Asistent AI" }} />
          <Stack.Screen name="PetProfile" component={PetProfileScreen} options={{ title: "Profil Animal" }} />

        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
