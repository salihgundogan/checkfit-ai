import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface MeasurementInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit: string; // 'kg' veya 'cm'
  placeholder: string;
}

const MeasurementInput: React.FC<MeasurementInputProps> = ({ 
  label, value, onChangeText, unit, placeholder 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5dc',
    borderRadius: 12,
    height: 64,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111811',
    height: '100%',
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default MeasurementInput;