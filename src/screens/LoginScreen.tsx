import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

import SocialButton from '../components/SocialButton';
import PrimaryButton from '../components/PrimaryButton';

const LoginScreen = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Şifre göster/gizle state'i
  const [loading, setLoading] = useState(false);

  // --- Aksiyonlar ---
  const handleGoogleLogin = () => console.log('Google Login');
  const handleAppleLogin = () => console.log('Apple Login');
  
  // --- GİRİŞ YAP FONKSİYONU ---
  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
        Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi giriniz.');
        return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Giriş Başarısız', error.message);
    } else {
      console.log('Giriş başarılı:', data.user);
      navigation.replace('Dashboard'); 
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword'); // Şifremi unuttum sayfasına yönlendirme
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* --- BAŞLIK --- */}
           <View style={styles.header}>
            <View style={styles.logoCircle}>
              {/* Logo yoksa assets/logo.png dosyasını kontrol edin veya geçici bir text kullanın */}
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Hoşgeldiniz</Text>
            <Text style={styles.subtitle}>Sizi tekrar görmek güzel!</Text>
          </View>


          {/* --- GOOGLE-APPLE GİRİŞ --- */}
          <View style={styles.section}>
            <SocialButton text="Google ile Giriş Yap" provider="google" onPress={handleGoogleLogin} />
            <SocialButton text="Apple ile Giriş Yap" provider="apple" onPress={handleAppleLogin} />
          </View>

          {/* --- AYIRACI --- */}
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>veya e-posta ile</Text>
            <View style={styles.line} />
          </View>

          {/* --- E-POSTA FORM ALANI --- */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Şifre</Text>
              
              {/* Şifre Input Container (Göz İkonu İçin) */}
              <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="******"
                    placeholderTextColor="#A0A0A0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword} // State'e göre gizle/göster
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Text style={{fontSize: 18}}>{showPassword ? '👁️' : '︶'}</Text>
                  </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotContainer} onPress={navigateToForgotPassword}>
                <Text style={styles.forgotText}>Şifreni mi unuttun?</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton 
                text={loading ? "Giriş Yapılıyor..." : "Giriş Yap"} 
                onPress={loading ? () => {} : handleLogin} 
            />
          </View>

          {/* --- ALT BÖLÜM --- */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Henüz hesabın yok mu? </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(47, 127, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5e8761',
  },
  section: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#dce5dc',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#5e8761',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111811',
  },
  
  // Şifre Alanı Stilleri 
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111811',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },

  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13,
    color: '#5e8761',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
  footerText: {
    color: '#5e8761',
    fontSize: 14,
  },
  registerLink: {
    color: '#2f7f34',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;