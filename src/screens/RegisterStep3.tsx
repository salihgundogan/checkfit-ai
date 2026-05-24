import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from './ThemeContext';

import StepHeader from '../components/StepHeader';
import PrimaryButton from '../components/PrimaryButton';
import OptionCard from '../components/OptionCard';

const activityOptions = [
  { label: 'Hareketsiz (Masa başı iş)',       value: 'sedentary' },
  { label: 'Az Aktif (Haftada 1-2 gün)',       value: 'light'     },
  { label: 'Orta Aktif (Haftada 3-5 gün)',     value: 'moderate'  },
  { label: 'Çok Aktif (Haftada 6-7 gün)',      value: 'very'      },
  { label: 'Sporcu (Günde 2x antrenman)',       value: 'athlete'   },
];

const RegisterStep3 = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { prevData } = route.params || {};
  const { T, darkMode } = useTheme();

  const [activityLevel, setActivityLevel]       = useState('moderate');
  const [goal, setGoal]                         = useState('maintain');
  const [showActivityModal, setShowActivityModal] = useState(false);

  const S = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    content:   { padding: 24 },

    headerTextContainer: { marginBottom: 24 },
    title:    { fontSize: 28, fontWeight: 'bold', color: T.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: T.muted, lineHeight: 24 },

    section:      { marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 12, marginLeft: 4 },

    selectBox: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
      borderRadius: 12, padding: 16, height: 60,
    },
    selectText: { fontSize: 16, color: T.text },
    chevron:    { color: T.muted, fontSize: 12 },

    footer: {
      position: 'absolute', bottom: 0, width: '100%',
      padding: 24, backgroundColor: T.bg,
      borderTopWidth: 0.5, borderTopColor: T.border,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: T.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: T.text, marginBottom: 16, textAlign: 'center' },
    modalOption: {
      paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: T.border,
      flexDirection: 'row', justifyContent: 'space-between',
    },
    modalOptionText:       { fontSize: 16, color: T.text },
    modalOptionTextActive: { color: T.primary, fontWeight: 'bold' },
    modalClose: { marginTop: 16, alignItems: 'center', padding: 12 },
    modalCloseText: { color: T.muted, fontWeight: '600' },
  }), [T]);

  const handleNext = () => {
    navigation.navigate('RegisterStep4', {
      prevData: { ...prevData, activityLevel, goal },
    });
  };

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />
      <StepHeader currentStep={3} totalSteps={4} />

      <ScrollView contentContainerStyle={S.content}>
        <View style={S.headerTextContainer}>
          <Text style={S.title}>Yaşam Tarzın ve Hedefin</Text>
          <Text style={S.subtitle}>
            Aktivite seviyene ve hedeflerine göre günlük kalori ihtiyacını belirleyelim.
          </Text>
        </View>

        {/* Aktivite Seviyesi */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Aktivite Seviyesi</Text>
          <TouchableOpacity style={S.selectBox} onPress={() => setShowActivityModal(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🏃</Text>
              <Text style={S.selectText}>
                {activityOptions.find(o => o.value === activityLevel)?.label}
              </Text>
            </View>
            <Text style={S.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Hedef Seçimi */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Birincil Hedef</Text>
          <OptionCard title="Kilo Ver"  subtitle="Daha ince ve fit ol"       icon="📉" isSelected={goal === 'lose'}     onPress={() => setGoal('lose')}     />
          <OptionCard title="Kilo Koru" subtitle="Formunu ve sağlığını koru" icon="⚖️" isSelected={goal === 'maintain'} onPress={() => setGoal('maintain')} />
          <OptionCard title="Kilo Al"   subtitle="Kas ve hacim kazan"        icon="💪" isSelected={goal === 'gain'}     onPress={() => setGoal('gain')}     />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={S.footer}>
        <PrimaryButton text="İleri" onPress={handleNext} />
      </View>

      {/* Aktivite Modal */}
      <Modal visible={showActivityModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <Text style={S.modalTitle}>Aktivite Seviyeni Seç</Text>
            {activityOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={S.modalOption}
                onPress={() => { setActivityLevel(opt.value); setShowActivityModal(false); }}
              >
                <Text style={[S.modalOptionText, activityLevel === opt.value && S.modalOptionTextActive]}>
                  {opt.label}
                </Text>
                {activityLevel === opt.value && <Text style={{ color: T.primary }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={S.modalClose} onPress={() => setShowActivityModal(false)}>
              <Text style={S.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisterStep3;