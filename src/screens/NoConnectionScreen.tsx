import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar,Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

// Bileşenlerimiz
import PrimaryButton from '../components/PrimaryButton';
import ErrorIllustration from '../components/ErrorIllustration';

const NoConnectionScreen = () => {
  const navigation = useNavigation();

const handleRetry = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        // Eğer internet geldiyse bir önceki sayfaya geri dön
        navigation.goBack();
      } else {
        // Hala yoksa uyar
        Alert.alert('Bağlantı Yok', 'Hala internet bağlantısı bulunamadı.');
      }
    });
  };

  const handleSettings = () => {
    // Telefonun ayarlar sayfasına yönlendirme eklenebilir
    console.log('Ayarlar açılıyor...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      {/* Üst Bar (Geri Tuşu) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {/* Ortayı boş bırakıyoruz, temiz bir görünüm için */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Ana İçerik (Ortalanmış) */}
      <View style={styles.content}>
        
        {/* 1. İllüstrasyon Bileşeni */}
        <ErrorIllustration />

        {/* 2. Metin İçeriği */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Bağlantı Kesildi</Text>
          <Text style={styles.subtitle}>
            İnternet bağlantısı kurulamadı. Lütfen ağ ayarlarınızı kontrol edip tekrar deneyin.
          </Text>
        </View>

        {/* 3. Butonlar */}
        <View style={styles.buttonContainer}>
          {/* Senin kendi PrimaryButton bileşenin */}
          <PrimaryButton text="Tekrar Dene" onPress={handleRetry} />
          
          {/* İkincil Buton (Ayarlar) */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSettings}>
            <Text style={styles.secondaryButtonText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#0e1b11',
    fontWeight: '300',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -40, // Ekranın tam ortasından hafif yukarıda durması için
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0e1b11',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4f6e55',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 16, // Butonlar arası boşluk
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  secondaryButtonText: {
    color: '#4f6e55',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NoConnectionScreen;