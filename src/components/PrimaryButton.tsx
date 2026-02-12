import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    backgroundColor: '#2f7f34', // Primary Color
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2f7f34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#f9fbf9',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;