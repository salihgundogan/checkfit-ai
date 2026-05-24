import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  StatusBar, TouchableOpacity, Platform,
  Alert, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from './ThemeContext';

const ResetPasswordScreen = () => {
  const navigation             = useNavigation<any>();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  const { T, darkMode } = useTheme();

  const handleReset = async () => {
    if (!password.trim() || !confirm.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert(
        'Başarılı',
        'Şifreniz güncellendi!',
        [{ text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  const styles = makeStyles(T, darkMode);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={T.primary} />
        </TouchableOpacity>

        <View style={styles.center}>
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Icon name="key-outline" size={30} color={T.primary} />
            </View>
          </View>

          <Text style={styles.title}>Yeni Şifre Belirle</Text>
          <Text style={styles.subtitle}>
            Hesabın için güçlü bir şifre oluştur.
          </Text>

          <View style={styles.card}>
            {/* Yeni şifre */}
            <Text style={styles.inputLabel}>YENİ ŞİFRE</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor={T.muted}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={T.muted} />
              </TouchableOpacity>
            </View>

            {/* Şifre tekrar */}
            <Text style={styles.inputLabel}>ŞİFRE TEKRAR</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Şifreyi tekrar gir"
                placeholderTextColor={T.muted}
                secureTextEntry={!showConf}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
              <TouchableOpacity onPress={() => setShowConf(p => !p)} style={styles.eyeBtn}>
                <Icon name={showConf ? 'eye-off-outline' : 'eye-outline'} size={20} color={T.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Şifremi Güncelle</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (T: any, darkMode: boolean) => StyleSheet.create({
  safe:            { flex: 1, backgroundColor: T.bg },
  kav:             { flex: 1 },
  backBtn:         { margin: 16, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  iconRing:        { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: T.primary + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconInner:       { width: 72, height: 72, borderRadius: 36, backgroundColor: T.primary + '1F', alignItems: 'center', justifyContent: 'center' },
  title:           { fontSize: 26, fontWeight: '800', color: T.text, marginBottom: 10, letterSpacing: -0.3, textAlign: 'center' },
  subtitle:        { fontSize: 15, color: T.muted, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  card:            { width: '100%', backgroundColor: T.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: T.border, elevation: 3, marginBottom: 20 },
  inputLabel:      { fontSize: 12, fontWeight: '700', color: T.text, marginBottom: 8, letterSpacing: 0.5 },
  inputWrap:       { position: 'relative', marginBottom: 16 },
  input:           { backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: T.text, paddingRight: 48 },
  eyeBtn:          { position: 'absolute', right: 14, top: 14 },
  saveBtn:         { backgroundColor: T.primary, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', elevation: 4, marginTop: 4 },
  saveBtnDisabled: { backgroundColor: T.muted },
  saveBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ResetPasswordScreen;