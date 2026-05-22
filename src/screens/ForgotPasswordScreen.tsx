import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';
const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [step, setStep]       = useState<'email' | 'otp'>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const { T,darkMode } = useTheme();
  // Adım 1: OTP gönder
  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen email adresinizi girin.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false, // Kayıtsız kullanıcıya OTP gönderme
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      setStep('otp');
    }
  };

  // Adım 2: OTP doğrula → ResetPassword'e yönlendir
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'magiclink', // OTP ile signInWithOtp kullandığımız için
    });
    setLoading(false);

    if (error) {
      Alert.alert('Geçersiz Kod', 'Kod hatalı veya süresi dolmuş. Tekrar deneyin.');
    } else {
      // Session açıldı, şifre sıfırlama ekranına geç
      navigation.navigate('ResetPassword');
    }
  };

 return (
  <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
    <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={T.bg} />
    <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      <TouchableOpacity style={[styles.backBtn, { backgroundColor: T.card, borderColor: T.border }]} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={22} color={T.primary} />
      </TouchableOpacity>

      <View style={styles.center}>
        <View style={styles.iconRing}>
          <View style={styles.iconInner}>
            <Icon
              name={step === 'email' ? 'mail-outline' : 'keypad-outline'}
              size={30}
              color={T.primary}
            />
          </View>
        </View>

        {step === 'email' ? (
          <>
            <Text style={[styles.title, { color: T.text }]}>Şifremi Unuttum</Text>
            <Text style={[styles.subtitle, { color: T.muted }]}>
              Email adresinize 6 haneli doğrulama kodu göndereceğiz.
            </Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.inputLabel, { color: T.primary }]}>EMAIL ADRESİ</Text>
              <TextInput
                style={[styles.input, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                placeholderTextColor={T.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleSendOtp}
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Kod Gönder</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: T.text }]}>Kodu Girin</Text>
            <Text style={[styles.subtitle, { color: T.muted }]}>
              <Text style={{ fontWeight: '700', color: T.primary }}>{email}</Text>
              {'\n'}adresine gönderilen 6 haneli kodu girin.
            </Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.inputLabel, { color: T.primary }]}>DOĞRULAMA KODU</Text>
              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: T.surface, borderColor: T.border, color: T.text }]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                placeholderTextColor={T.muted}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Doğrula</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { setStep('email'); setOtp(''); }}
              >
                <Text style={[styles.resendText, { color: T.primary }]}>
                  Farklı email kullan veya tekrar gönder
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#EEF5EE' },
  kav:         { flex: 1 },
  backBtn:     { margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D4E4D5' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  iconRing:    { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: 'rgba(47,127,52,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconInner:   { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(47,127,52,0.12)', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 26, fontWeight: '800', color: '#1A2E1B', marginBottom: 10, letterSpacing: -0.3, textAlign: 'center' },
  subtitle:    { fontSize: 15, color: '#5e8761', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  card:        { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#D4E4D5', elevation: 3 },
  inputLabel:  { fontSize: 12, fontWeight: '700', color: '#3D5C3E', marginBottom: 8, letterSpacing: 0.5 },
  input:       { backgroundColor: '#F4FAF4', borderWidth: 1.5, borderColor: '#D4E4D5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A2E1B', marginBottom: 16 },
  otpInput:    { fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 8 },
  btn:         { backgroundColor: '#2f7f34', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  btnDisabled: { backgroundColor: '#A8C9AA' },
  btnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  resendBtn:   { marginTop: 16, alignItems: 'center' },
  resendText:  { color: '#2f7f34', fontSize: 13, fontWeight: '600' },
});

export default ForgotPasswordScreen;