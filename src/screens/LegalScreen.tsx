import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet, StatusBar,
} from 'react-native';
import { useTheme } from './ThemeContext';

const PRIVACY_CONTENT = `GİZLİLİK POLİTİKASI

Son güncelleme: Mayıs 2025

1. GENEL BİLGİLER
CheckFit AI olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu politika, uygulamamızı kullanırken hangi verilerin toplandığını ve nasıl kullanıldığını açıklar.

2. TOPLANAN VERİLER
- Hesap bilgileri: Ad, e-posta adresi
- Sağlık verileri: Kalori, makro besin değerleri, öğün geçmişi
- Fotoğraflar: Yalnızca analiz için kullanılır, sunucularımızda şifreli saklanır
- Cihaz bilgileri: İşletim sistemi, uygulama versiyonu

3. VERİLERİN KULLANIMI
Topladığımız veriler yalnızca şu amaçlarla kullanılır:
- Besin analizi ve kalori takibi hizmeti sunmak
- Kişiselleştirilmiş öneriler geliştirmek
- Uygulama performansını iyileştirmek
- Yasal yükümlülükleri yerine getirmek

4. VERİ GÜVENLİĞİ
Tüm verileriniz endüstri standardı AES-256 şifrelemesiyle korunmaktadır. Supabase altyapısı üzerinde güvenli şekilde barındırılmaktadır.

5. ÜÇÜNCÜ TARAFLAR
Verileriniz hiçbir koşulda üçüncü taraflara satılmaz veya pazarlama amaçlı paylaşılmaz.

6. HAKLARINIZ
- Verilerinize erişim talep edebilirsiniz
- Verilerinizin silinmesini talep edebilirsiniz
- Hesabınızı uygulama içinden kalıcı olarak silebilirsiniz

7. İLETİŞİM
Sorularınız için: checkfitai@gmail.com`;

const TERMS_CONTENT = `KULLANICI SÖZLEŞMESİ

Son güncelleme: Mayıs 2025

1. KABUL
Bu uygulamayı kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.

2. HİZMET KAPSAMI
CheckFit AI, yapay zeka destekli besin analizi ve kalori takibi hizmeti sunar. Sağlık danışmanlığı yerine geçmez.

3. KULLANICI YÜKÜMLÜLÜKLERİ
- Doğru ve güncel bilgi sağlamak
- Hesabınızın güvenliğini korumak
- Uygulamayı yasal amaçlarla kullanmak
- 13 yaşından büyük olmak

4. SINIRLAMALAR
Yapay zeka analizleri %100 doğruluk garantisi vermez. Ciddi sağlık kararlarınızda bir uzmana danışın.

5. FİKRİ MÜLKİYET
Uygulama içeriği, logoları ve yazılımı CheckFit AI'a aittir.

6. HİZMET DEĞİŞİKLİKLERİ
Hizmet koşullarını önceden bildirerek değiştirme hakkımızı saklı tutarız.

7. UYGULANACAK HUKUK
Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir.

8. İLETİŞİM
checkfitai@gmail.com`;

const LegalScreen = ({ route, navigation }: any) => {
  const { title } = route.params as { title: string };
  const { T } = useTheme();

  const isPrivacy = title.includes('Gizlilik') || title.includes('KVKK');
  const content = isPrivacy ? PRIVACY_CONTENT : TERMS_CONTENT;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: T.border, backgroundColor: T.card }]}>
        <Text style={[styles.title, { color: T.text }]}>{title}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, { backgroundColor: T.surface }]}
        >
          <Text style={{ fontSize: 18, color: T.muted, fontWeight: '600' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {content.split('\n').map((line, i) => {
          const isSectionHeader = /^\d+\./.test(line.trim()) || line === line.toUpperCase() && line.trim().length > 3;
          return (
            <Text
              key={i}
              style={[
                isSectionHeader ? styles.sectionHeader : styles.bodyText,
                { color: isSectionHeader ? T.primary : T.text },
              ]}
            >
              {line}
            </Text>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 0.5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 22, paddingTop: 20 },
  sectionHeader: {
    fontSize: 14, fontWeight: '800', marginTop: 20, marginBottom: 6, letterSpacing: 0.3,
  },
  bodyText: {
    fontSize: 14, lineHeight: 22, marginBottom: 2,
  },
});

export default LegalScreen;