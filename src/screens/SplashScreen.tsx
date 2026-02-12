import React from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, useColorScheme,Image } from 'react-native';

const SplashScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Merkez İçerik */}
      <View style={styles.centerContent}>
        
        {/* Logo Kutusu */}
        <View style={[styles.logoContainer, isDarkMode && styles.logoContainerDark]}>
           {/* Not: Buraya Logo Tasarımımız gelecek */}
           <Image
            source={require('../assets/logo3.png')}
            style={styles.logo}
          />

        </View>

        {/* Metinler */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Wellbeing</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.textWhiteOpacity]}>
            Sağlıklı Yaşam Asistanınız
          </Text>
        </View>
      </View>

      {/* Alt Dekoratif Bölüm */}
      <View style={styles.decorativeBackground} />

      {/* Footer / Version Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, isDarkMode && styles.textWhiteOpacity]}>V 1.0.0</Text>
      </View>
      
    </View>
  );
};

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6', // Light mode bg
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerDark: {
    backgroundColor: '#112115', // Dark mode bg
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
    padding: 24,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 32,
    height: 128,
    width: 128,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 64, // Tam yuvarlak olması için height/2
    backgroundColor: 'rgba(25, 230, 77, 0.1)', // primary/10
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 77, 0.2)', // primary/20
  },
  logoContainerDark: {
    backgroundColor: 'rgba(25, 230, 77, 0.05)',
    borderColor: 'rgba(25, 230, 77, 0.1)',
  },
  logoIcon: {
    fontSize: 32, // İkonumuz gelince bu kısım kaldırılacak
    fontWeight: 'bold',
    color: '#19e64d', // Primary color
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0e1b11',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(14, 27, 17, 0.6)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textWhiteOpacity: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  decorativeBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height / 2,
    backgroundColor: 'rgba(25, 230, 77, 0.05)', 
    zIndex: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    color: 'rgba(14, 27, 17, 0.3)',
  },
  logo: {
  width: 80,
  height: 80,
  resizeMode: 'contain',
},

});

export default SplashScreen;