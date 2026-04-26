import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  SafeAreaView, Alert, Dimensions, Platform, StatusBar, ImageBackground,
  Modal, TextInput, ScrollView, KeyboardAvoidingView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InferenceSession } from 'onnxruntime-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import { runFoodInference } from '../utils/modelHelper';
import { supabase } from '../lib/supabase';

const { height } = Dimensions.get('window');

// ─── Edamam (Model sütunu) ───────────────────────────────────
const EDAMAM_APP_ID  = '286a7048';
const EDAMAM_APP_KEY = '55831be4f127c715af66a276de5d837f';

type Nutrition = { calories: number; protein: number; fat: number; carbs: number };
type SearchResult = Nutrition & { id: string; label: string };

async function searchEdamam(query: string): Promise<SearchResult[]> {
  try {
    const url =
      `https://api.edamam.com/api/food-database/v2/parser` +
      `?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}` +
      `&ingr=${encodeURIComponent(query)}&nutrition-type=cooking`;
    const res  = await fetch(url);
    const data = await res.json();
    return (data?.hints || []).slice(0, 6).map((h: any) => ({
      id:       h.food.foodId,
      label:    h.food.label,
      calories: Math.round(h.food.nutrients?.ENERC_KCAL || 0),
      protein:  Math.round((h.food.nutrients?.PROCNT || 0) * 10) / 10,
      fat:      Math.round((h.food.nutrients?.FAT    || 0) * 10) / 10,
      carbs:    Math.round((h.food.nutrients?.CHOCDF || 0) * 10) / 10,
    }));
  } catch { return []; }
}

// ─── OpenFoodFacts (İnternet sütunu) ────────────────────────
async function searchOpenFoodFacts(query: string): Promise<Nutrition | null> {
  try {
    const url =
      `https://world.openfoodfacts.org/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5`;
    const res  = await fetch(url);
    const data = await res.json();
    const products = (data?.products || []).filter(
      (p: any) => p.nutriments && p.nutriments['energy-kcal_100g']
    );
    if (products.length === 0) return null;
    const p = products[0].nutriments;
    return {
      calories: Math.round(p['energy-kcal_100g']        || 0),
      protein:  Math.round((p['proteins_100g']          || 0) * 10) / 10,
      fat:      Math.round((p['fat_100g']               || 0) * 10) / 10,
      carbs:    Math.round((p['carbohydrates_100g']     || 0) * 10) / 10,
    };
  } catch { return null; }
}

// Edamam ile de bul (düzenleme modalı araması için)
async function searchFood(query: string): Promise<SearchResult[]> {
  return searchEdamam(query);
}

// ─── Makro karşılaştırma satırı ─────────────────────────────
const CompareRow = ({
  label, modelVal, internetVal, unit = 'g', highlight,
}: {
  label: string; modelVal: number; internetVal: number; unit?: string; highlight?: boolean;
}) => (
  <View style={[cmpStyles.row, highlight && cmpStyles.rowHighlight]}>
    <Text style={cmpStyles.label}>{label}</Text>
    <View style={cmpStyles.valBox}>
      <Text style={cmpStyles.modelVal}>{modelVal}{unit}</Text>
    </View>
    <Icon name="compare-arrows" size={16} color="#94a3b8" style={{ marginHorizontal: 4 }} />
    <View style={cmpStyles.valBox}>
      <Text style={cmpStyles.netVal}>{internetVal}{unit}</Text>
    </View>
  </View>
);

const cmpStyles = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  rowHighlight: { backgroundColor: '#f0fdf4', borderRadius: 10 },
  label:        { flex: 1, fontSize: 13, fontWeight: '600', color: '#64748b' },
  valBox:       { width: 70, alignItems: 'center' },
  modelVal:     { fontSize: 14, fontWeight: '700', color: '#6366f1' },
  netVal:       { fontSize: 14, fontWeight: '700', color: '#4A7C59' },
});
// ────────────────────────────────────────────────────────────

const AnalysisScreen: React.FC<NativeStackScreenProps<any, 'Analysis'>> = ({ route, navigation }) => {
  const { imageUri } = route.params;

  const [session,        setSession]        = useState<InferenceSession | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);

  // Model tahmini yemek adı (ONNX çıktısı) — değişmez
  const [modelName,      setModelName]      = useState<string | null>(null);

  // 🤖 Model sütunu: Edamam'dan gelen değerler
  const [modelNutrition, setModelNutrition] = useState<Nutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });

  // 🌐 İnternet sütunu: OpenFoodFacts'ten gelen değerler
  const [internetNutrition, setInternetNutrition] = useState<Nutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [internetLoaded, setInternetLoaded] = useState(false);

  // Kullanıcının görmek / kaydetmek istediği yemek adı
  const [foodName,       setFoodName]       = useState<string | null>(null);

  // Düzenleme modal
  const [editVisible,    setEditVisible]    = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [searching,      setSearching]      = useState(false);
  const [editName,       setEditName]       = useState('');
  const [editCal,        setEditCal]        = useState('');
  const [editProtein,    setEditProtein]    = useState('');
  const [editFat,        setEditFat]        = useState('');
  const [editCarbs,      setEditCarbs]      = useState('');

  // Özel düzenleme değerleri (custom source)
  const [customNutrition, setCustomNutrition] = useState<Nutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });

  // Hangi kaynak seçili: 'model' | 'internet' | 'custom'
  const [selectedSource, setSelectedSource] = useState<'model' | 'internet' | 'custom'>('internet');

  const searchTimeout = useRef<any>(null);

  // 1. ONNX modeli yükle
  useEffect(() => {
    (async () => {
      try {
        const modelFileName = 'food_model.onnx';
        const destPath = `${RNFS.DocumentDirectoryPath}/${modelFileName}`;
        if (!(await RNFS.exists(destPath))) await RNFS.copyFileAssets(modelFileName, destPath);
        const sess = await InferenceSession.create(`file://${destPath}`);
        setSession(sess);
      } catch (e) {
        console.error('Model yükleme hatası:', e);
        setLoading(false);
      }
    })();
  }, []);

  // 2. ONNX → yemek adı → Edamam + OpenFoodFacts (paralel)
  useEffect(() => {
    if (!session || !imageUri || modelName) return;
    (async () => {
      try {
        const tahmin = await runFoodInference(imageUri, session);
        const temiz  = tahmin
          ? tahmin.replace(/SONUÇ:\s*/i, '').split(' ')[0].split('\n')[0].trim()
          : 'Belirlenemedi';

        setModelName(temiz);
        setFoodName(temiz);

        if (temiz !== 'Belirlenemedi') {
          // İki API'yi paralel çağır
          const [edamamResults, offResult] = await Promise.all([
            searchEdamam(temiz),
            searchOpenFoodFacts(temiz),
          ]);

          // 🤖 Model sütunu ← Edamam ilk sonuç
          if (edamamResults.length > 0) {
            const e = edamamResults[0];
            setModelNutrition({
              calories: e.calories,
              protein:  e.protein,
              fat:      e.fat,
              carbs:    e.carbs,
            });
          } else {
            // Edamam sonuç vermezse fallback
            setModelNutrition({ calories: 250, protein: 10, fat: 8, carbs: 30 });
          }

          // 🌐 İnternet sütunu ← OpenFoodFacts
          if (offResult) {
            setInternetNutrition(offResult);
          } else {
            // OFF sonuç vermezse Edamam'ın 2. sonucunu dene, yoksa fallback
            const fallback = edamamResults[1] ?? edamamResults[0];
            setInternetNutrition(fallback
              ? { calories: fallback.calories, protein: fallback.protein, fat: fallback.fat, carbs: fallback.carbs }
              : { calories: 250, protein: 10, fat: 8, carbs: 30 }
            );
          }

          setInternetLoaded(true);
        }
      } catch {
        setModelName('Hata');
        setFoodName('Hata');
      } finally {
        setLoading(false);
      }
    })();
  }, [session, imageUri]);

  // Seçilen kaynağa göre aktif besin değeri
  const activeNutrition: Nutrition =
    selectedSource === 'model'    ? modelNutrition    :
    selectedSource === 'internet' ? internetNutrition :
    customNutrition; // custom

  // Düzenle modalı aç
  const openEdit = () => {
    // Modal alanlarını şu an seçili kaynakla doldur
    const current = activeNutrition;
    setEditName(foodName || '');
    setEditCal(String(current.calories));
    setEditProtein(String(current.protein));
    setEditFat(String(current.fat));
    setEditCarbs(String(current.carbs));
    setSearchQuery('');
    setSearchResults([]);
    setEditVisible(true);
  };

  // Arama (debounced)
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchFood(text);
      setSearchResults(results);
      setSearching(false);
    }, 500);
  };

  const selectResult = (item: SearchResult) => {
    setEditName(item.label);
    setEditCal(String(item.calories));
    setEditProtein(String(item.protein));
    setEditFat(String(item.fat));
    setEditCarbs(String(item.carbs));
    setSearchResults([]);
    setSearchQuery(item.label);
  };

  const applyEdit = () => {
    const custom: Nutrition = {
      calories: parseFloat(editCal)     || 0,
      protein:  parseFloat(editProtein) || 0,
      fat:      parseFloat(editFat)     || 0,
      carbs:    parseFloat(editCarbs)   || 0,
    };
    setFoodName(editName);
    setCustomNutrition(custom);
    setSelectedSource('custom');
    setEditVisible(false);
  };

  // Supabase kaydet
  const handleSave = async () => {
    if (!foodName || foodName === 'Hata' || foodName === 'Belirlenemedi') return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
      const fileData = await RNFS.readFile(imageUri, 'base64');
      const { error: upErr } = await supabase.storage
        .from('meal-photos')
        .upload(fileName, decode(fileData), { contentType: 'image/jpeg', upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('meal-photos').getPublicUrl(fileName);
      const { error: dbErr } = await supabase.from('meals').insert([{
        user_id:  user.id,
        name:     foodName,
        image_url: publicUrl,
        calories: activeNutrition.calories,
        protein:  activeNutrition.protein,
        fat:      activeNutrition.fat,
        carbs:    activeNutrition.carbs,
        ingredients: [],
      }]);
      if (dbErr) throw dbErr;

      Alert.alert('Başarılı', `${foodName} günlüğüne eklendi!`,
        [{ text: 'Tamam', onPress: () => navigation.navigate('Progress') }]);
    } catch (err: any) {
      Alert.alert('Kayıt Başarısız', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" transparent backgroundColor="transparent" />

      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="arrow-back-ios" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Öğününü Tanı</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <View style={styles.imgArea}>
        <ImageBackground source={{ uri: imageUri }} style={styles.bgImg} imageStyle={{ borderRadius: 32 }}>
          <View style={styles.overlay}>
            <View style={styles.cornersRow}>
              <View style={[styles.corner, { borderTopWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.corner, { borderTopWidth: 4, borderRightWidth: 4 }]} />
            </View>
            <View style={styles.tag}>
              <Icon name="videocam" size={16} color="#fff" />
              <Text style={styles.tagText}>YEMEK ALGILANDI</Text>
            </View>
            <View style={styles.cornersRow}>
              <View style={[styles.corner, { borderBottomWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.corner, { borderBottomWidth: 4, borderRightWidth: 4 }]} />
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>

            {/* Yemek adı + kalori */}
            <View style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.aiBadge}>
                  <Icon name="auto-awesome" size={14} color="#4A7C59" />
                  <Text style={styles.aiText}>YAPAY ZEKA ANALİZİ</Text>
                </View>
                <Text style={styles.foodName}>
                  {loading ? 'Analiz ediliyor...' : (foodName ?? 'Belirlenemedi')}
                </Text>
              </View>
              <View style={styles.kcalBox}>
                <Text style={styles.kcalVal}>{loading ? '...' : activeNutrition.calories}</Text>
                <Text style={styles.kcalUnit}>kcal</Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#4A7C59" style={{ marginVertical: 20 }} />
            ) : (
              <>
                {/* ── Karşılaştırma tablosu ── */}
                <View style={styles.compareCard}>
                  {/* Başlık satırı */}
                  <View style={[cmpStyles.row, { marginBottom: 4 }]}>
                    <Text style={[cmpStyles.label, { color: '#1e293b', fontWeight: '800' }]}>Değer</Text>
                    <View style={cmpStyles.valBox}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#6366f1' }}>🤖 Edamam</Text>
                    </View>
                    <View style={{ width: 24 }} />
                    <View style={cmpStyles.valBox}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#4A7C59' }}>🌐 OpenFood</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <CompareRow label="Kalori"       unit=" kcal" modelVal={modelNutrition.calories}  internetVal={internetNutrition.calories} highlight />
                  <CompareRow label="Protein"                   modelVal={modelNutrition.protein}   internetVal={internetNutrition.protein} />
                  <CompareRow label="Karbonhidrat"              modelVal={modelNutrition.carbs}     internetVal={internetNutrition.carbs}   highlight />
                  <CompareRow label="Yağ"                       modelVal={modelNutrition.fat}       internetVal={internetNutrition.fat} />

                  <View style={styles.divider} />

                  {/* Kaynak seçimi */}
                  <Text style={styles.sourceTitle}>Hangi değeri kaydet?</Text>
                  <View style={styles.sourceRow}>
                    <TouchableOpacity
                      style={[styles.sourceBtn, selectedSource === 'model' && styles.sourceBtnActivePurple]}
                      onPress={() => setSelectedSource('model')}
                    >
                      <Text style={[styles.sourceBtnText, selectedSource === 'model' && { color: '#6366f1' }]}>
                        🤖 Edamam
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sourceBtn, selectedSource === 'internet' && styles.sourceBtnActiveGreen]}
                      onPress={() => setSelectedSource('internet')}
                    >
                      <Text style={[styles.sourceBtnText, selectedSource === 'internet' && { color: '#4A7C59' }]}>
                        🌐 OpenFood
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sourceBtn, selectedSource === 'custom' && styles.sourceBtnActiveOrange]}
                      onPress={openEdit}
                    >
                      <Text style={[styles.sourceBtnText, selectedSource === 'custom' && { color: '#f59e0b' }]}>
                        ✏️ Özel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Seçilen kaynağın makroları */}
                <View style={styles.macros}>
                  <View style={styles.mBox}>
                    <Text style={styles.mLabel}>Protein</Text>
                    <Text style={styles.mVal}>{activeNutrition.protein}g</Text>
                  </View>
                  <View style={styles.mBox}>
                    <Text style={styles.mLabel}>K.hidrat</Text>
                    <Text style={styles.mVal}>{activeNutrition.carbs}g</Text>
                  </View>
                  <View style={styles.mBox}>
                    <Text style={styles.mLabel}>Yağ</Text>
                    <Text style={styles.mVal}>{activeNutrition.fat}g</Text>
                  </View>
                </View>
              </>
            )}

            {/* Butonlar */}
            <View style={styles.btns}>
              <TouchableOpacity style={styles.editBtn} onPress={openEdit} disabled={loading}>
                <Icon name="edit" size={20} color="#64748b" />
                <Text style={styles.btnEditText}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (loading || saving) && { opacity: 0.7 }]}
                onPress={handleSave} disabled={loading || saving}
              >
                {saving ? <ActivityIndicator color="#0d1b0e" /> : (
                  <>
                    <Icon name="check" size={24} color="#0d1b0e" />
                    <Text style={styles.saveText}>Onayla</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </View>

      {/* ─── DÜZENLEME MODALI ─── */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yemeği Düzenle</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>🌐 İnternette Ara</Text>
              <View style={styles.searchBox}>
                <Icon name="search" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Yemek adı yaz... (örn: pizza)"
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
                {searching && <ActivityIndicator size="small" color="#4A7C59" />}
              </View>

              {searchResults.length > 0 && (
                <View style={styles.resultsBox}>
                  {searchResults.map(item => (
                    <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => selectResult(item)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultLabel}>{item.label}</Text>
                        <Text style={styles.resultMacros}>
                          {item.calories} kcal • P:{item.protein}g • K:{item.carbs}g • Y:{item.fat}g
                        </Text>
                      </View>
                      <Icon name="add-circle-outline" size={22} color="#4A7C59" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.sectionLabel}>✏️ Manuel Düzenle</Text>

              <Text style={styles.inputLabel}>Yemek Adı</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName}
                placeholder="Yemek adı" placeholderTextColor="#94a3b8" />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Kalori (kcal)</Text>
                  <TextInput style={styles.input} value={editCal} onChangeText={setEditCal}
                    keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput style={styles.input} value={editProtein} onChangeText={setEditProtein}
                    keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Karbonhidrat (g)</Text>
                  <TextInput style={styles.input} value={editCarbs} onChangeText={setEditCarbs}
                    keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Yağ (g)</Text>
                  <TextInput style={styles.input} value={editFat} onChangeText={setEditFat}
                    keyboardType="numeric" placeholder="0" placeholderTextColor="#94a3b8" />
                </View>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={applyEdit}>
                <Icon name="check" size={22} color="#fff" />
                <Text style={styles.applyText}>Değişiklikleri Uygula</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#f6f7f7' },
  header:                 { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconBtn:                { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title:                  { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  imgArea:                { height: height * 0.35, padding: 20 },
  bgImg:                  { width: '100%', height: '100%', overflow: 'hidden' },
  overlay:                { flex: 1, padding: 25, justifyContent: 'space-between' },
  cornersRow:             { flexDirection: 'row', justifyContent: 'space-between' },
  corner:                 { width: 30, height: 30, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 6 },
  tag:                    { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  tagText:                { color: '#fff', fontSize: 10, fontWeight: '800' },
  sheet:                  { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, marginTop: -30, elevation: 15 },
  handle:                 { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginTop: 15 },
  sheetContent:           { padding: 24 },
  resultRow:              { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
  aiBadge:                { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  aiText:                 { color: '#4A7C59', fontSize: 10, fontWeight: '900' },
  foodName:               { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  kcalBox:                { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#d1fae5' },
  kcalVal:                { fontSize: 22, fontWeight: '900', color: '#4A7C59' },
  kcalUnit:               { fontSize: 10, color: '#4A7C59', fontWeight: '700', marginTop: -4 },
  compareCard:            { backgroundColor: '#f8fafc', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  divider:                { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  sourceTitle:            { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 8, marginBottom: 8 },
  sourceRow:              { flexDirection: 'row', gap: 8 },
  sourceBtn:              { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  sourceBtnActivePurple:  { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  sourceBtnActiveGreen:   { borderColor: '#4A7C59', backgroundColor: '#f0fdf4' },
  sourceBtnActiveOrange:  { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  sourceBtnText:          { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  macros:                 { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mBox:                   { flex: 1, backgroundColor: '#f8fafc', padding: 14, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  mLabel:                 { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  mVal:                   { color: '#1e293b', fontSize: 16, fontWeight: '700', marginTop: 4 },
  btns:                   { flexDirection: 'row', gap: 12 },
  editBtn:                { flex: 1, height: 58, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnEditText:            { fontWeight: '700', color: '#64748b', fontSize: 15 },
  saveBtn:                { flex: 2, height: 58, borderRadius: 20, backgroundColor: '#32d411', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3 },
  saveText:               { color: '#0d1b0e', fontWeight: '900', fontSize: 17 },
  modalOverlay:           { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:             { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.88 },
  modalHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:             { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  sectionLabel:           { fontSize: 12, fontWeight: '800', color: '#4A7C59', marginBottom: 8, marginTop: 8, textTransform: 'uppercase' },
  searchBox:              { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, marginBottom: 8 },
  searchInput:            { flex: 1, fontSize: 15, color: '#1e293b' },
  resultsBox:             { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14, overflow: 'hidden' },
  resultItem:             { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultLabel:            { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  resultMacros:           { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  inputLabel:             { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 10 },
  input:                  { backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  row:                    { flexDirection: 'row', marginTop: 2 },
  applyBtn:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4A7C59', borderRadius: 20, paddingVertical: 16, marginTop: 20 },
  applyText:              { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AnalysisScreen;