import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
        Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
        return;
    }
    setLoading(true);
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'myapp://reset-password', // Deep link (opsiyonel)
        });
        if (error) throw error;
        Alert.alert('Başarılı', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
        navigation.goBack();
    } catch (error: any) {
        Alert.alert('Hata', error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={{fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Şifremi Unuttum</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.desc}>
            Hesabınıza ait e-posta adresini girin, size şifre sıfırlama bağlantısı gönderelim.
        </Text>

        <View style={styles.inputContainer}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput 
                style={styles.input} 
                placeholder="ornek@email.com" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>

        <PrimaryButton text={loading ? "Gönderiliyor..." : "Bağlantı Gönder"} onPress={handleReset} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { marginRight: 20 },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: { padding: 24 },
  desc: { color: '#666', marginBottom: 30, lineHeight: 22 },
  inputContainer: { marginBottom: 24 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 16, borderRadius: 12 },
});

export default ForgotPasswordScreen;