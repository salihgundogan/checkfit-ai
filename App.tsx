import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

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
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LegalScreen from './src/screens/LegalScreen';
import MacroGoalsScreen from './src/screens/MacroGoalsScreen';
import { ThemeProvider } from './src/screens/ThemeContext';

const Stack = createStackNavigator();

export const navigationRef = createNavigationContainerRef<any>();

function App() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsShowSplash(false), 6900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected === false && !isShowSplash) {
        if (navigationRef.isReady()) {
          navigationRef.navigate('NoConnection');
        }
      }
    });
    return () => unsubscribe();
  }, [isShowSplash]);

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (url.includes('reset-password')) {
        if (navigationRef.isReady()) {
          navigationRef.navigate('ResetPassword');
        }
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  if (isShowSplash) {
    return <WellbeingSplash />;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="RegisterStep2"  component={RegisterStep2} />
            <Stack.Screen name="RegisterStep3"  component={RegisterStep3} />
            <Stack.Screen name="RegisterStep4"  component={RegisterStep4} />
            <Stack.Screen name="Dashboard"      component={DashboardScreen} />
            <Stack.Screen name="Profile"        component={ProfileScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Progress"       component={ProgressScreen} />
            <Stack.Screen name="AICamera"       component={AICameraScreen} />
            <Stack.Screen name="NoConnection"   component={NoConnectionScreen} />
            <Stack.Screen name="Reports"        component={ReportsScreen} />
            <Stack.Screen
              name="ManualEntry"
              component={ManualEntryScreen}
              options={{ headerShown: false, animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Analysis"
              component={AnalysisScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Settings"   component={SettingsScreen}  options={{ headerShown: false }} />
            <Stack.Screen name="Terms"      component={LegalScreen}     options={{ headerShown: false }} />
            <Stack.Screen name="MacroGoals" component={MacroGoalsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;