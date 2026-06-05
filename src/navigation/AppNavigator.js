import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import Step1PersonalData from '../screens/onboarding/Step1PersonalData';
import Step2Body from '../screens/onboarding/Step2Body';
import Step3Goal from '../screens/onboarding/Step3Goal';
import Step4Training from '../screens/onboarding/Step4Training';

import HomeScreen from '../screens/HomeScreen';
import TrainingScreen from '../screens/TrainingScreen';
import SearchScreen from '../screens/SearchScreen';
import IAScreen from '../screens/IAScreen';
import NutritionScreen from '../screens/NutritionScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingLogo}>ForgeUp</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Step1PersonalData" component={Step1PersonalData} />
      <Stack.Screen name="Step2Body" component={Step2Body} />
      <Stack.Screen name="Step3Goal" component={Step3Goal} />
      <Stack.Screen name="Step4Training" component={Step4Training} />
    </Stack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Treino') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Busca') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'IA') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Nutrição') iconName = focused ? 'nutrition' : 'nutrition-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Treino" component={TrainingScreen} />
      <Tab.Screen name="Busca" component={SearchScreen} />
      <Tab.Screen name="IA" component={IAScreen} />
      <Tab.Screen name="Nutrição" component={NutritionScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(undefined);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
  },
  tabBar: {
    backgroundColor: colors.gray100,
    borderTopColor: colors.gray300,
    borderTopWidth: 0.5,
    paddingBottom: 6,
    paddingTop: 6,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
