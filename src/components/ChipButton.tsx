import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ChipButtonProps {
  label: string;
  icon: string; // Emoji
  isSelected: boolean;
  onPress: () => void;
}

const ChipButton: React.FC<ChipButtonProps> = ({ label, icon, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
      
      {isSelected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8, // Yan yana dizilim için margin
    marginBottom: 12,
    minWidth: '45%', // İkili kolon gibi durması için
    flexGrow: 1,
  },
  selectedContainer: {
    backgroundColor: 'rgba(47, 127, 52, 0.1)',
    borderColor: '#2f7f34',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  selectedLabel: {
    color: '#2f7f34',
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    backgroundColor: '#2f7f34',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default ChipButton;