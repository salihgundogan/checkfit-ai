import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface MacroCircleProps {
  label: string;
  value: number;
  percentage: number; // 0-100 arası
  color: string;
}

const MacroCircle: React.FC<MacroCircleProps> = ({ label, value, percentage, color }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width="40" height="40" viewBox="0 0 36 36">
          <Circle cx="18" cy="18" r={radius} stroke="#f1f5f9" strokeWidth="3" fill="none" />
          <Circle 
            cx="18" cy="18" r={radius} stroke={color} strokeWidth="3" 
            fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" transform="rotate(-90 18 18)"
          />
        </Svg>
        <Text style={styles.innerLabel}>{label}</Text>
      </View>
      <Text style={styles.valueText}>{value}g</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  svgWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  innerLabel: { position: 'absolute', fontSize: 10, fontWeight: 'bold', color: '#121614' },
  valueText: { fontSize: 11, fontWeight: '600', color: '#677e6e' },
});

export default MacroCircle;