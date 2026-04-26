import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
// YENİ: createNavigationContainerRef eklendi
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// YENİ: NetInfo eklendi
import NetInfo from '@react-native-community/netinfo';

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
import NoConnectionScreen from './src/screens/NoConnectionScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ManualEntryScreen from './src/screens/ManualEntryScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';

const Stack = createStackNavigator();

// YENİ: Navigation referansı (Uygulamanın her yerinden yönlendirme yapabilmek için)
export const navigationRef = createNavigationContainerRef<any>();

function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  // Splash Screen Zamanlayıcı
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 6900);

    return () => clearTimeout(timer);
  }, []);

  // --- İNTERNET BAĞLANTISINI DİNLEME ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Eğer bağlantı koptuysa ve splash ekranı geçildiyse
      if (state.isConnected === false && !isShowSplash) {
        if (navigationRef.isReady()) {
          // İnternet yoksa hata ekranına yönlendir
          navigationRef.navigate('NoConnection');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isShowSplash]); // isShowSplash değiştiğinde tekrar tetiklenir

  if (isShowSplash) {
    return <WellbeingSplash />;
  }

  return (
    <SafeAreaProvider>
      {/* YENİ: ref={navigationRef} eklendi */}
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false }}
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
          <Stack.Screen name="NoConnection" component={NoConnectionScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen  name="ManualEntry"  component={ManualEntryScreen}  options={{  headerShown: false, animation: 'slide_from_bottom' // Alttan açılarak gelmesi tasarımına yakışıyor
 }} 
  />
  <Stack.Screen name="Analysis" component={AnalysisScreen} options={{ title: 'Analiz' }} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;