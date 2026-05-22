import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';
// ─── Types ────────────────────────────────────────────────────────
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

// ─── Türkçe → İngilizce Sözlük (offline, güvenilir) ─────────────
// LibreTranslate yerine yaygın besinler için offline sözlük kullanıyoruz
// Bu şekilde internet bağlantısı / CORS sorunları olmaz
const TR_EN_DICT: Record<string, string> = {
  elma: 'apple', armut: 'pear', muz: 'banana', portakal: 'orange',
  mandalina: 'tangerine', üzüm: 'grape', çilek: 'strawberry',
  kiraz: 'cherry', karpuz: 'watermelon', kavun: 'melon',
  şeftali: 'peach', erik: 'plum', kayısı: 'apricot',
  limon: 'lemon', nar: 'pomegranate', ananas: 'pineapple',
  mango: 'mango', avokado: 'avocado', incir: 'fig',
  hurma: 'date', kivi: 'kiwi', çilek: 'strawberry',

  tavuk: 'chicken', et: 'meat', kırmızı: 'red', biftek: 'steak',
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
  börülce: 'black-eyed peas', soya: 'soy',

  çikolata: 'chocolate', dondurma: 'ice cream', pasta: 'cake',
  kek: 'cake', kurabiye: 'cookie', tatlı: 'dessert',
  şeker: 'sugar', bal: 'honey', reçel: 'jam',

  zeytin: 'olive', zeytinyağı: 'olive oil', ayçiçeği: 'sunflower',
  fındık: 'hazelnut', fıstık: 'peanut', badem: 'almond',
  ceviz: 'walnut', antep: 'pistachio',

  çay: 'tea', kahve: 'coffee', meyve: 'fruit', suyu: 'juice',
  su: 'water', kola: 'cola', limonata: 'lemonade',
  ayran: 'ayran', boza: 'boza',

  pizza: 'pizza', burger: 'burger', sandviç: 'sandwich',
  döner: 'doner kebab', kebap: 'kebab', köfte: 'meatball',
  börek: 'borek', gözleme: 'gozleme', pide: 'pide',
  lahmacun: 'lahmacun', simit: 'simit', pogaça: 'pogaca',
  çorba: 'soup', salata: 'salad', pilaf: 'rice pilaf',
};

function translateToEnglish(text: string): string {
  const lower = text.toLowerCase().trim();

  // Zaten büyük oranda latin karakterler varsa çevirme
  const latinRatio = (text.match(/[a-zA-Z]/g) || []).length / (text.length || 1);
  if (latinRatio > 0.6) return text;

  // Sözlükte tam eşleşme varsa direkt çevir
  if (TR_EN_DICT[lower]) return TR_EN_DICT[lower];

  // Kelime kelime dene (örn: "tavuk göğsü" → "chicken")
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (TR_EN_DICT[word]) return TR_EN_DICT[word] + ' ' + words.filter(w => w !== word).join(' ');
  }

  // Çeviri bulunamadıysa orijinal metni döndür
  return text;
}

// ─── Güvenli fetch (AbortController ile, RN uyumlu) ──────────────
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Open Food Facts Arama ────────────────────────────────────────
async function fetchFromOFF(query: string): Promise<FoodItem[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1` +
    `&action=process` +
    `&json=1` +
    `&page_size=25` +
    `&fields=id,product_name,product_name_tr,brands,nutriments,image_front_small_url`;

  try {
    const res = await safeFetch(
      url,
      { headers: { 'User-Agent': 'NutritionApp/1.0 (contact@example.com)' } },
      12000,
    );

    if (!res.ok) {
      console.warn('OFF yanıt hatası:', res.status);
      return [];
    }

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
        const rawKcal =
          p.nutriments?.['energy-kcal_100g'] ??
          Math.round((p.nutriments?.energy_100g ?? 0) / 4.184);

        return {
          foodId: p.id || `off_${Math.random().toString(36).slice(2)}`,
          label: p.product_name_tr || p.product_name || 'Bilinmeyen',
          brand: p.brands?.split(',')[0]?.trim() || undefined,
          nutrients: {
            ENERC_KCAL: Math.round(rawKcal),
            PROCNT: Math.round(p.nutriments?.proteins_100g ?? 0),
            FAT: Math.round(p.nutriments?.fat_100g ?? 0),
            CHOCDF: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
            FIBTG: Math.round(p.nutriments?.fiber_100g ?? 0),
          },
          image: p.image_front_small_url || undefined,
        };
      });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.warn('OFF isteği zaman aşımına uğradı:', query);
    } else {
      console.warn('OFF fetch hatası:', err);
    }
    return [];
  }
}

// ─── Ana Arama: Türkçe + İngilizce paralel ───────────────────────
async function searchFoods(query: string): Promise<FoodItem[]> {
  const translatedQuery = translateToEnglish(query);
  const isSameQuery = translatedQuery.toLowerCase() === query.toLowerCase();

  try {
    // Türkçe ve İngilizce aramaları paralel yap
    const promises: Promise<FoodItem[]>[] = [fetchFromOFF(query)];
    if (!isSameQuery) {
      promises.push(fetchFromOFF(translatedQuery));
    }

    const results = await Promise.all(promises);
    const merged = results.flat();

    // Tekrarları foodId'ye göre kaldır
    const seen = new Set<string>();
    const unique = merged.filter(food => {
      if (seen.has(food.foodId)) return false;
      seen.add(food.foodId);
      return true;
    });

    // Kalori verisi olanları öne al, ilk 25 sonuç
    return unique
      .filter(f => f.nutrients.ENERC_KCAL > 0)
      .slice(0, 25);
  } catch (e) {
    console.warn('Arama hatası:', e);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
const kcalForQty = (food: FoodItem, qty = 100) =>
  Math.round((food.nutrients.ENERC_KCAL * qty) / 100);

// ─── FoodResultRow ────────────────────────────────────────────────
const FoodResultRow = ({
  food,
  onAdd,
}: {
  food: FoodItem;
  onAdd: (food: FoodItem) => void;
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={rowStyles.container}>
      {food.image && !imgError ? (
        <Image
          source={{ uri: food.image }}
          style={rowStyles.image}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={rowStyles.imagePlaceholder}>
          <Icon name="restaurant" size={24} color="#32d411" />
        </View>
      )}

      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {food.label}
        </Text>
        {food.brand ? (
          <Text style={rowStyles.brand} numberOfLines={1}>
            {food.brand}
          </Text>
        ) : null}
        <Text style={rowStyles.macros}>
          {`P:${food.nutrients.PROCNT}g  Y:${food.nutrients.FAT}g  K:${food.nutrients.CHOCDF}g  •  /100g`}
        </Text>
      </View>

      <View style={rowStyles.right}>
        <Text style={rowStyles.kcal}>{food.nutrients.ENERC_KCAL} kcal</Text>
        <TouchableOpacity style={rowStyles.addBtn} onPress={() => onAdd(food)}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#f0fae8',
  },
  imagePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#f0fae8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, paddingHorizontal: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  brand: { fontSize: 11, color: '#32d411', marginBottom: 2 },
  macros: { fontSize: 11, color: '#94a3b8' },
  right: { alignItems: 'flex-end', gap: 6 },
  kcal: { fontSize: 13, fontWeight: '700', color: '#32d411' },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#32d411',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── SelectedChip ─────────────────────────────────────────────────
const SelectedChip = ({
  food,
  onRemove,
}: {
  food: SelectedFood;
  onRemove: (id: string) => void;
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={chipStyles.chip}>
      {food.image && !imgError ? (
        <Image
          source={{ uri: food.image }}
          style={chipStyles.img}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={chipStyles.imgPlaceholder}>
          <Icon name="restaurant" size={14} color="#32d411" />
        </View>
      )}
      <Text style={chipStyles.label} numberOfLines={1}>
        {food.label}
      </Text>
      <TouchableOpacity onPress={() => onRemove(food.foodId)}>
        <Icon name="close" size={16} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
};

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fae8',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 10,
    marginRight: 8,
    gap: 6,
    maxWidth: 160,
  },
  img: { width: 26, height: 26, borderRadius: 13 },
  imgPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d4f5c0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1e293b' },
});

// ─── Main Screen ──────────────────────────────────────────────────
const ManualEntryScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery]     = useState('');
  const [results, setResults]             = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const [hasSearched, setHasSearched]     = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [searchInfo, setSearchInfo]       = useState<string | null>(null);
  const { T,darkMode } = useTheme(); 
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search ────────────────────────────────────────────────────
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setErrorMsg(null);
    setSearchInfo(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (text.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);

      const translated = translateToEnglish(text.trim());
      const isSame = translated.toLowerCase() === text.trim().toLowerCase();
      setSearchInfo(
        isSame
          ? 'Aranıyor...'
          : `"${text.trim()}" → "${translated}" olarak da aranıyor...`,
      );

      const foods = await searchFoods(text.trim());

      setResults(foods);
      setHasSearched(true);
      setIsSearching(false);
      setSearchInfo(null);

      if (foods.length === 0) {
        setErrorMsg('Sonuç bulunamadı. Farklı bir kelime deneyin.');
      }
    }, 700);
  }, []);

  // ── Selection ─────────────────────────────────────────────────
  const handleAdd = (food: FoodItem) => {
    setSelectedFoods(prev => {
      const exists = prev.find(f => f.foodId === food.foodId);
      if (exists) {
        return prev.map(f =>
          f.foodId === food.foodId ? { ...f, quantity: f.quantity + 100 } : f,
        );
      }
      return [...prev, { ...food, quantity: 100 }];
    });
  };

  const handleRemove = (id: string) => {
    setSelectedFoods(prev => prev.filter(f => f.foodId !== id));
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (selectedFoods.length === 0) return;
    Keyboard.dismiss();

    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');
const logsToInsert = selectedFoods.map(food => ({
  user_id:       user.id,
  name:          food.label,        // food_name → name
  calories:      kcalForQty(food, food.quantity),
  protein:       Math.round((food.nutrients.PROCNT  * food.quantity) / 100),
  fat:           Math.round((food.nutrients.FAT     * food.quantity) / 100),
  carbs:         Math.round((food.nutrients.CHOCDF  * food.quantity) / 100),
  image_url:     food.image ?? null,
  portion_grams: food.quantity,
  ingredients:   [],
  created_at:    new Date().toISOString(),
}));

const { error } = await supabase.from('meals').insert(logsToInsert); // food_logs → meals

      
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

  // ── Totals ────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAF5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manuel Yemek Ekle</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color="#32d411"
              style={{ marginLeft: 12 }}
            />
          ) : (
            <Icon
              name="search"
              size={22}
              color="#94a3b8"
              style={{ marginLeft: 12 }}
            />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder="Yemek ara... (elma, tavuk, pilav)"
            placeholderTextColor="#94a3b8"
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
              <Icon name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {searchInfo && !errorMsg && (
          <Text style={styles.infoText}>{searchInfo}</Text>
        )}
        {errorMsg && <Text style={styles.hintText}>{errorMsg}</Text>}
      </View>

      {/* Results */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Empty State */}
        {!hasSearched && !isSearching && (
          <View style={styles.emptyState}>
            <Icon name="search" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Besin Ara</Text>
            <Text style={styles.emptySubtitle}>
              Türkçe yazın, otomatik İngilizce{'\n'}
              karşılığı da aranır.{'\n\n'}
              (örn: elma → apple ürünleri de çıkar)
            </Text>
          </View>
        )}

        {/* Searching indicator */}
        {isSearching && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#32d411" />
            <Text style={styles.loadingText}>Aranıyor...</Text>
          </View>
        )}

        {/* Results list */}
        {!isSearching &&
          results.map(food => (
            <FoodResultRow key={food.foodId} food={food} onAdd={handleAdd} />
          ))}

        {/* No results */}
        {!isSearching && hasSearched && results.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="sentiment-dissatisfied" size={52} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              Farklı bir arama terimi deneyin.{'\n'}
              İngilizce de arama yapabilirsiniz.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {selectedFoods.length > 0 && (
        <View style={styles.footer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            {selectedFoods.map(food => (
              <SelectedChip
                key={food.foodId}
                food={food}
                onRemove={handleRemove}
              />
            ))}
          </ScrollView>

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.fat}g</Text>
              <Text style={styles.macroLabel}>Yağ</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.carbs}g</Text>
              <Text style={styles.macroLabel}>Karb.</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.summaryCount}>
                {totals.count} ürün seçildi
              </Text>
              <Text style={styles.summaryKcal}>
                {totals.calories} kcal toplam
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  cancelText:  { color: '#32d411', fontWeight: '600', fontSize: 15 },

  searchWrapper: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 52,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  hintText: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  infoText: {
    marginTop: 8,
    marginLeft: 4,
    fontSize: 12,
    color: '#32d411',
    fontWeight: '500',
  },

  list: { flex: 1, paddingHorizontal: 16 },

  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
  },

  loadingState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },

  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fdf4',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  macroLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  macroDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCount: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  summaryKcal:  { fontSize: 18, color: '#1e293b', fontWeight: '800', marginTop: 2 },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#32d411',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default ManualEntryScreen;