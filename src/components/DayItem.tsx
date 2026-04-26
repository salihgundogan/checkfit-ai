import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface DayItemProps {
  label: string;
  day: number;
  isActive: boolean;
  onPress: () => void;
}

const DayItem: React.FC<DayItemProps> = ({ label, day, isActive, onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[styles.container, isActive && styles.activeContainer]}
  >
    <Text style={[styles.label, isActive && styles.activeText]}>{label}</Text>
    <Text style={[styles.day, isActive && styles.activeText]}>{day}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { width: 52, paddingVertical: 12, alignItems: 'center', borderRadius: 24, opacity: 0.5 },
  activeContainer: { backgroundColor: '#4b7c5a', opacity: 1, elevation: 8, transform: [{ scale: 1.1 }] },
  label: { fontSize: 12, fontWeight: '500', color: '#677e6e', marginBottom: 4 },
  day: { fontSize: 18, fontWeight: 'bold', color: '#121614' },
  activeText: { color: '#ffffff' },
});

export default DayItem;