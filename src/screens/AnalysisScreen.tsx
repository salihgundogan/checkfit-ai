import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  SafeAreaView, Alert, Dimensions, Platform, StatusBar, ImageBackground,
  Modal, TextInput, ScrollView, PanResponder, Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InferenceSession } from 'onnxruntime-react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import { runFoodInference } from '../utils/modelHelper';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';
const { height, width } = Dimensions.get('window');

// ─── Tipler ──────────────────────────────────────────────────
type Nutrition = { calories: number; protein: number; fat: number; carbs: number };

// ─── Supabase veri çekme fonksiyonları ───────────────────────

/**
 * FoodCoefficients tablosundan AWR katsayısını çeker.
 * Tablo: { food_id: string, awr_coefficient: number }
 */
async function fetchAWR(foodId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('FoodCoefficients')
      .select('awr_coefficient')
      .eq('food_id', foodId)
      .single();
    if (error || !data) return null;
    return data.awr_coefficient as number;
  } catch {
    return null;
  }
}

/**
 * LocalFoods tablosundan 100g başına USDA besin değerlerini çeker.
 * Tablo: { food_id, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g }
 */
async function fetchUSDA(foodId: string): Promise<Nutrition | null> {
  try {
    const { data, error } = await supabase
      .from('LocalFoods')
      .select('calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .eq('food_id', foodId)
      .single();
    if (error || !data) return null;
    return {
      calories: data.calories_per_100g,
      protein:  data.protein_per_100g,
      fat:      data.fat_per_100g ?? 0,
      carbs:    data.carbs_per_100g,
    };
  } catch {
    return null;
  }
}

/**
 * Gramaj + 100g başına besin → porsiyona göre hesaplanmış besin değerleri
 */
function calcNutrition(per100g: Nutrition, grams: number): Nutrition {
  const r = grams / 100;
  return {
    calories: Math.round(per100g.calories * r),
    protein:  Math.round(per100g.protein  * r * 10) / 10,
    fat:      Math.round(per100g.fat      * r * 10) / 10,
    carbs:    Math.round(per100g.carbs    * r * 10) / 10,
  };
}

// ─── Bileşen ─────────────────────────────────────────────────
const AnalysisScreen: React.FC<NativeStackScreenProps<any, 'Analysis'>> = ({ route, navigation }) => {
   const { T, darkMode } = useTheme();
  const { imageUri } = route.params as { imageUri: string };

  const [session,   setSession]   = useState<InferenceSession | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // Model çıktıları
  const [foodName,      setFoodName]      = useState<string | null>(null);
  const [areaCm2,       setAreaCm2]       = useState<number>(0);
  const [confidence,    setConfidence]    = useState<number>(0);   // 0–100

  // Hesaplanan değerler
  const [estimatedGrams, setEstimatedGrams] = useState<number>(0);
  const [per100g,        setPer100g]        = useState<Nutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [nutrition,      setNutrition]      = useState<Nutrition>({ calories: 0, protein: 0, fat: 0, carbs: 0 });

  // Düzenleme modal
  const [editVisible,  setEditVisible]  = useState(false);
  const [editFoodName, setEditFoodName] = useState('');
  const [portionGrams, setPortionGrams] = useState(200);

  // Slider
  const sliderAnim  = useRef(new Animated.Value(0.5)).current;
  const sliderWidth = width - 40 - 96;
  const MIN_GRAMS   = 50;
  const MAX_GRAMS   = 600;

  const gramsToSlider = (g: number) => (g - MIN_GRAMS) / (MAX_GRAMS - MIN_GRAMS);
  const sliderToGrams = (v: number) => Math.round(MIN_GRAMS + v * (MAX_GRAMS - MIN_GRAMS));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        const val = Math.max(0, Math.min(1, (gs.moveX - 48) / sliderWidth));
        sliderAnim.setValue(val);
        setPortionGrams(sliderToGrams(val));
      },
    })
  ).current;



  // ── 1. ONNX Modeli Yükle ──────────────────────────────────
useEffect(() => {
  (async () => {
    try {
      const modelFileName = 'mainmodel_v2.onnx';
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelFileName}`;
      
      // Debug: assets'te var mı kontrol et
      const assetFiles = await RNFS.readDirAssets('');
      console.log('Assets klasörü:', assetFiles.map(f => f.name));
      
      const exists = await RNFS.exists(destPath);
      console.log('Model zaten kopyalanmış mı:', exists, destPath);
      
      if (!exists) {
        console.log('Model kopyalanıyor...');
        await RNFS.copyFileAssets(modelFileName, destPath);
        console.log('Kopyalama başarılı');
      }
      
      console.log('Session oluşturuluyor...');
      const sess = await InferenceSession.create(destPath);
      console.log('Session başarılı:', sess.inputNames, sess.outputNames);
      setSession(sess);
    } catch (e: any) {
      // Hatanın tam detayını görmek için
      console.error('Model yükleme hatası DETAY:', JSON.stringify(e), e?.message, e?.stack);
      setLoading(false);
    }
  })();
}, []);

  // ── 2. Çıkarım → Supabase → Hesaplama ────────────────────
  useEffect(() => {
    if (!session || !imageUri || foodName) return;
    (async () => {
      try {
        // runFoodInference artık { name, areaCm2, confidence } döndürmeli
        // modelHelper.ts'de buna göre güncelleme yapılmalı.
        const result = await runFoodInference(imageUri, session) as {
          name:       string;
          areaCm2:    number;
          confidence: number; // 0–1 arası float
        };
        console.log('=== MODEL ÇIKTISI ===');
console.log('Ham result:', JSON.stringify(result));
console.log('Name:', result.name);
console.log('Confidence:', result.confidence);
console.log('AreaCm2:', result.areaCm2);
        const cleanName   = result.name || 'Belirlenemedi';
        const area        = result.areaCm2    ?? 0;
        const conf        = result.confidence ?? 0;

        setFoodName(cleanName);
        setAreaCm2(area);
        setConfidence(Math.round(conf * 100)); // 0–100'e çevir
        setEditFoodName(cleanName);

        if (cleanName !== 'Belirlenemedi') {
          // Supabase'den AWR ve USDA verilerini paralel çek
          const [awr, usda] = await Promise.all([
            fetchAWR(cleanName),
            fetchUSDA(cleanName),
          ]);

          // Gramaj hesapla
          const grams = awr && area > 0
  ? Math.round(area * awr)
  : 150; // ✅ area=0 ise 150g fallback devreye girer // fallback: 150g

          // 100g başına besin değeri
          const base: Nutrition = usda ?? { calories: 250, protein: 10, fat: 8, carbs: 30 };

          setPer100g(base);
          setEstimatedGrams(grams);
          setPortionGrams(grams);
          sliderAnim.setValue(gramsToSlider(Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, grams))));
          setNutrition(calcNutrition(base, grams));
        }
      } catch (e) {
        console.error('Analiz hatası:', e);
        setFoodName('Hata');
      } finally {
        setLoading(false);
      }
    })();
  }, [session, imageUri]);

  // Porsiyon değişince besin güncelle
  useEffect(() => {
    if (per100g.calories > 0) {
      setNutrition(calcNutrition(per100g, portionGrams));
    }
  }, [portionGrams, per100g]);

  // ── Modal işlemleri ──────────────────────────────────────
  const openEdit = () => {
    setEditFoodName(foodName || '');
    setEditVisible(true);
  };

  const adjustPortion = (delta: number) => {
    const next = Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, portionGrams + delta));
    setPortionGrams(next);
    sliderAnim.setValue(gramsToSlider(next));
  };

  const applyEdit = () => {
    setFoodName(editFoodName);
    setEditVisible(false);
  };

  // ── Supabase Kaydet ───────────────────────────────────────
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
        user_id:        user.id,
        name:           foodName,
        image_url:      publicUrl,
        calories:       nutrition.calories,
        protein:        nutrition.protein,
        fat:            nutrition.fat,
        carbs:          nutrition.carbs,
        portion_grams:  portionGrams,
        area_cm2:       areaCm2,
        confidence:     confidence,
        ingredients:    [],
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

  const portionCalories = Math.round(per100g.calories * portionGrams / 100);

  // ── Güven rengi ──────────────────────────────────────────
  const confidenceColor =
    confidence >= 85 ? '#4A7C59' :
    confidence >= 65 ? '#f59e0b' : '#ef4444';

  const confidenceLabel =
    confidence >= 85 ? 'Yüksek Eşleşme' :
    confidence >= 65 ? 'Orta Eşleşme'  : 'Düşük Eşleşme';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── FOTOĞRAF ALANI ── */}
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.heroImage}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.heroOverlay} />

        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="arrow-back-ios" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Viewfinder köşeleri */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinderRow}>
            <View style={[styles.corner, { borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { borderTopWidth: 3, borderRightWidth: 3 }]} />
          </View>

       {/* Viewfinder orta badge — model sonucuna göre */}
<View style={styles.scanBadge}>
  <View style={styles.scanBadgePulse} />
  <View style={styles.scanBadgeInner}>
    <Icon name="videocam" size={16} color="#fff" />
    <Text style={styles.scanText}>
      {loading
        ? 'ANALİZ EDİLİYOR...'
        : foodName && foodName !== 'Belirlenemedi' && foodName !== 'Hata'
          ? 'YEMEK ALGILANDI'
          : 'YEMEK ALGILANAMADI'}
    </Text>
  </View>
</View>

          <View style={styles.viewfinderRow}>
            <View style={[styles.corner, { borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>
        </View>

        {/* Güven skoru badge — model'den gerçek değer */}
        {!loading && confidence > 0 && (
          <View style={[styles.confidenceBadge, { borderColor: confidenceColor + '55' }]}>
            <Icon name="auto-awesome" size={14} color={confidenceColor} />
            <Text style={[styles.confidenceText, { color: '#fff' }]}>
              YZ Analizi  •  %{confidence} {confidenceLabel}
            </Text>
          </View>
        )}

        {/* Alan bilgisi badge */}
        {!loading && areaCm2 > 0 && (
          <View style={styles.areaBadge}>
            <Icon name="crop-free" size={13} color="#94a3b8" />
            <Text style={styles.areaText}>{areaCm2.toFixed(1)} cm²</Text>
          </View>
        )}
      </ImageBackground>

      {/* ── ALT SHEET ── */}
      <View style={[styles.sheet, { backgroundColor: T.card }]}>
        <View style={[styles.handle, { backgroundColor: darkMode ? '#3a3a3c' : '#e2e8f0' }]} />

        <View style={styles.sheetContent}>

          {/* Yemek adı + kalori */}
          <View style={styles.resultRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.aiBadge}>
                <Icon name="auto-awesome" size={12} color="#4A7C59" />
                <Text style={styles.aiText}>YAPAY ZEKA ANALİZİ</Text>
              </View>
              <Text style={[styles.foodName, { color: T.text }]}>
                {loading ? 'Analiz ediliyor...' : (foodName ?? 'Belirlenemedi')}
              </Text>
              {!loading && estimatedGrams > 0 && (
               <Text style={[styles.mealMeta, { color: T.muted }]}>
                  Tahmini Porsiyon: {estimatedGrams}g
                </Text>
              )}
            </View>
            <View style={styles.kcalBox}>
              {loading
                ? <ActivityIndicator color="#4A7C59" />
                : <>
                    <Text style={styles.kcalVal}>{nutrition.calories}</Text>
                    <Text style={styles.kcalUnit}>kcal</Text>
                  </>
              }
            </View>
          </View>

          {/* Makrolar */}
          {!loading && (
            <View style={styles.macros}>
              <View style={[styles.mBox, { backgroundColor: T.surface, borderColor: T.border }]}>
                <Text style={[styles.mLabel, { color: T.muted }]}>Protein</Text>
                <Text style={[styles.mVal, { color: T.text }]}>{nutrition.protein}g</Text>
              </View>
              <View style={styles.mBox}>
                <Text style={[styles.mLabel,{ color: T.muted }]}>K.hidrat</Text>
                <Text style={styles.mVal}>{nutrition.carbs}g</Text>
              </View>
              <View style={styles.mBox}>
                <Text style={styles.mLabel}>Yağ</Text>
                <Text style={styles.mVal}>{nutrition.fat}g</Text>
              </View>
            </View>
          )}

          {loading && (
            <ActivityIndicator size="large" color="#4A7C59" style={{ marginVertical: 24 }} />
          )}

          {/* Butonlar */}
          <View style={styles.btns}>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: T.card, borderColor: T.border }]} onPress={openEdit} disabled={loading}>
              <Icon name="edit" size={18} color="#64748b" />
              <Text style={[styles.btnEditText, { color: T.muted }]}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (loading || saving) && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading || saving}
            >
              {saving
                ? <ActivityIndicator color="#0d1b0e" />
                : <>
                    <Icon name="check" size={22} color="#0d1b0e" />
                    <Text style={styles.saveText}>Onayla</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── DÜZENLEME MODALI ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.handle} />

            <View style={modal.header}>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={modal.backBtn}>
                <Icon name="arrow-back" size={22} color="#141b0d" />
              </TouchableOpacity>
              <Text style={modal.title}>Analizi Düzenle</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Fotoğraf önizleme */}
              <View style={modal.imgContainer}>
                <ImageBackground
                  source={{ uri: imageUri }}
                  style={modal.img}
                  imageStyle={{ borderRadius: 16, resizeMode: 'cover' }}
                >
                  <View style={modal.imgOverlay} />
                  <View style={modal.imgBadge}>
                    <Icon name="auto-awesome" size={13} color="#4A7C59" />
                    <Text style={modal.imgBadgeText}>
                      YZ Güveni: %{confidence}
                    </Text>
                  </View>
                </ImageBackground>
              </View>

              {/* Yemek adı */}
              <View style={modal.nameInputWrap}>
                <TextInput
                  style={modal.nameInput}
                  value={editFoodName}
                  onChangeText={setEditFoodName}
                  placeholder="Yemek adı"
                  placeholderTextColor="#94a3b8"
                />
                <Icon name="edit" size={20} color="#4A7C59" style={modal.nameInputIcon} />
              </View>

              {/* Alan & AWR bilgisi */}
              {areaCm2 > 0 && (
                <View style={modal.infoRow}>
                  <View style={modal.infoChip}>
                    <Icon name="crop-free" size={14} color="#4A7C59" />
                    <Text style={modal.infoChipText}>Alan: {areaCm2.toFixed(1)} cm²</Text>
                  </View>
                  <View style={modal.infoChip}>
                    <Icon name="straighten" size={14} color="#4A7C59" />
                    <Text style={modal.infoChipText}>Tahmin: {estimatedGrams}g</Text>
                  </View>
                </View>
              )}

              {/* Porsiyon başlık */}
              <Text style={modal.sectionLabel}>Porsiyon Miktarını Ayarla</Text>

              <View style={modal.portionDisplay}>
                <Text style={modal.portionGrams}>{portionGrams}</Text>
                <Text style={modal.portionUnit}>gr</Text>
              </View>

              <View style={modal.sliderRow}>
                <TouchableOpacity style={modal.portionBtn} onPress={() => adjustPortion(-25)}>
                  <Icon name="remove" size={22} color="#141b0d" />
                </TouchableOpacity>

                <View style={modal.sliderTrack} {...panResponder.panHandlers}>
                  <Animated.View
                    style={[
                      modal.sliderFill,
                      {
                        width: sliderAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      modal.sliderThumb,
                      {
                        left: sliderAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, sliderWidth - 28],
                        }),
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity style={modal.portionBtn} onPress={() => adjustPortion(25)}>
                  <Icon name="add" size={22} color="#141b0d" />
                </TouchableOpacity>
              </View>

              {/* Hızlı seçenekler */}
              <View style={modal.quickPortions}>
                {[100, 150, 200, 300].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[modal.quickBtn, portionGrams === g && modal.quickBtnActive]}
                    onPress={() => { setPortionGrams(g); sliderAnim.setValue(gramsToSlider(g)); }}
                  >
                    <Text style={[modal.quickBtnText, portionGrams === g && modal.quickBtnTextActive]}>
                      {g}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Kalori kartı */}
              <View style={modal.calorieCard}>
                <Text style={modal.calorieLabel}>Tahmini Değer ({portionGrams}g)</Text>
                <Text style={modal.calorieVal}>
                  {portionCalories} <Text style={modal.calorieUnit}>kcal</Text>
                </Text>
                <View style={modal.macroRow}>
                  <Text style={modal.macroItem}>
                    P: {Math.round(per100g.protein * portionGrams / 100 * 10) / 10}g
                  </Text>
                  <Text style={modal.macroDot}>•</Text>
                  <Text style={modal.macroItem}>
                    K: {Math.round(per100g.carbs * portionGrams / 100 * 10) / 10}g
                  </Text>
                  <Text style={modal.macroDot}>•</Text>
                  <Text style={modal.macroItem}>
                    Y: {Math.round(per100g.fat * portionGrams / 100 * 10) / 10}g
                  </Text>
                </View>
                {/* 100g referans */}
                <Text style={modal.per100Label}>
                  Referans (100g): {per100g.calories} kcal
                </Text>
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={modal.footer}>
              <TouchableOpacity style={modal.applyBtn} onPress={applyEdit}>
                <Icon name="check-circle" size={22} color="#0d1b0e" />
                <Text style={modal.applyText}>Doğrula ve Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── STİLLER ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#0d1b0e' },
  heroImage:           { width: '100%', height: height * 0.58 },
  heroOverlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  header:              {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 0,
  },
  iconBtn:             {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewfinderContainer: { flex: 1, padding: 28, justifyContent: 'space-between', paddingBottom: 120, },
  viewfinderRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  corner:              { width: 28, height: 28, borderColor: 'rgba(255,255,255,0.65)', borderRadius: 5 },
  scanBadge:           { alignSelf: 'center', alignItems: 'center' },
  scanBadgePulse:      {
    position: 'absolute', width: 160, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(74,124,89,0.2)',
    transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }],
  },
  scanBadgeInner:      {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  scanText:            { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  confidenceBadge:     {
    position: 'absolute', bottom: 50, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.50)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
    borderWidth: 1,
  },
  confidenceText:      { fontSize: 12, fontWeight: '600' },
  areaBadge:           {
    position: 'absolute', bottom: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.40)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  areaText:            { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  sheet:               {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    marginTop: -36, elevation: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
  handle:              {
    width: 44, height: 5, backgroundColor: '#e2e8f0',
    borderRadius: 10, alignSelf: 'center', marginTop: 14,
  },
  sheetContent:        { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  resultRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  aiBadge:             { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  aiText:              { color: '#4A7C59', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  foodName:            { fontSize: 26, fontWeight: '800', color: '#1e293b', lineHeight: 30 },
  mealMeta:            { fontSize: 13, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  kcalBox:             {
    backgroundColor: '#ecfdf5', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#d1fae5', minWidth: 70,
  },
  kcalVal:             { fontSize: 22, fontWeight: '900', color: '#4A7C59' },
  kcalUnit:            { fontSize: 10, color: '#4A7C59', fontWeight: '700' },
  macros:              { flexDirection: 'row', gap: 10, marginBottom: 20 },
  mBox:                {
    flex: 1, backgroundColor: '#f8fafc', paddingVertical: 12,
    borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
  },
  mLabel:              { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  mVal:                { color: '#1e293b', fontSize: 16, fontWeight: '700', marginTop: 3 },
  btns:                { flexDirection: 'row', gap: 12 },
  editBtn:             {
    flex: 1, height: 54, borderRadius: 18, borderWidth: 1.5, borderColor: '#e2e8f0',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff',
  },
  btnEditText:         { fontWeight: '700', color: '#64748b', fontSize: 14 },
  saveBtn:             {
    flex: 2, height: 54, borderRadius: 18, backgroundColor: '#32d411',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    elevation: 4, shadowColor: '#32d411', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  saveText:            { color: '#0d1b0e', fontWeight: '900', fontSize: 16 },
});

const modal = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:           {
    backgroundColor: '#F9FAF5', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    height: height * 0.92, overflow: 'hidden',
  },
  handle:          {
    width: 44, height: 5, backgroundColor: '#dbe7cf',
    borderRadius: 10, alignSelf: 'center', marginTop: 14, marginBottom: 4,
  },
  header:          {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn:         {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  title:           { fontSize: 18, fontWeight: '800', color: '#141b0d' },
  imgContainer:    { marginHorizontal: 20, marginBottom: 20 },
  img:             {
    width: '100%', aspectRatio: 4 / 3, borderRadius: 16,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  imgOverlay:      {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16,
  },
  imgBadge:        {
    position: 'absolute', bottom: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  imgBadgeText:    { color: '#fff', fontSize: 12, fontWeight: '600' },
  nameInputWrap:   { marginHorizontal: 20, marginBottom: 16, position: 'relative' },
  nameInput:       {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16, paddingRight: 48,
    fontSize: 18, fontWeight: '700', color: '#141b0d',
    borderWidth: 1.5, borderColor: '#dbe7cf',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  nameInputIcon:   { position: 'absolute', right: 16, top: 17 },
  infoRow:         { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 20 },
  infoChip:        {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#d1fae5',
  },
  infoChipText:    { fontSize: 12, fontWeight: '700', color: '#4A7C59' },
  sectionLabel:    {
    fontSize: 11, fontWeight: '800', color: '#4A7C59',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 20, marginBottom: 10,
  },
  portionDisplay:  {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', marginBottom: 20, gap: 8,
  },
  portionGrams:    { fontSize: 64, fontWeight: '900', color: '#141b0d', lineHeight: 68, letterSpacing: -2 },
  portionUnit:     { fontSize: 24, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  sliderRow:       {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 12, marginBottom: 20,
  },
  portionBtn:      {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#dbe7cf',
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  sliderTrack:     {
    flex: 1, height: 8, backgroundColor: '#e8efdf',
    borderRadius: 4, position: 'relative', justifyContent: 'center',
  },
  sliderFill:      { position: 'absolute', left: 0, height: 8, backgroundColor: '#4A7C59', borderRadius: 4 },
  sliderThumb:     {
    position: 'absolute', width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4A7C59', borderWidth: 4, borderColor: '#fff',
    elevation: 5, shadowColor: '#4A7C59', shadowOpacity: 0.35, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, top: -10,
  },
  quickPortions:   { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 20 },
  quickBtn:        {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#e8efdf',
    alignItems: 'center', backgroundColor: '#fff',
  },
  quickBtnActive:      { borderColor: '#4A7C59', backgroundColor: '#4A7C59' },
  quickBtnText:        { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  quickBtnTextActive:  { color: '#fff' },
  calorieCard:     {
    marginHorizontal: 20, backgroundColor: '#eef5e6', borderRadius: 20,
    padding: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#dbe7cf', borderStyle: 'dashed',
  },
  calorieLabel:    { fontSize: 12, color: '#5c7a3c', fontWeight: '600', marginBottom: 6 },
  calorieVal:      { fontSize: 40, fontWeight: '900', color: '#141b0d', letterSpacing: -1 },
  calorieUnit:     { fontSize: 18, fontWeight: '600', color: '#5c7a3c' },
  macroRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  macroItem:       { fontSize: 13, fontWeight: '700', color: '#5c7a3c' },
  macroDot:        { fontSize: 13, color: '#9ab87c' },
  per100Label:     { fontSize: 11, color: '#9ab87c', fontWeight: '500', marginTop: 8 },
  footer:          {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 16,
    backgroundColor: '#F9FAF5',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  applyBtn:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#4A7C59', borderRadius: 18, paddingVertical: 16,
    elevation: 4, shadowColor: '#4A7C59', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  applyText:       { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AnalysisScreen;