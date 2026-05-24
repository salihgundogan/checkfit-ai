import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from './ThemeContext';

import StepHeader from '../components/StepHeader';
import MeasurementInput from '../components/MeasurementInput';
import PrimaryButton from '../components/PrimaryButton';

const RegisterStep2 = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { prevData } = route.params || {};
  const { T, darkMode } = useTheme();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const S = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    content:   { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
    headerTextContainer: { alignItems: 'center', marginVertical: 32 },
    title:    { fontSize: 28, fontWeight: 'bold', color: T.text, marginBottom: 12, textAlign: 'center' },
    subtitle: { fontSize: 16, color: T.muted, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
    formContainer: { marginBottom: 24 },
    footer:     { marginTop: 'auto' as any },
    skipButton: { alignItems: 'center', padding: 16 },
    skipText:   { color: T.muted, fontWeight: '500' },
  }), [T]);

  const handleNext = () => {
    navigation.navigate('RegisterStep3', { prevData: { ...prevData, weight, height } });
  };

  const handleSkip = () => {
    navigation.navigate('RegisterStep3', { prevData });
  };

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />
      <StepHeader currentStep={2} totalSteps={4} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={S.content}>
          <View style={S.headerTextContainer}>
            <Text style={S.title}>Vücut Ölçüleriniz</Text>
            <Text style={S.subtitle}>
              Bu, kalori ihtiyaçlarınızı doğru bir şekilde hesaplamamıza yardımcı olur.
            </Text>
          </View>

          <View style={S.formContainer}>
            <MeasurementInput label="Mevcut Kilo" value={weight} onChangeText={setWeight} unit="kg" placeholder="70" />
            <MeasurementInput label="Boy" value={height} onChangeText={setHeight} unit="cm" placeholder="175" />
          </View>

          <View style={S.footer}>
            <PrimaryButton text="İleri" onPress={handleNext} />
            <TouchableOpacity style={S.skipButton} onPress={handleSkip}>
              <Text style={S.skipText}>Şimdilik geç</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterStep2;