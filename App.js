// App.js
import React, { useEffect, useState } from "react";
import { Platform, View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import HotelDetailsScreen from "./screens/HotelDetailsScreen";
import PetProfileScreen from "./screens/PetProfileScreen";
import ReservationScreen from "./screens/ReservationScreen";
import ChatScreen from "./screens/ChatScreen";

import { initDatabase } from "./database";
import hotelsSeed from "./assets/data/hotels.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addHotelDirect } from "./seedHelpers";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: Platform.OS === "ios" ? 16 : 8,
          paddingTop: 8,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Pets") {
            iconName = focused ? "paw" : "paw-outline";
          } else if (route.name === "AI") {
            iconName = focused ? "chatbox" : "chatbox-outline";
          } else if (route.name === "Bookings") {
            iconName = focused ? "card" : "card-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9aa0a6",
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="Pets" component={PetProfileScreen} />
      <Tab.Screen name="AI" component={ChatScreen} />
      <Tab.Screen name="Bookings" component={ReservationScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Initializing app...</Text>
    </View>
  );
}

function ErrorScreen({ error }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Ionicons name="alert-circle" size={64} color="#dc2626" />
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#dc2626', marginTop: 16, marginBottom: 8 }}>
        Database Error
      </Text>
      <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
        {error}
      </Text>
      <Text style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
        Check console for more details
      </Text>
    </View>
  );
}

export default function App() {
  const [appState, setAppState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        await initDatabase();
        console.log('✅ Database initialized');
        
        // Așteaptă puțin pentru a vedea log-urile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const seeded = await AsyncStorage.getItem("hotels_seeded");
        if (!seeded) {
          console.log('🌱 Running database seed...');
          for (const hotel of hotelsSeed) {
            await addHotelDirect(hotel);
          }
          await AsyncStorage.setItem("hotels_seeded", "true");
          console.log('✅ Seed completed');
        }
        
        setAppState('ready');
      } catch (err) {
        console.error('❌ App initialization failed:', err);
        setError(err.message);
        setAppState('error');
      }
    };

    initializeApp();
  }, []);

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  if (appState === 'error') {
    return <ErrorScreen error={error} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerTitleAlign: "center",
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Back" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="PetProfile" component={PetProfileScreen} options={{ title: "Pet Profile" }} />
        <Stack.Screen name="Reservation" component={ReservationScreen} options={{ title: "Reservation" }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "AI Assistant" }} />
        <Stack.Screen name="HotelDetails" component={HotelDetailsScreen} options={{ title: "Hotel Details" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
