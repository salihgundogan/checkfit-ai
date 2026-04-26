import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: string;
  iconColor: string;
  title: string;
  value: string;
  unit?: string;
}

const ExtraStatCard = ({ icon, iconColor, title, value, unit }: Props) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>
        {value} {unit && <Text style={styles.unit}>{unit}</Text>}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  icon: { fontSize: 18 },
  title: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 20, fontWeight: 'bold', color: '#101b0d' },
  unit: { fontSize: 14, fontWeight: 'normal', color: '#6b7280' },
});

export default ExtraStatCard;