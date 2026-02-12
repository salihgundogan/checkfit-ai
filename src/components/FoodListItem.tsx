import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface FoodItemProps {
  name: string;
  detail: string;
  icon: string;
}

const FoodListItem = ({ name, detail, icon }: FoodItemProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e7f3e8', // Light green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 24 },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#0d1b0e', marginBottom: 2 },
  detail: { fontSize: 14, color: '#4c9a51', fontWeight: '500' },
  
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7f3e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: { fontSize: 24, color: '#13ec22', fontWeight: 'bold' },
});

export default FoodListItem;