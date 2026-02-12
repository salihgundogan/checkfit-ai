import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import StepHeader from '../components/StepHeader';
import MeasurementInput from '../components/MeasurementInput';
import PrimaryButton from '../components/PrimaryButton';

const RegisterStep2 = () => {
  const navigation = useNavigation<any>();
  
  //  Önceki sayfadan (RegisterScreen) gelen veriyi yakalıyoruz
  const route = useRoute<any>();
  const { prevData } = route.params || {};

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const handleNext = () => {
    //  Eski verilerle yeni verileri birleştirip Step 3'e atıyoruz
    navigation.navigate('RegisterStep3', {
      prevData: {
        ...prevData, // Ad, Soyad, Email, Şifre, Doğum Tarihi...
        weight,      // eklenen Kilo
        height       // eklenen Boy
      }
    });
  };

  const handleSkip = () => {
    // Atlansa bile önceki verileri (Email/Şifre) kaybetmemeliyiz
    navigation.navigate('RegisterStep3', {
        prevData: prevData 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader currentStep={2} totalSteps={4} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Vücut Ölçüleriniz</Text>
            <Text style={styles.subtitle}>
              Bu, kalori ihtiyaçlarınızı doğru bir şekilde hesaplamamıza yardımcı olur.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <MeasurementInput 
              label="Mevcut Kilo"
              value={weight}
              onChangeText={setWeight}
              unit="kg"
              placeholder="70"
            />

            <MeasurementInput 
              label="Boy"
              value={height}
              onChangeText={setHeight}
              unit="cm"
              placeholder="175"
            />
          </View>

          <View style={styles.footer}>
            <PrimaryButton text="İleri" onPress={handleNext} />
            
            {/* Skip butonuna da fonksiyonu bağladık */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Şimdilik geç</Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  footer: {
    marginTop: 'auto', // En alta iter
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default RegisterStep2;