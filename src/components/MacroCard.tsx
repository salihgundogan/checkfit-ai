import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroCardProps {
  title: string;
  value: string;
  percentage: number; // 0 ile 100 arası
  color: string;      // Progress bar ve ikon rengi
  iconCharacter: string; // Basitlik için emoji veya karakter kullanacağız
}

const MacroCard: React.FC<MacroCardProps> = ({ title, value, percentage, color, iconCharacter }) => {
  return (
    <View style={styles.container}>
      {/* İkon Yuvarlağı */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}> 
        <Text style={[styles.iconText, { color: color }]}>{iconCharacter}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>

      {/* Progress Bar Arka Planı */}
      <View style={styles.progressBackground}>
        {/* Doluluk Oranı */}
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%', // Yan yana 3 tane sığması için
    // Gölge Efektleri
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 8,
  },
  progressBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default MacroCard;