import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ActivityProps {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  iconBgColor: string
}

const RecentActivityItem = ({ title, subtitle, icon, iconBg, iconColor }: ActivityProps) => {
  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#cbd5e1',
    fontWeight: '300',
  },
});

export default RecentActivityItem;