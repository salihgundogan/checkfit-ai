import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MotivationCard = () => {
  return (
    <View style={styles.container}>
      {/* Arka plan dekorasyonu (Basit bir daire) */}
      <View style={styles.decorationCircle} />
      
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⭐</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Harika gidiyorsun!</Text>
          <Text style={styles.subtitle}>
            Bu hafta hedefine <Text style={styles.highlight}>%5</Text> daha yaklaştın.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fcf2', // Açık yeşil arka plan
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginTop: 16,
  },
  decorationCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(19, 236, 34, 0.1)', // Primary color opacity
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    color: '#13ec22',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#064e3b', // Koyu yeşil
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#15803d',
  },
});

export default MotivationCard;