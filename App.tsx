import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- DOSYA YOLLARI (IMPORTLAR) ---
import WellbeingSplash from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen'; 
import LoginScreen from './src/screens/LoginScreen'; 
import RegisterScreen from './src/screens/RegisterScreen';
import RegisterStep2 from './src/screens/RegisterStep2';
import RegisterStep3 from './src/screens/RegisterStep3';
import RegisterStep4 from './src/screens/RegisterStep4';
import DashboardScreen from './src/screens/DashBoardScreen'; 
import ProfileScreen from './src/screens/ProfileScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import AICameraScreen from './src/screens/AICameraScreen';
import ManualFoodScreen from './src/screens/ManualFoodScreen';

const Stack = createStackNavigator();

function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    // 2.5 saniye sonra Splash ekranını kapat
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Durum: Splash süresi dolmadıysa Splash göster
  if (isShowSplash) {
    return <WellbeingSplash />;
  }

  // 2. Durum: Uygulama Başlıyor
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Welcome" // BAŞLANGIÇ EKRANI ARTIK 'Welcome'
          screenOptions={{
            headerShown: false 
          }}
        >
          {/* --- GİRİŞ AKIŞI --- */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          
          {/* --- KAYIT ADIMLARI --- */}
          <Stack.Screen name="RegisterStep2" component={RegisterStep2} />
          <Stack.Screen name="RegisterStep3" component={RegisterStep3} />
          <Stack.Screen name="RegisterStep4" component={RegisterStep4} />
          
          {/* --- ANA UYGULAMA --- */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Progress" component={ProgressScreen} />
          <Stack.Screen name="AICamera" component={AICameraScreen} />
          <Stack.Screen name="ManualFood" component={ManualFoodScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;