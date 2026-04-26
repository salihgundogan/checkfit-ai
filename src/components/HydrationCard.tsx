import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const HydrationCard = () => {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.leftContent}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>💧</Text>
        </View>
        <View>
          <Text style={styles.title}>Su Tüketimi</Text>
          <Text style={styles.value}>Ortalama: 2.1 Litre</Text>
        </View>
      </View>
      <View style={styles.arrowBox}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  leftContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 24, color: '#3b82f6' },
  title: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#101b0d', marginTop: 2 },
  arrowBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  arrow: { fontSize: 20, color: '#9ca3af', fontWeight: '300' },
});

export default HydrationCard;