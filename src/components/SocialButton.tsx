import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, View, ImageSourcePropType } from 'react-native';

// 1. TİP TANIMLAMASI (INTERFACE)
// Bileşenimizin hangi özellikleri alacağını burada belirtiyoruz
interface SocialButtonProps {
  text: string;                // Yazı olmalı
  provider: 'google' | 'apple'; 
  onPress: () => void;         // Bir fonksiyon 
}

// Görselleri require ile alıyoruz
const googleLogo = require('../assets/google.png');
const appleLogo = require('../assets/apple.png');

// 2. TİPİ BİLEŞENE EKLEME (: React.FC<SocialButtonProps>)
const SocialButton: React.FC<SocialButtonProps> = ({ text, provider, onPress }) => {
  
  const getIcon = (): ImageSourcePropType | null => {
    if (provider === 'google') return googleLogo;
    if (provider === 'apple') return appleLogo;
    return null;
  };

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.iconContainer}>
        {/* getIcon()'dan null dönebilme ihtimaline karşı kontrol veya varsayılan değer */}
        {getIcon() && <Image source={getIcon() as ImageSourcePropType} style={styles.icon} resizeMode="contain" />}
      </View>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    height: 56,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
    textAlign: 'center',
  },
});

export default SocialButton;