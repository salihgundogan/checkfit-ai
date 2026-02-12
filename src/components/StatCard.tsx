import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: string; // Emoji veya ikon karakteri
  iconBgColor: string;
  iconColor: string;
}

const StatCard = ({ title, value, unit, icon, iconBgColor, iconColor }: StatCardProps) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.value}>
          {value} <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    // Gölge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#94a3b8',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
});

export default StatCard;