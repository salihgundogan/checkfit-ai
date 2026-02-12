import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker'; // Resim kütüphanesi

import StepHeader from '../components/StepHeader';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);

  // Input Referansları
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const fullNameRef = useRef<TextInput>(null);
  const prefNameRef = useRef<TextInput>(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    prefName: '',
    dob: new Date(),
    gender: 'Kadın',
    avatarUri: '',    // Ekranda göstermek için
    avatarBase64: '', // Supabase'e yüklemek için
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- RESİM SEÇME FONKSİYONU ---
  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
        includeBase64: true, // Veriyi taşımak için gerekli
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Hata', 'Resim seçilemedi');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData({ 
            ...formData, 
            avatarUri: asset.uri || '',
            avatarBase64: asset.base64 || '' 
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.dob;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setFormData({ ...formData, dob: currentDate });
  };

  const handleNext = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
        Alert.alert('Eksik Bilgi', 'Lütfen gerekli alanları doldurun.');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        Alert.alert('Hata', 'Şifreler uyuşmuyor.');
        return;
    }

    if (formData.password.length < 6) {
        Alert.alert('Güvenlik', 'Şifreniz en az 6 karakter olmalıdır.');
        return;
    }

    const formattedDate = formData.dob.toISOString().split('T')[0];

    navigation.navigate('RegisterStep2', { 
      prevData: {
        ...formData,
        dob: formattedDate
      } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      <StepHeader currentStep={1} totalSteps={4} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
            Profil resmini seç ve bilgilerini gir.
            </Text>
        </View>

        {/* --- 1. AVATAR SEÇİM ALANI --- */}
        <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {formData.avatarUri ? (
                    <Image source={{ uri: formData.avatarUri }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={{fontSize: 40}}>📷</Text>
                    </View>
                )}
                <View style={styles.addIconBadge}>
                    <Text style={{color:'#fff', fontWeight:'bold'}}>+</Text>
                </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Profil Resmi Ekle</Text>
        </View>

        {/* --- GİRİŞ BİLGİLERİ --- */}
        <Text style={styles.sectionTitle}>Giriş Bilgileri</Text>
        
        <Input
          label="E-posta Adresi"
          placeholder="ornek@email.com"
          value={formData.email}
          inputRef={emailRef}
          onChange={(v: string) => setFormData({ ...formData, email: v })}
          onSubmit={() => passwordRef.current?.focus()}
          keyboardType="email-address"
        />

        {/* Şifre Inputları (Göz İkonlu) */}
        <Input
          label="Şifre"
          placeholder="******"
          value={formData.password}
          inputRef={passwordRef}
          onChange={(v: string) => setFormData({ ...formData, password: v })}
          onSubmit={() => confirmPasswordRef.current?.focus()}
          isPassword={true} // Göz ikonu aktif
        />

        <Input
          label="Şifre Tekrar"
          placeholder="******"
          value={formData.confirmPassword}
          inputRef={confirmPasswordRef}
          onChange={(v: string) => setFormData({ ...formData, confirmPassword: v })}
          onSubmit={() => fullNameRef.current?.focus()}
          isPassword={true} // Göz ikonu aktif
        />

        {/* Şifremi Unuttum Linki */}
        <TouchableOpacity 
            style={styles.forgotPassContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
        >
            <Text style={styles.forgotPassText}>Şifreni mi unuttun?</Text>
        </TouchableOpacity>

        {/* --- KİŞİSEL BİLGİLER --- */}
        <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

        <Input
          label="Tam Adı"
          placeholder="Ad Soyad"
          value={formData.fullName}
          inputRef={fullNameRef}
          onChange={(v: string) => setFormData({ ...formData, fullName: v })}
          onSubmit={() => prefNameRef.current?.focus()}
        />

        <Input
          label="Sana nasıl hitap edelim?"
          placeholder="İsim"
          value={formData.prefName}
          inputRef={prefNameRef}
          onChange={(v: string) => setFormData({ ...formData, prefName: v })}
          onSubmit={() => Keyboard.dismiss()}
        />

        {/* --- DOĞUM TARİHİ --- */}
        <View style={styles.inputWrap}>
            <Text style={styles.label}>Doğum Tarihi</Text>
            <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.dateText}>
                    {formData.dob.toLocaleDateString('tr-TR', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                </Text>
                <Text style={{fontSize: 18}}>📅</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={formData.dob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                />
            )}
            
            {Platform.OS === 'ios' && showDatePicker && (
                 <TouchableOpacity 
                    onPress={() => setShowDatePicker(false)}
                    style={{alignItems: 'flex-end', marginTop: 8}}
                 >
                     <Text style={{color: '#2f7f34', fontWeight: 'bold'}}>Tamam</Text>
                 </TouchableOpacity>
            )}
        </View>

        {/* --- CİNSİYET --- */}
        <Text style={styles.label}>Cinsiyet</Text>
        <View style={styles.genderRow}>
          {['Erkek', 'Kadın'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderButton,
                formData.gender === g && styles.genderActive,
              ]}
              onPress={() => setFormData({ ...formData, gender: g })}
            >
              <Text
                style={[
                  styles.genderText,
                  formData.gender === g && styles.genderTextActive,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>İleri →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---  INPUT BİLEŞENİ --- */
function Input({ label, placeholder, value, onChange, onSubmit, inputRef, keyboardType = 'default', isPassword = false }: any) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            keyboardType={keyboardType}
            onChangeText={onChange}
            onSubmitEditing={onSubmit}
            secureTextEntry={isPassword && !showPassword} // Şifre gizleme mantığı
            returnKeyType="next"
            style={styles.input}
          />
          {/* Göz İkonu */}
          {isPassword && (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Text style={{fontSize: 18}}>{showPassword ? '👁️' : '🚫'}</Text>
              </TouchableOpacity>
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 24 },
  headerTextContainer: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111811', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', lineHeight: 24 },
  
  // Avatar Stilleri
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 100, height: 100, marginBottom: 8, position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  addIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2f7f34', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarLabel: { color: '#2f7f34', fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2f7f34', marginTop: 12, marginBottom: 16 },

  inputWrap: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '600', color: '#111811', marginLeft: 4 },
  
  // Input Container (İkon için )
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5dc',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 50, // Sabit yükseklik
    fontSize: 16,
    color: '#111811',
  },
  eyeIcon: {
    padding: 10,
  },

  forgotPassContainer: { alignItems: 'flex-end', marginBottom: 20, marginTop: -10 },
  forgotPassText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },

  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5dc',
    borderRadius: 12,
    padding: 16,
  },
  dateText: { fontSize: 16, color: '#111811' },

  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce5dc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderActive: {
    backgroundColor: '#2f7f34',
    borderColor: '#2f7f34',
  },
  genderText: { fontWeight: '600', color: '#6b7280' },
  genderTextActive: { color: '#fff' },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: 'rgba(246, 248, 246, 0.95)',
  },
  button: {
    backgroundColor: '#2f7f34',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#2f7f34",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});