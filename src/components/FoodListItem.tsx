import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  item: any;
  onAdd: (item: any) => void;
}

const FoodListItem = ({ item, onAdd }: Props) => (
  <View style={styles.card}>
    <View style={styles.iconContainer}>
      <Icon name={item.icon || 'restaurant'} size={24} color="#4A7C59" />
    </View>
    <View style={styles.infoContainer}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>{item.servingSize} - {item.calories} kcal</Text>
    </View>
    <TouchableOpacity style={styles.addButton} onPress={() => onAdd(item)}>
      <Icon name="add" size={24} color="#4A7C59" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#e7f3e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#0d1b0e' },
  details: { fontSize: 13, color: '#4c9a51', marginTop: 2 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7f3e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FoodListItem;