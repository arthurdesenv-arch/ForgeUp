import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import Step1PersonalData from '../screens/onboarding/Step1PersonalData';
import Step2Body from '../screens/onboarding/Step2Body';
import Step3Goal from '../screens/onboarding/Step3Goal';
import Step4Training from '../screens/onboarding/Step4Training';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Step1PersonalData" component={Step1PersonalData} />
        <Stack.Screen name="Step2Body" component={Step2Body} />
        <Stack.Screen name="Step3Goal" component={Step3Goal} />
        <Stack.Screen name="Step4Training" component={Step4Training} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}