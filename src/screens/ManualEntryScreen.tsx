import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, ActivityIndicator, Image, StatusBar,
  Keyboard, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FoodItem {
  foodId: string;
  label: string;
  nutrients: {
    ENERC_KCAL: number;
    PROCNT: number;
    FAT: number;
    CHOCDF: number;
    FIBTG?: number;
  };
  image?: string;
  brand?: string;
}

interface SelectedFood extends FoodItem {
  quantity: number;
}

// ─── TR→EN Sözlük ────────────────────────────────────────────────────────────
const TR_EN_DICT: Record<string, string> = {
  elma: 'apple', armut: 'pear', muz: 'banana', portakal: 'orange',
  mandalina: 'tangerine', üzüm: 'grape', çilek: 'strawberry',
  kiraz: 'cherry', karpuz: 'watermelon', kavun: 'melon',
  şeftali: 'peach', erik: 'plum', kayısı: 'apricot',
  limon: 'lemon', nar: 'pomegranate', ananas: 'pineapple',
  mango: 'mango', avokado: 'avocado', incir: 'fig',
  hurma: 'date', kivi: 'kiwi',
  tavuk: 'chicken', et: 'meat', biftek: 'steak',
  kuzu: 'lamb', dana: 'beef', domuz: 'pork', hindi: 'turkey',
  balık: 'fish', somon: 'salmon', ton: 'tuna', hamsi: 'anchovy',
  karides: 'shrimp', midye: 'mussel', ahtapot: 'octopus',
  yumurta: 'egg', peynir: 'cheese', süt: 'milk', yoğurt: 'yogurt',
  tereyağı: 'butter', krema: 'cream',
  ekmek: 'bread', pirinç: 'rice', pilav: 'rice pilaf',
  makarna: 'pasta', erişte: 'noodle', bulgur: 'bulgur',
  yulaf: 'oat', mısır: 'corn', buğday: 'wheat', un: 'flour',
  bisküvi: 'biscuit', kraker: 'cracker', gevrek: 'cereal',
  domates: 'tomato', salatalık: 'cucumber', biber: 'pepper',
  patlıcan: 'eggplant', kabak: 'zucchini', havuç: 'carrot',
  patates: 'potato', soğan: 'onion', sarımsak: 'garlic',
  ıspanak: 'spinach', marul: 'lettuce', lahana: 'cabbage',
  brokoli: 'broccoli', karnabahar: 'cauliflower', bezelye: 'peas',
  fasulye: 'beans', mercimek: 'lentil', nohut: 'chickpeas',
  çikolata: 'chocolate', dondurma: 'ice cream', pasta: 'cake',
  kek: 'cake', kurabiye: 'cookie', tatlı: 'dessert',
  şeker: 'sugar', bal: 'honey', reçel: 'jam',
  zeytin: 'olive', zeytinyağı: 'olive oil', fındık: 'hazelnut',
  fıstık: 'peanut', badem: 'almond', ceviz: 'walnut', antep: 'pistachio',
  çay: 'tea', kahve: 'coffee', su: 'water', kola: 'cola',
  limonata: 'lemonade', ayran: 'ayran', boza: 'boza',
  pizza: 'pizza', burger: 'burger', sandviç: 'sandwich',
  döner: 'doner kebab', kebap: 'kebab', köfte: 'meatball',
  börek: 'borek', gözleme: 'gozleme', pide: 'pide',
  lahmacun: 'lahmacun', simit: 'simit', pogaça: 'pogaca',
  çorba: 'soup', salata: 'salad',
};

function translateToEnglish(text: string): string {
  const lower = text.toLowerCase().trim();
  const latinRatio = (text.match(/[a-zA-Z]/g) || []).length / (text.length || 1);
  if (latinRatio > 0.6) return text;
  if (TR_EN_DICT[lower]) return TR_EN_DICT[lower];
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (TR_EN_DICT[word]) return TR_EN_DICT[word] + ' ' + words.filter(w => w !== word).join(' ');
  }
  return text;
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────────
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromOFF(query: string): Promise<FoodItem[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=25` +
    `&fields=id,product_name,product_name_tr,brands,nutriments,image_front_small_url`;
  try {
    const res = await safeFetch(url, { headers: { 'User-Agent': 'NutritionApp/1.0 (contact@example.com)' } }, 12000);
    if (!res.ok) return [];
    const data = await res.json();
    const products: any[] = data?.products || [];
    return products
      .filter((p: any) => {
        const name = p.product_name_tr || p.product_name;
        const kcal =
          p.nutriments?.['energy-kcal_100g'] != null
            ? p.nutriments['energy-kcal_100g']
            : p.nutriments?.energy_100g != null
            ? p.nutriments.energy_100g / 4.184
            : null;
        return name && name.trim().length > 1 && kcal != null && kcal > 0;
      })
      .map((p: any): FoodItem => {
        const rawKcal = p.nutriments?.['energy-kcal_100g'] ?? Math.round((p.nutriments?.energy_100g ?? 0) / 4.184);
        return {
          foodId: p.id || `off_${Math.random().toString(36).slice(2)}`,
          label: p.product_name_tr || p.product_name || 'Bilinmeyen',
          brand: p.brands?.split(',')[0]?.trim() || undefined,
          nutrients: {
            ENERC_KCAL: Math.round(rawKcal),
            PROCNT: Math.round(p.nutriments?.proteins_100g ?? 0),
            FAT:    Math.round(p.nutriments?.fat_100g ?? 0),
            CHOCDF: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
            FIBTG:  Math.round(p.nutriments?.fiber_100g ?? 0),
          },
          image: p.image_front_small_url || undefined,
        };
      });
  } catch {
    return [];
  }
}

async function searchFoods(query: string): Promise<FoodItem[]> {
  const translated = translateToEnglish(query);
  const isSame = translated.toLowerCase() === query.toLowerCase();
  const promises: Promise<FoodItem[]>[] = [fetchFromOFF(query)];
  if (!isSame) promises.push(fetchFromOFF(translated));
  const merged = (await Promise.all(promises)).flat();
  const seen = new Set<string>();
  return merged
    .filter(f => { if (seen.has(f.foodId)) return false; seen.add(f.foodId); return true; })
    .filter(f => f.nutrients.ENERC_KCAL > 0)
    .slice(0, 25);
}

const kcalForQty = (food: FoodItem, qty = 100) =>
  Math.round((food.nutrients.ENERC_KCAL * qty) / 100);

// ─── FoodResultRow ────────────────────────────────────────────────────────────
interface RowProps { food: FoodItem; onAdd: (food: FoodItem) => void; T: typeof import('./ThemeContext').LIGHT }
const FoodResultRow: React.FC<RowProps> = ({ food, onAdd, T }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <View style={[
      rowStyles.container,
      { backgroundColor: T.card, borderColor: T.border },
    ]}>
      {food.image && !imgError ? (
        <Image source={{ uri: food.image }} style={rowStyles.image} onError={() => setImgError(true)} />
      ) : (
        <View style={[rowStyles.imagePlaceholder, { backgroundColor: T.surface }]}>
          <Icon name="restaurant" size={24} color={T.primary} />
        </View>
      )}
      <View style={rowStyles.info}>
        <Text style={[rowStyles.name, { color: T.text }]} numberOfLines={1}>{food.label}</Text>
        {food.brand ? (
          <Text style={[rowStyles.brand, { color: T.primary }]} numberOfLines={1}>{food.brand}</Text>
        ) : null}
        <Text style={[rowStyles.macros, { color: T.muted }]}>
          {`P:${food.nutrients.PROCNT}g  Y:${food.nutrients.FAT}g  K:${food.nutrients.CHOCDF}g  •  /100g`}
        </Text>
      </View>
      <View style={rowStyles.right}>
        <Text style={[rowStyles.kcal, { color: T.primary }]}>{food.nutrients.ENERC_KCAL} kcal</Text>
        <TouchableOpacity
          style={[rowStyles.addBtn, { backgroundColor: T.primary }]}
          onPress={() => onAdd(food)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 0.5,
    padding: 10, marginBottom: 10,
  },
  image: { width: 54, height: 54, borderRadius: 10 },
  imagePlaceholder: {
    width: 54, height: 54, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1, paddingHorizontal: 10 },
  name:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  brand:  { fontSize: 11, marginBottom: 2 },
  macros: { fontSize: 11 },
  right:  { alignItems: 'flex-end', gap: 6 },
  kcal:   { fontSize: 13, fontWeight: '700' },
  addBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});

// ─── SelectedChip ─────────────────────────────────────────────────────────────
interface ChipProps { food: SelectedFood; onRemove: (id: string) => void; T: typeof import('./ThemeContext').LIGHT }
const SelectedChip: React.FC<ChipProps> = ({ food, onRemove, T }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <View style={[chipStyles.chip, { backgroundColor: T.surface, borderColor: T.border }]}>
      {food.image && !imgError ? (
        <Image source={{ uri: food.image }} style={chipStyles.img} onError={() => setImgError(true)} />
      ) : (
        <View style={[chipStyles.imgPlaceholder, { backgroundColor: T.surface }]}>
          <Icon name="restaurant" size={14} color={T.primary} />
        </View>
      )}
      <Text style={[chipStyles.label, { color: T.text }]} numberOfLines={1}>{food.label}</Text>
      <TouchableOpacity onPress={() => onRemove(food.foodId)}>
        <Icon name="close" size={16} color={T.muted} />
      </TouchableOpacity>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 0.5,
    paddingVertical: 5, paddingLeft: 5, paddingRight: 10,
    marginRight: 8, gap: 6, maxWidth: 160,
  },
  img:            { width: 26, height: 26, borderRadius: 13 },
  imgPlaceholder: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  label:          { flex: 1, fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ManualEntryScreen = ({ navigation }: any) => {
  const { T, darkMode } = useTheme();

  const [searchQuery, setSearchQuery]     = useState('');
  const [results, setResults]             = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [hasSearched, setHasSearched]     = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [searchInfo, setSearchInfo]       = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stiller T değişince yeniden hesaplanır, useMemo ile gereksiz render önlenir
  const S = useMemo(() => StyleSheet.create({
    container:     { flex: 1, backgroundColor: T.bg },
    header:        {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
    },
    backBtn:       {
      width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
      borderRadius: 20, backgroundColor: T.surface,
    },
    headerTitle:   { fontSize: 18, fontWeight: '700', color: T.text },
    cancelText:    { color: T.primary, fontWeight: '600', fontSize: 15 },

    searchWrapper: { paddingHorizontal: 16, marginBottom: 12 },
    searchBar:     {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: T.card, borderRadius: 14,
      height: 52, borderWidth: 0.5, borderColor: T.border,
    },
    searchInput:   { flex: 1, paddingHorizontal: 10, fontSize: 15, color: T.text },
    hintText:      { marginTop: 8, marginLeft: 4, fontSize: 12, color: '#f59e0b', fontWeight: '500' },
    infoText:      { marginTop: 8, marginLeft: 4, fontSize: 12, color: T.primary, fontWeight: '500' },

    list: { flex: 1, paddingHorizontal: 16 },

    emptyState:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
    emptyTitle:    { fontSize: 18, fontWeight: '700', color: T.muted, marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 22, opacity: 0.7 },

    loadingState:  { alignItems: 'center', paddingTop: 60, gap: 12 },
    loadingText:   { fontSize: 14, color: T.muted, fontWeight: '500' },

    footer: {
      backgroundColor: T.card,
      paddingHorizontal: 20, paddingTop: 14,
      paddingBottom: Platform.OS === 'android' ? 20 : 32,
      borderTopWidth: 0.5, borderTopColor: T.border,
    },

    macroRow: {
      flexDirection: 'row', justifyContent: 'space-around',
      backgroundColor: T.surface, borderRadius: 12,
      paddingVertical: 10, marginBottom: 12,
    },
    macroItem:    { alignItems: 'center', flex: 1 },
    macroValue:   { fontSize: 15, fontWeight: '800', color: T.text },
    macroLabel:   { fontSize: 11, color: T.muted, marginTop: 2 },
    macroDivider: { width: 1, backgroundColor: T.border, marginVertical: 4 },

    footerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryCount:   { fontSize: 13, color: T.muted, fontWeight: '500' },
    summaryKcal:    { fontSize: 18, color: T.text, fontWeight: '800', marginTop: 2 },

    saveButton:     {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: T.primary, paddingHorizontal: 22,
      paddingVertical: 14, borderRadius: 14,
    },
    saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  }), [T]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setErrorMsg(null);
    setSearchInfo(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setHasSearched(false); return; }
    if (text.trim().length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const translated = translateToEnglish(text.trim());
      const isSame = translated.toLowerCase() === text.trim().toLowerCase();
      setSearchInfo(isSame ? 'Aranıyor...' : `"${text.trim()}" → "${translated}" olarak da aranıyor...`);
      const foods = await searchFoods(text.trim());
      setResults(foods);
      setHasSearched(true);
      setIsSearching(false);
      setSearchInfo(null);
      if (!foods.length) setErrorMsg('Sonuç bulunamadı. Farklı bir kelime deneyin.');
    }, 700);
  }, []);

  // ── Selection ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback((food: FoodItem) => {
    setSelectedFoods(prev => {
      const exists = prev.find(f => f.foodId === food.foodId);
      if (exists) return prev.map(f => f.foodId === food.foodId ? { ...f, quantity: f.quantity + 100 } : f);
      return [...prev, { ...food, quantity: 100 }];
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSelectedFoods(prev => prev.filter(f => f.foodId !== id));
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedFoods.length) return;
    Keyboard.dismiss();
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');
      const logsToInsert = selectedFoods.map(food => ({
        user_id:       user.id,
        name:          food.label,
        calories:      kcalForQty(food, food.quantity),
        protein:       Math.round((food.nutrients.PROCNT  * food.quantity) / 100),
        fat:           Math.round((food.nutrients.FAT     * food.quantity) / 100),
        carbs:         Math.round((food.nutrients.CHOCDF  * food.quantity) / 100),
        image_url:     food.image ?? null,
        portion_grams: food.quantity,
        ingredients:   [],
        created_at:    new Date().toISOString(),
      }));
      const { error } = await supabase.from('meals').insert(logsToInsert);
      if (error) throw error;
      Alert.alert('Başarılı! 🎉', `${selectedFoods.length} öğün eklendi`, [
        { text: 'Tamam', onPress: () => navigation.navigate('Progress') },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + kcalForQty(food, food.quantity),
      protein:  acc.protein  + Math.round((food.nutrients.PROCNT * food.quantity) / 100),
      fat:      acc.fat      + Math.round((food.nutrients.FAT    * food.quantity) / 100),
      carbs:    acc.carbs    + Math.round((food.nutrients.CHOCDF * food.quantity) / 100),
      count:    acc.count    + 1,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, count: 0 },
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.container}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Icon name="arrow-back" size={24} color={T.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Manuel Yemek Ekle</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={S.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={S.searchWrapper}>
        <View style={S.searchBar}>
          {isSearching ? (
            <ActivityIndicator size="small" color={T.primary} style={{ marginLeft: 12 }} />
          ) : (
            <Icon name="search" size={22} color={T.muted} style={{ marginLeft: 12 }} />
          )}
          <TextInput
            style={S.searchInput}
            placeholder="Yemek ara... (elma, tavuk, pilav)"
            placeholderTextColor={T.muted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setResults([]);
                setHasSearched(false);
                setErrorMsg(null);
                setSearchInfo(null);
              }}
              style={{ paddingRight: 12 }}
            >
              <Icon name="close" size={18} color={T.muted} />
            </TouchableOpacity>
          )}
        </View>
        {searchInfo && !errorMsg && <Text style={S.infoText}>{searchInfo}</Text>}
        {errorMsg && <Text style={S.hintText}>{errorMsg}</Text>}
      </View>

      {/* Results List */}
      <ScrollView
        style={S.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Empty State */}
        {!hasSearched && !isSearching && (
          <View style={S.emptyState}>
            <Icon name="search" size={52} color={T.border} />
            <Text style={S.emptyTitle}>Besin Ara</Text>
            <Text style={S.emptySubtitle}>
              {'Türkçe yazın, otomatik İngilizce\nkarşılığı da aranır.\n\n(örn: elma → apple ürünleri de çıkar)'}
            </Text>
          </View>
        )}

        {/* Searching */}
        {isSearching && (
          <View style={S.loadingState}>
            <ActivityIndicator size="large" color={T.primary} />
            <Text style={S.loadingText}>Aranıyor...</Text>
          </View>
        )}

        {/* Results */}
        {!isSearching && results.map(food => (
          <FoodResultRow key={food.foodId} food={food} onAdd={handleAdd} T={T} />
        ))}

        {/* No Results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <View style={S.emptyState}>
            <Icon name="sentiment-dissatisfied" size={52} color={T.border} />
            <Text style={S.emptyTitle}>Sonuç Bulunamadı</Text>
            <Text style={S.emptySubtitle}>
              {'Farklı bir arama terimi deneyin.\nİngilizce de arama yapabilirsiniz.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {selectedFoods.length > 0 && (
        <View style={S.footer}>
          {/* Seçilen ürünler */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            {selectedFoods.map(food => (
              <SelectedChip key={food.foodId} food={food} onRemove={handleRemove} T={T} />
            ))}
          </ScrollView>

          {/* Makro özet */}
          <View style={S.macroRow}>
            <View style={S.macroItem}>
              <Text style={S.macroValue}>{totals.protein}g</Text>
              <Text style={S.macroLabel}>Protein</Text>
            </View>
            <View style={S.macroDivider} />
            <View style={S.macroItem}>
              <Text style={S.macroValue}>{totals.fat}g</Text>
              <Text style={S.macroLabel}>Yağ</Text>
            </View>
            <View style={S.macroDivider} />
            <View style={S.macroItem}>
              <Text style={S.macroValue}>{totals.carbs}g</Text>
              <Text style={S.macroLabel}>Karb.</Text>
            </View>
          </View>

          {/* Kaydet satırı */}
          <View style={S.footerRow}>
            <View>
              <Text style={S.summaryCount}>{totals.count} ürün seçildi</Text>
              <Text style={S.summaryKcal}>{totals.calories} kcal toplam</Text>
            </View>
            <TouchableOpacity
              style={[S.saveButton, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={S.saveButtonText}>Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ManualEntryScreen;