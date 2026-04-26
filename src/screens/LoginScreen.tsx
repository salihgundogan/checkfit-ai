import React, { useEffect, useRef, useState } from 'react';
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
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

GoogleSignin.configure({
  webClientId: '973129174947-8p11uu9q6oravfj6o74b9kf9eq918spb.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
  offlineAccess: true,
});

// ─── InputField ───────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'none',
  secureTextEntry = false, rightElement,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[inputStyles.container, focused && inputStyles.focused]}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8BA58C"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightElement && <View style={inputStyles.rightSlot}>{rightElement}</View>}
      </View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper:   { marginBottom: 16 },
  label:     { fontSize: 13, fontWeight: '600', color: '#3D5C3E', marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' },
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D4E4D5', borderRadius: 14, paddingHorizontal: 16, height: 54 },
  focused:   { borderColor: '#2f7f34', shadowColor: '#2f7f34', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  input:     { flex: 1, fontSize: 16, color: '#1A2E1B', height: '100%' },
  rightSlot: { marginLeft: 8 },
});

// ─── PrimaryButton ────────────────────────────
const PrimaryButton: React.FC<{ label: string; onPress: () => void; loading?: boolean; disabled?: boolean }> = ({
  label, onPress, loading = false, disabled = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[btnStyles.button, disabled && btnStyles.disabled]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={btnStyles.label}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const btnStyles = StyleSheet.create({
  button:   { backgroundColor: '#2f7f34', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#2f7f34', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  disabled: { backgroundColor: '#A8C9AA', shadowOpacity: 0 },
  label:    { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});

// ─── SocialButton ────────────────────────────
const SocialButton: React.FC<{ iconName: string; iconColor: string; label: string; onPress: () => void }> = ({
  iconName, iconColor, label, onPress,
}) => (
  <TouchableOpacity style={socialStyles.button} onPress={onPress} activeOpacity={0.8}>
    <View style={[socialStyles.iconBg, { backgroundColor: `${iconColor}15` }]}>
      <Icon name={iconName} size={20} color={iconColor} />
    </View>
    <Text style={socialStyles.label}>{label}</Text>
    <View style={{ width: 36 }} />
  </TouchableOpacity>
);

const socialStyles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', height: 54, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#D4E4D5' },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 15, fontWeight: '600', color: '#1A2E1B', flex: 1, textAlign: 'center' },
});

// ─── LoginScreen ──────────────────────────────
const LoginScreen = () => {
  const navigation = useNavigation<any>();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const headerFade  = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const formFade    = useRef(new Animated.Value(0)).current;
  const formSlide   = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formFade,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(formSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('Google token alınamadı.');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) throw error;
      navigation.replace('Dashboard');
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // sessiz geç
      } else if (err.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Bilgi', 'Giriş işlemi zaten devam ediyor.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Hata', 'Google Play Services bulunamadı.');
      } else {
        Alert.alert('Google Giriş Hatası', err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Giriş Başarısız', error.message);
    } else {
      navigation.replace('Dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF5EE" />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
            <View style={styles.logoRing}>
              <View style={styles.logoInner}>
                <Icon name="leaf" size={28} color="#2f7f34" />
              </View>
            </View>
            <Text style={styles.title}>Tekrar Hoşgeldiniz</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
          </Animated.View>

          {/* Kart */}
          <Animated.View style={[styles.card, { opacity: formFade, transform: [{ translateY: formSlide }] }]}>

            {googleLoading ? (
              <View style={styles.socialLoadingBox}>
                <ActivityIndicator color="#2f7f34" />
                <Text style={styles.socialLoadingText}>Google hesabı seçiliyor…</Text>
              </View>
            ) : (
              <SocialButton iconName="logo-google" iconColor="#DB4437" label="Google ile Giriş Yap" onPress={handleGoogleLogin} />
            )}

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>veya e-posta ile devam et</Text>
              <View style={styles.divLine} />
            </View>

            <InputField
              label="E-posta" value={email} onChangeText={setEmail}
              placeholder="ornek@email.com" keyboardType="email-address" autoCapitalize="none"
            />

            <InputField
              label="Şifre" value={password} onChangeText={setPassword}
              placeholder="••••••••" secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#5e8761" />
                </TouchableOpacity>
              }
            />

            {/* Şifremi Unuttum */}
            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Şifreni mi unuttun?</Text>
            </TouchableOpacity>

            <View style={{ marginTop: 4 }}>
              <PrimaryButton label="Giriş Yap" onPress={handleEmailLogin} loading={loading} disabled={loading} />
            </View>
          </Animated.View>

          {/* Footer — WelcomeScreen'e yönlendir */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#EEF5EE' },
  bgCircle1:         { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(47,127,52,0.06)', top: -80, right: -80 },
  bgCircle2:         { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(47,127,52,0.05)', bottom: 60, left: -60 },
  scroll:            { flexGrow: 1, padding: 24, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
  header:            { alignItems: 'center', marginBottom: 32 },
  logoRing:          { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: 'rgba(47,127,52,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoInner:         { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(47,127,52,0.12)', alignItems: 'center', justifyContent: 'center' },
  title:             { fontSize: 26, fontWeight: '800', color: '#1A2E1B', marginBottom: 6, letterSpacing: -0.3 },
  subtitle:          { fontSize: 15, color: '#5e8761', fontWeight: '500' },
  card:              { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#D4E4D5', shadowColor: '#2f7f34', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 3, marginBottom: 20 },
  socialLoadingBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, backgroundColor: '#F4FAF4', borderRadius: 14, borderWidth: 1.5, borderColor: '#D4E4D5' },
  socialLoadingText: { color: '#5e8761', fontSize: 14, fontWeight: '500' },
  divider:           { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine:           { flex: 1, height: 1, backgroundColor: '#D4E4D5' },
  divText:           { marginHorizontal: 12, color: '#8BA58C', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
  forgotBtn:         { alignSelf: 'flex-end', marginBottom: 12, marginTop: -4 },
  forgotText:        { fontSize: 13, color: '#2f7f34', fontWeight: '600' },
  footer:            { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
  footerText:        { color: '#5e8761', fontSize: 14 },
  registerLink:      { color: '#2f7f34', fontSize: 14, fontWeight: '800' },
});

export default LoginScreen;