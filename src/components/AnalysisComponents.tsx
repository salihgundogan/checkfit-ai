import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Makro kutucuğu (Protein, Karb, Yağ için)
export const MacroBox = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.macroBox}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>{value}</Text>
  </View>
);

// Ana aksiyon butonları
export const ActionButtons = ({ onEdit, onConfirm }: { onEdit: () => void, onConfirm: () => void }) => (
  <View style={styles.actions}>
    <TouchableOpacity style={styles.editButton} onPress={onEdit} activeOpacity={0.7}>
      <Text style={styles.editButtonText}>Düzenle</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.8}>
      <Text style={styles.confirmButtonText}>Onayla</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  macroBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  macroLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: '500' },
  macroValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editButtonText: { color: '#475569', fontWeight: '600', fontSize: 16 },
  confirmButton: {
    flex: 2,
    height: 56,
    backgroundColor: '#32d411',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#32d411',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});