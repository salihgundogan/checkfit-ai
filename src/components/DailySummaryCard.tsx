import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MacroCircle from './MacroCircle';

interface DailySummaryCardProps {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ calories, carbs, protein, fat }) => (
  <View style={styles.card}>
    <View>
      <Text style={styles.label}>Günlük Toplam</Text>
      <View style={styles.valRow}>
        <Text style={styles.val}>{calories}</Text>
        <Text style={styles.unit}>kcal</Text>
      </View>
    </View>
    <View style={styles.macros}>
      <MacroCircle label="K" value={carbs} percentage={75} color="#4b7c5a" />
      <MacroCircle label="P" value={protein} percentage={60} color="#4b7c5a" />
      <MacroCircle label="Y" value={fat} percentage={30} color="#4b7c5a" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', margin: 16, borderRadius: 24, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWeight: 1, borderColor: 'rgba(0,0,0,0.05)', elevation: 2 },
  label: { color: '#677e6e', fontSize: 14, fontWeight: '500' },
  valRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  val: { fontSize: 32, fontWeight: 'bold', color: '#121614' },
  unit: { fontSize: 14, color: '#677e6e', fontWeight: '500' },
  macros: { flexDirection: 'row', gap: 12 }
});

export default DailySummaryCard;