import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import FoodListItem from '../components/FoodListItem';

const ManualFoodScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manuel Yemek Ekle</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
                style={styles.input}
                placeholder="Yemek veya besin ara..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
            />
        </View>
      </View>

      {/* Liste */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sık Kullanılanlar</Text>
        </View>

        <FoodListItem name="Haşlanmış Yumurta" detail="1 adet (Büyük) - 78 kcal" icon="🥚" />
        <FoodListItem name="Yulaf Ezmesi" detail="1 Kase (Su ile) - 150 kcal" icon="🥣" />
        <FoodListItem name="Tam Buğday Ekmeği" detail="1 Dilim - 69 kcal" icon="🍞" />
        <FoodListItem name="Avokado" detail="Yarım - 160 kcal" icon="🥑" />
        <FoodListItem name="Beyaz Peynir" detail="30g (Kibrit kutusu) - 93 kcal" icon="🧀" />
        <FoodListItem name="Muz" detail="1 Orta Boy - 105 kcal" icon="🍌" />
      </ScrollView>

      {/* Alt Özet Çubuğu */}
      <View style={styles.footer}>
        <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Özet</Text>
            <Text style={styles.summaryValue}>2 Ürün • 228 kcal</Text>
        </View>
        <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveText}>Öğünü Kaydet</Text>
            <Text style={styles.checkIcon}>✓</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f6f8f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#4c9a51' },

  searchContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 20, color: '#4c9a51', marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', height: '100%' },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionHeader: { 
    backgroundColor: 'rgba(246, 248, 246, 0.95)', 
    paddingVertical: 12, 
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0d1b0e' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  summaryInfo: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  summaryLabel: { fontSize: 14, fontWeight: '500', color: '#0d1b0e' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#0d1b0e' },
  
  saveButton: {
    height: 56,
    backgroundColor: '#13ec22',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#13ec22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { fontSize: 18, fontWeight: 'bold', color: '#0d1b0e' },
  checkIcon: { fontSize: 20, fontWeight: 'bold', color: '#0d1b0e' },
});

export default ManualFoodScreen;