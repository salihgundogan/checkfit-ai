import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface OptionCardProps {
  title: string;
  subtitle: string;
  icon: string; // Emoji kullanacağız basitlik için
  isSelected: boolean;
  onPress: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ 
  title, subtitle, icon, isSelected, onPress 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.selectedContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, isSelected && styles.selectedText]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dae5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedContainer: {
    borderColor: '#2f7f34',
    backgroundColor: 'rgba(47, 127, 52, 0.05)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f6f8f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 2,
  },
  selectedText: {
    color: '#2f7f34',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#2f7f34',
    backgroundColor: '#2f7f34',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});

export default OptionCard;