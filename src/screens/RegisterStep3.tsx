import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native'; // useRoute eklendi

import StepHeader from '../components/StepHeader';
import PrimaryButton from '../components/PrimaryButton';
import OptionCard from '../components/OptionCard';

const RegisterStep3 = () => {
  const navigation = useNavigation<any>();
  
  //  Önceki sayfalardan gelen veriyi yakalıyoruz
  const route = useRoute<any>();
  const { prevData } = route.params || {};

  // Aktivite seviyesi ve Hedef için state
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [showActivityModal, setShowActivityModal] = useState(false);

  //  seçenekler
  const activityOptions = [
    { label: 'Hareketsiz (Masa başı iş)', value: 'sedentary' },
    { label: 'Az Aktif (Haftada 1-2 gün)', value: 'light' },
    { label: 'Orta Aktif (Haftada 3-5 gün)', value: 'moderate' },
    { label: 'Çok Aktif (Haftada 6-7 gün)', value: 'very' },
    { label: 'Sporcu (Günde 2x antrenman)', value: 'athlete' },
  ];

  //  Verileri birleştirip bir sonraki sayfaya aktarıyoruz
  const handleNext = () => {
    navigation.navigate('RegisterStep4', {
      prevData: { 
        ...prevData, // Önceki bilgiler (Ad, Kilo, Boy...)
        activityLevel, //  aktivite
        goal //  hedef
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader currentStep={3} totalSteps={4} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Yaşam Tarzın ve Hedefin</Text>
          <Text style={styles.subtitle}>
             Aktivite seviyene ve hedeflerine göre günlük kalori ihtiyacını belirleyelim.
          </Text>
        </View>

        {/* Aktivite Seviyesi Seçimi (Modal ile) */}
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>Aktivite Seviyesi</Text>
            <TouchableOpacity 
                style={styles.selectBox} 
                onPress={() => setShowActivityModal(true)}
            >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    {/* İkon */}
                    <Text style={{fontSize:20, marginRight: 8}}>🏃</Text> 
                    <Text style={styles.selectText}>
                        {activityOptions.find(o => o.value === activityLevel)?.label}
                    </Text>
                </View>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
        </View>
        
        {/* HEDEF SEÇİMİ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Birincil Hedef</Text>
          
          <OptionCard 
            title="Kilo Ver"
            subtitle="Daha ince ve fit ol"
            icon="📉"
            isSelected={goal === 'lose'}
            onPress={() => setGoal('lose')}
          />
          
          <OptionCard 
            title="Kilo Koru"
            subtitle="Formunu ve sağlığını koru"
            icon="⚖️"
            isSelected={goal === 'maintain'}
            onPress={() => setGoal('maintain')}
          />
          
          <OptionCard 
            title="Kilo Al"
            subtitle="Kas ve hacim kazan"
            icon="💪"
            isSelected={goal === 'gain'}
            onPress={() => setGoal('gain')}
          />
        </View>
        
        {/* Boşluk bırakalım ki buton altta kalmasın */}
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* FOOTER - Sabit Buton */}
      <View style={styles.footer}>
        <PrimaryButton text="İleri" onPress={handleNext} />
      </View>

      {/* AKTİVİTE SEÇİM MODALI */}
      <Modal visible={showActivityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Aktivite Seviyeni Seç</Text>
                {activityOptions.map((opt) => (
                    <TouchableOpacity 
                        key={opt.value} 
                        style={styles.modalOption}
                        onPress={() => {
                            setActivityLevel(opt.value);
                            setShowActivityModal(false);
                        }}
                    >
                        <Text style={[
                            styles.modalOptionText, 
                            activityLevel === opt.value && styles.modalOptionTextActive
                        ]}>
                            {opt.label}
                        </Text>
                        {activityLevel === opt.value && <Text style={{color:'#2f7f34'}}>✓</Text>}
                    </TouchableOpacity>
                ))}
                <TouchableOpacity 
                    style={styles.modalClose} 
                    onPress={() => setShowActivityModal(false)}
                >
                    <Text style={{color:'#666'}}>Kapat</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  content: { padding: 24 },
  headerTextContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111811', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', lineHeight: 24 },
  
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#111811', marginBottom: 12, marginLeft: 4 },
  
  // Select Box Stilleri
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5dc',
    borderRadius: 12,
    padding: 16,
    height: 60
  },
  selectText: { fontSize: 16, color: '#111811' },
  chevron: { color: '#9ca3af', fontSize: 12 },

  // Footer Stilleri
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: 'rgba(246, 248, 246, 0.95)',
  },

  // Modal Stilleri
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' },
  modalOptionText: { fontSize: 16, color: '#333' },
  modalOptionTextActive: { color: '#2f7f34', fontWeight: 'bold' },
  modalClose: { marginTop: 16, alignItems: 'center', padding: 12 },
});

export default RegisterStep3;