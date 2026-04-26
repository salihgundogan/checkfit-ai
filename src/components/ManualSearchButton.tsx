import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 1. Tip tanımını buraya ekliyoruz
interface ManualSearchButtonProps {
  onPress: () => void; // Bu, "parametre almayan ve bir şey döndürmeyen bir fonksiyon" demektir.
}

// 2. Props'u bu tiple işaretliyoruz
const ManualSearchButton: React.FC<ManualSearchButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Icon name="search" size={24} color="#32d411" style={styles.icon} />
      <Text style={styles.text}>Besin adı arayarak ekle...</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  icon: { marginRight: 10 },
  text: {
    fontSize: 15,
    color: '#94a3b8',
  },
});

export default ManualSearchButton;