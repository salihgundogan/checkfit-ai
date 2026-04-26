import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ErrorIllustration = () => {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        {/* React Native'de varsayılan ikon kütüphanesi kurmadıysan diye emoji kullanıyoruz. 
            Eğer vector-icons kullanıyorsan burayı değiştirebilirsin. */}
        <Text style={styles.icon}>📡❌</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(19, 236, 34, 0.05)', // Çok hafif yeşil arka plan (primary/5)
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    opacity: 0.8,
  },
});

export default ErrorIllustration;