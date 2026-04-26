import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FOOD_DATASET, FoodItem } from '../data/foodDataset';
import FoodListItem from '../components/FoodListItem';
import { supabase } from '../lib/supabase';

const ManualEntryScreen = ({ navigation }: any) => {
  // 1. TÜM HOOKLAR EN ÜSTTE VE SIRAYLA OLMALI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Filtreleme Hook'u
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return FOOD_DATASET;
    return FOOD_DATASET.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Toplam Hesaplama Hook'u
  const totals = useMemo(() => {
    return selectedFoods.reduce((acc, curr) => ({
      count: acc.count + 1,
      calories: acc.calories + curr.calories
    }), { count: 0, calories: 0 });
  }, [selectedFoods]);

  // 2. FONKSİYONLAR
  const handleAdd = (item: FoodItem) => {
    setSelectedFoods(prev => [...prev, item]);
  };

  const handleSave = async () => {
    if (selectedFoods.length === 0) return;
    
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      const logsToInsert = selectedFoods.map(food => ({
        user_id: user.id,
        food_name: food.name,
        calories: food.calories,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('food_logs').insert(logsToInsert);
      if (error) throw error;

      Alert.alert('Başarılı', 'Öğünler eklendi', [
        { text: 'Tamam', onPress: () => navigation.navigate('Progress') }
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. EN SON RETURN (Render işlemi)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manuel Yemek Ekle</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>İptal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={22} color="#94a3b8" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Yemek ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.list}>
        {filteredFoods.map((item, index) => (
          <FoodListItem key={`${item.id}-${index}`} item={item} onAdd={handleAdd} />
        ))}
      </ScrollView>

      {selectedFoods.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDetails}>{totals.count} Ürün • {totals.calories} kcal</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Öğünü Kaydet</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// Styles tanımları dosyanın en altında kalmalı...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  cancelBtn: { color: '#4A7C59', fontWeight: '600' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, height: 50 },
  searchInput: { flex: 1, paddingHorizontal: 10 },
  list: { flex: 1, paddingHorizontal: 16 },
  footer: { backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  summaryRow: { marginBottom: 10 },
  summaryDetails: { fontWeight: 'bold', textAlign: 'right' },
  saveButton: { backgroundColor: '#4A7C59', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { fontWeight: '800', fontSize: 16 }
});

export default ManualEntryScreen;