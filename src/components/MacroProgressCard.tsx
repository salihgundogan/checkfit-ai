import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  carbs: number; // Yüzde
  protein: number;
  fat: number;
}

const MacroProgressCard = ({ carbs, protein, fat }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Makro Besinler</Text>
        <Text style={styles.link}>Detaylar</Text>
      </View>

      {/* Yatay Çubuk Grafik */}
      <View style={styles.barContainer}>
        <View style={[styles.barSegment, { flex: carbs, backgroundColor: '#3b82f6' }]} />
        <View style={[styles.barSegment, { flex: protein, backgroundColor: '#599a4c' }]} />
        <View style={[styles.barSegment, { flex: fat, backgroundColor: '#f97316' }]} />
      </View>

      {/* Etiketler (Lejant) */}
      <View style={styles.legendContainer}>
        <LegendItem color="#3b82f6" label="Karb" value={`${carbs}%`} />
        <LegendItem color="#599a4c" label="Protein" value={`${protein}%`} />
        <LegendItem color="#f97316" label="Yağ" value={`${fat}%`} />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label, value }: any) => (
  <View style={styles.legendItem}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '600', color: '#101b0d' },
  link: { fontSize: 14, fontWeight: '500', color: '#599a4c' },
  barContainer: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 24, backgroundColor: '#f3f4f6' },
  barSegment: { height: '100%' },
  legendContainer: { gap: 12 },
  legendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  legendValue: { fontSize: 14, fontWeight: 'bold', color: '#101b0d' },
});

export default MacroProgressCard;