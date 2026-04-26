import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

const ForgotPasswordScreen = () => {
  // ── Tüm hook'lar en üstte, koşulsuz ──────────────────────
  const navigation            = useNavigation<any>();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  // ─────────────────────────────────────────────────────────

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi giriniz.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'yourapp://reset-password',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF5EE" />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Geri butonu */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#2f7f34" />
        </TouchableOpacity>

        <View style={styles.center}>

          {/* İkon */}
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Icon
                name={sent ? 'checkmark' : 'lock-closed-outline'}
                size={30}
                color="#2f7f34"
              />
            </View>
          </View>

          <Text style={styles.title}>
            {sent ? 'E-posta Gönderildi!' : 'Şifreni Sıfırla'}
          </Text>

          <Text style={styles.subtitle}>
            {sent
              ? `${email} adresine şifre sıfırlama bağlantısı gönderdik. Gelen kutunu kontrol et.`
              : 'Kayıtlı e-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.'}
          </Text>

          {/* ── Form veya Başarı ── */}
          <View style={styles.card}>
            {!sent ? (
              <>
                <Text style={styles.inputLabel}>E-POSTA</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#8BA58C"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleReset}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.sendBtnText}>Sıfırlama Bağlantısı Gönder</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.successBox}>
                  <Icon name="mail-unread-outline" size={40} color="#2f7f34" />
                  <Text style={styles.successTitle}>Gelen kutunu kontrol et</Text>
                  <Text style={styles.successText}>
                    Bağlantı birkaç dakika içinde gelecektir. Spam klasörünü de kontrol etmeyi unutma.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => { setSent(false); setEmail(''); }}
                >
                  <Text style={styles.resendText}>Farklı bir e-posta dene</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon name="arrow-back-outline" size={16} color="#2f7f34" style={{ marginRight: 6 }} />
            <Text style={styles.loginLinkText}>Giriş ekranına dön</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#EEF5EE' },
  kav:             { flex: 1 },
  backBtn:         { margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D4E4D5' },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  iconRing:        { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: 'rgba(47,127,52,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconInner:       { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(47,127,52,0.12)', alignItems: 'center', justifyContent: 'center' },
  title:           { fontSize: 26, fontWeight: '800', color: '#1A2E1B', marginBottom: 10, letterSpacing: -0.3, textAlign: 'center' },
  subtitle:        { fontSize: 15, color: '#5e8761', fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  card:            { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#D4E4D5', shadowColor: '#2f7f34', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3, marginBottom: 20 },
  inputLabel:      { fontSize: 12, fontWeight: '700', color: '#3D5C3E', marginBottom: 8, letterSpacing: 0.5 },
  input:           { backgroundColor: '#F4FAF4', borderWidth: 1.5, borderColor: '#D4E4D5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A2E1B', marginBottom: 16 },
  sendBtn:         { backgroundColor: '#2f7f34', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  sendBtnDisabled: { backgroundColor: '#A8C9AA' },
  sendBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  successBox:      { alignItems: 'center', paddingVertical: 8 },
  successTitle:    { fontSize: 18, fontWeight: '800', color: '#1A2E1B', marginTop: 16, marginBottom: 8 },
  successText:     { fontSize: 14, color: '#5e8761', textAlign: 'center', lineHeight: 21 },
  resendBtn:       { marginTop: 20, alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#D4E4D5' },
  resendText:      { color: '#2f7f34', fontSize: 14, fontWeight: '600' },
  loginLink:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  loginLinkText:   { color: '#2f7f34', fontSize: 14, fontWeight: '600' },
});

export default ForgotPasswordScreen;