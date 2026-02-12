import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
//PrimaryButton bileşen
import PrimaryButton from '../components/PrimaryButton';

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.content}>
        
        {/* 1. GÖRSEL ALANI */}
        <View style={styles.imageContainer}>
          {/* Buraya projemizdeki resimler gelecek */}
          <Image 
            source={{ uri: 'https://img.freepik.com/free-vector/healthy-lifestyle-concept-illustration_114360-6391.jpg?w=826&t=st=1708500000~exp=1708500600~hmac=example' }} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* 2. METİN ALANI */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Sağlıklı Yaşama{'\n'}
            <Text style={styles.titleHighlight}>Hoş Geldiniz</Text>
          </Text>
          
          <Text style={styles.description}>
            Kişisel sağlık asistanınız ile hedeflerinize ulaşın, beslenmenizi takip edin ve daha iyi hissedin.
          </Text>
        </View>

        {/* 3. BUTONLAR */}
        <View style={styles.buttonContainer}>
          {/* Başla Butonu -> Register'a gider */}
          <PrimaryButton 
            text="Başla" 
            onPress={() => navigation.navigate('Register')} 
          />

          {/* Giriş Yap Linki -> Login'e gider */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  imageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    maxHeight: 300,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111811',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  titleHighlight: {
    color: '#2f7f34', // Primary Color
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f7f34', // Primary Color
  },
});

export default WelcomeScreen;