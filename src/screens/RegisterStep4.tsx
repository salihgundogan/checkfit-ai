import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

import StepHeader from '../components/StepHeader';
import PrimaryButton from '../components/PrimaryButton';
import ChipButton from '../components/ChipButton';
import { useTheme } from './ThemeContext';

const RegisterStep4 = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { prevData } = route.params || {};

  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const { T, darkMode } = useTheme();

  const toggleSelection = (list: string[], setList: any, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = async () => {
    if (!isAgreed) {
      Alert.alert('Onay Gerekli', 'Lütfen kayıt işlemine devam etmek için Gizlilik Sözleşmesi ve KVKK metnini onaylayın.');
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: prevData.email,
        password: prevData.password,
      });
      if (authError) throw authError;
      if (!user) throw new Error("Kullanıcı oluşturulamadı ID bulunamadı.");

      let avatarUrl = null;
      if (prevData.avatarBase64) {
        try {
          const fileName = `avatar_${Date.now()}.jpg`;
          const filePath = `${user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, decode(prevData.avatarBase64), {
              contentType: 'image/jpeg',
              upsert: true
            });
          if (!uploadError) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatarUrl = data.publicUrl;
          }
        } catch (imgErr) {
          console.log('Resim işleme hatası:', imgErr);
        }
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: prevData.fullName,
        pref_name: prevData.prefName,
        dob: prevData.dob,
        gender: prevData.gender,
        height: parseFloat(prevData.height || '0'),
        weight: parseFloat(prevData.weight || '0'),
        activity_level: prevData.activityLevel,
        goal: prevData.goal,
        allergies: allergies,
        conditions: conditions,
        avatar_url: avatarUrl,
      });
      if (profileError) throw profileError;

      Alert.alert('Tebrikler!', 'Hesabınız başarıyla oluşturuldu. Lütfen giriş yapınız.', [
        { text: 'Giriş Yap', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Kayıt Hatası', error.message || 'Bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(T);

  return (
    <SafeAreaView style={styles.container}>
      <StepHeader currentStep={4} totalSteps={4} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Son Adım: Sağlık</Text>
          <Text style={styles.subtitle}>Herhangi bir hassasiyetin var mı?</Text>
        </View>

        {/* ALERJİLER */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>⚠️ Alerjiler</Text>
          <View style={styles.chipContainer}>
            <ChipButton label="Gluten" icon="🍞" isSelected={allergies.includes('Gluten')} onPress={() => toggleSelection(allergies, setAllergies, 'Gluten')} />
            <ChipButton label="Fıstık" icon="🥜" isSelected={allergies.includes('Fıstık')} onPress={() => toggleSelection(allergies, setAllergies, 'Fıstık')} />
            <ChipButton label="Laktoz" icon="🥛" isSelected={allergies.includes('Laktoz')} onPress={() => toggleSelection(allergies, setAllergies, 'Laktoz')} />
            <ChipButton label="Deniz Ürünleri" icon="🦐" isSelected={allergies.includes('Deniz')} onPress={() => toggleSelection(allergies, setAllergies, 'Deniz')} />
          </View>
        </View>

        {/* HASTALIKLAR */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🏥 Kronik Durumlar</Text>
          <View style={styles.chipContainer}>
            <ChipButton label="Diyabet" icon="🩸" isSelected={conditions.includes('Diyabet')} onPress={() => toggleSelection(conditions, setConditions, 'Diyabet')} />
            <ChipButton label="Hipertansiyon" icon="❤️" isSelected={conditions.includes('Hipertansiyon')} onPress={() => toggleSelection(conditions, setConditions, 'Hipertansiyon')} />
            <ChipButton label="Çölyak" icon="🌾" isSelected={conditions.includes('Çölyak')} onPress={() => toggleSelection(conditions, setConditions, 'Çölyak')} />
            <ChipButton label="İnsülin Direnci" icon="💉" isSelected={conditions.includes('Insulin')} onPress={() => toggleSelection(conditions, setConditions, 'Insulin')} />
          </View>
        </View>

        {/* YASAL ONAY KUTUSU */}
        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={[styles.checkbox, isAgreed && styles.checkboxChecked]}
            onPress={() => setIsAgreed(!isAgreed)}
          >
            {isAgreed && <Text style={styles.checkIcon}>✓</Text>}
          </TouchableOpacity>

          <View style={styles.agreementTextContainer}>
            <Text style={styles.agreementText}>
              Hesabımı oluşturarak{' '}
              <Text style={styles.linkText} onPress={() => setShowPrivacyModal(true)}>Gizlilik Sözleşmesi</Text>
              {' ve '}
              <Text style={styles.linkText} onPress={() => setShowKvkkModal(true)}>KVKK Aydınlatma Metni</Text>
              'ni okudum ve onaylıyorum.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            text={loading ? "Hesap Oluşturuluyor..." : "Hesabı Oluştur"}
            onPress={handleFinish}
          />
        </View>
      </ScrollView>

      {/* GİZLİLİK MODALI */}
      <Modal visible={showPrivacyModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gizlilik Sözleşmesi</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.legalText}>
              **GİZLİLİK SÖZLEŞMESİ**{'\n\n'}
              1. **Veri Toplama:** CheckFitAI ("Uygulama") olarak, hizmetlerimizi sunmak amacıyla adınız, e-posta adresiniz, doğum tarihiniz ve sağlık verileriniz (boy, kilo, aktivite düzeyi) gibi kişisel bilgilerinizi topluyoruz.{'\n\n'}
              2. **Veri Kullanımı:** Toplanan veriler, size özel diyet programları oluşturmak, kalori takibi sağlamak ve uygulama deneyimini kişiselleştirmek amacıyla kullanılır.{'\n\n'}
              3. **Veri Paylaşımı:** Kişisel verileriniz, yasal zorunluluklar haricinde üçüncü taraflarla paylaşılmaz.{'\n\n'}
              4. **Veri Güvenliği:** Verileriniz güvenli sunucularda saklanmakta olup, yetkisiz erişime karşı korunmaktadır.{'\n\n'}
              5. **Kullanıcı Hakları:** Dilediğiniz zaman hesabınızı silebilir ve verilerinizin imhasını talep edebilirsiniz.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* KVKK MODALI */}
      <Modal visible={showKvkkModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>KVKK Aydınlatma Metni</Text>
            <TouchableOpacity onPress={() => setShowKvkkModal(false)}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.legalText}>
              **KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ**{'\n\n'}
              Veri sorumlusu sıfatıyla CheckFitAI olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("Kanun") uyarınca, kişisel verileriniz aşağıda açıklanan kapsamda işlenebilecektir.{'\n\n'}
              **1. Kişisel Verilerin İşlenme Amacı:**{'\n'}
              Sağlık ve diyet hizmetlerinin yürütülmesi, kullanıcı kayıtlarının oluşturulması ve iletişim faaliyetlerinin yürütülmesi.{'\n\n'}
              **2. Kişisel Veri Toplama Yöntemi:**{'\n'}
              Verileriniz, mobil uygulama üzerinden elektronik ortamda toplanmaktadır.{'\n\n'}
              **3. İlgili Kişinin Hakları:**{'\n'}
              Kanun'un 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını öğrenme, eksik/yanlış işlenmişse düzeltilmesini isteme haklarına sahipsiniz.{'\n\n'}
              Uygulamamızı kullanarak bu şartları kabul etmiş sayılırsınız.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (T: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 24, paddingBottom: 100 },
  headerTextContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: T.text },
  subtitle: { fontSize: 16, color: T.muted, lineHeight: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },

  // YASAL METİN STİLLERİ
  agreementContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 32, marginTop: 8 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: T.border,
    marginRight: 12, justifyContent: 'center', alignItems: 'center',
    backgroundColor: T.card,
  },
  checkboxChecked: { backgroundColor: T.primary, borderColor: T.primary },
  checkIcon: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  agreementTextContainer: { flex: 1 },
  agreementText: { fontSize: 13, color: T.muted, lineHeight: 20 },
  linkText: { color: T.primary, fontWeight: 'bold', textDecorationLine: 'underline' },

  footer: { marginTop: 'auto', gap: 12 },

  // MODAL STİLLERİ
  modalContainer: { flex: 1, backgroundColor: T.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: T.text },
  closeText: { color: T.primary, fontSize: 16, fontWeight: '600' },
  modalScroll: { padding: 24 },
  legalText: { fontSize: 14, color: T.text, lineHeight: 22, paddingBottom: 40 },
});

export default RegisterStep4;