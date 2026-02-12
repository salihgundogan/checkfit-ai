import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const AnalysisBottomSheet = () => {
  return (
    <View style={styles.container}>
      {/* Tutacak */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <View style={styles.content}>
        {/* Başlık ve Skor */}
        <View style={styles.header}>
          <View>
            <View style={styles.aiLabel}>
              <Text style={styles.aiIcon}>✨</Text>
              <Text style={styles.aiText}>YAPAY ZEKA ANALİZİ</Text>
            </View>
            <Text style={styles.foodName}>Izgara Köfte</Text>
            <Text style={styles.confidence}>Öğle Yemeği • %94 Eşleşme</Text>
          </View>
          
          <View style={styles.calorieBadge}>
            <Text style={styles.calorieValue}>350</Text>
            <Text style={styles.calorieUnit}>KCAL</Text>
          </View>
        </View>

        {/* Makrolar Grid */}
        <View style={styles.macroGrid}>
          <MacroBox label="Protein" value="22g" />
          <MacroBox label="Karb" value="12g" />
          <MacroBox label="Yağ" value="18g" />
        </View>

        {/* Butonlar */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
            <Text style={styles.editText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmIcon}>✓</Text>
            <Text style={styles.confirmText}>Onayla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const MacroBox = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.macroBox}>
    <Text style={styles.macroLabel}>{label}</Text>
    <Text style={styles.macroValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 48, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 },
  content: { padding: 24, gap: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  aiIcon: { fontSize: 14, color: '#13ec22' },
  aiText: { fontSize: 10, fontWeight: 'bold', color: '#13ec22', letterSpacing: 0.5 },
  foodName: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  confidence: { fontSize: 14, color: '#64748b', fontWeight: '500', marginTop: 2 },
  
  calorieBadge: { 
    alignItems: 'center', 
    backgroundColor: 'rgba(19, 236, 34, 0.1)', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(19, 236, 34, 0.2)' 
  },
  calorieValue: { fontSize: 20, fontWeight: 'bold', color: '#13ec22' },
  calorieUnit: { fontSize: 10, fontWeight: 'bold', color: '#13ec22', opacity: 0.8 },

  macroGrid: { flexDirection: 'row', gap: 12 },
  macroBox: { 
    flex: 1, 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    padding: 12, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  macroLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 4 },
  macroValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editButton: { 
    flex: 1, 
    height: 48, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 12, 
    gap: 8 
  },
  editIcon: { fontSize: 18 },
  editText: { fontWeight: '600', color: '#334155' },
  
  confirmButton: { 
    flex: 2, 
    height: 48, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#13ec22', 
    borderRadius: 12, 
    gap: 8,
    shadowColor: '#13ec22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmIcon: { fontSize: 18, color: '#0d1b0e', fontWeight: 'bold' },
  confirmText: { fontWeight: 'bold', color: '#0d1b0e', fontSize: 16 },
});

export default AnalysisBottomSheet;