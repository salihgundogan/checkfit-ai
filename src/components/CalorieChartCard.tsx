import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  calories: number;
}

const CalorieChartCard = ({ calories }: Props) => {
  // Grafik verilerini simüle ediyoruz
  const dataPoints = [40, 60, 30, 80, 50, 70, 45]; 
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kalori Alımı</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{calories}</Text>
            <Text style={styles.unit}>kcal</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>📉</Text>
          <Text style={styles.badgeText}>-5%</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Barlar ve Noktalar */}
        <View style={styles.barsContainer}>
          {dataPoints.map((point, index) => (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.barPoint, { bottom: point }]} />
              <View style={[styles.barFill, { height: point }]} />
              <Text style={styles.dayText}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 16, fontWeight: '600', color: '#101b0d' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  value: { fontSize: 32, fontWeight: 'bold', color: '#101b0d', tracking: -1 },
  unit: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(50, 212, 17, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#599a4c' },
  chartContainer: { height: 120, position: 'relative', justifyContent: 'flex-end' },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', paddingHorizontal: 5 },
  barWrapper: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: 30 },
  barPoint: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#599a4c', position: 'absolute', zIndex: 10, marginBottom: -4 },
  barFill: { width: 4, backgroundColor: 'rgba(89, 154, 76, 0.2)', marginBottom: 24, borderRadius: 2 },
  dayText: { fontSize: 12, color: '#6b7280', fontWeight: '500', position: 'absolute', bottom: 0 },
});

export default CalorieChartCard;