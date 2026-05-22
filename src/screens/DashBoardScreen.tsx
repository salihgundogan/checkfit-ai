import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Feather';

import { supabase } from '../lib/supabase';
import MealCard from '../components/MealCard';
import { useTheme } from './ThemeContext';
const { width } = Dimensions.get('window');

// ── RENK PALETİ ──────────────────────────────────────────────────────────────
const C = {
  primary:     '#4A7C59',
  accent:      '#13ec54',
  accentLight: 'rgba(19,236,84,0.13)',
  bg:          '#F9FAF5',
  card:        '#FFFFFF',
  border:      '#E8EAE5',
  text:        '#0d1b0e',
  textMuted:   '#6b7280',
  blue:        '#3b82f6',
  orange:      '#f97316',
  danger:      '#ef4444',
  surface:     '#f3f5f0',
};

// ── KALORİ HALKASI ────────────────────────────────────────────────────────────
const RING_SIZE = 180;
const STROKE    = 16;
const RADIUS    = (RING_SIZE - STROKE) / 2;
const CIRCUM    = 2 * Math.PI * RADIUS;

const CalorieRing = ({
  consumed,
  target,
  isOver,
  T,
  darkMode,
}: {
  consumed: number;
  target: number;
  isOver: boolean;
  T: any;
  darkMode:any;
}) => {
  const pct       = Math.min(1, target > 0 ? consumed / target : 0);
  const offset    = CIRCUM - pct * CIRCUM;
  const remaining = Math.max(0, target - consumed);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={C.border} strokeWidth={STROKE} fill="none"
        />
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={isOver ? C.danger : C.accent}
          strokeWidth={STROKE} fill="none"
          strokeDasharray={`${CIRCUM}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={ringS.center}>
  <Text style={[ringS.value, { color: T.text }, isOver && { color: C.danger }]}>
    {remaining.toLocaleString()}
  </Text>
  <Text style={[ringS.label, { color: T.muted }]}>kcal kaldı</Text>
  <View style={[ringS.badge, { backgroundColor: darkMode ? 'rgba(74,124,89,0.25)' : 'rgba(74,124,89,0.1)' }]}>
    <Text style={[ringS.badgeText, { color: T.primary }]}>Hedef: {target.toLocaleString()}</Text>
  </View>
</View>
    </View>
  );
};

const ringS = StyleSheet.create({
  center:    { position: 'absolute', alignItems: 'center' },
  value:     { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: -1 },
  label:     { fontSize: 11, fontWeight: '600', color: C.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  badge:     { marginTop: 8, backgroundColor: 'rgba(74,124,89,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },
});

// ── MAKRO TİLİ ────────────────────────────────────────────────────────────────
const MacroTile = ({
  iconName,
  label,
  value,
  target,
  color,
}: {
  iconName: string;
  label: string;
  value: number;
  target: number;
  color: string;
}) => {
  const pct = Math.min(1, target > 0 ? value / target : 0);
  const { T } = useTheme(); 
 return (
  <View style={[macroS.tile, { backgroundColor: T.card, borderColor: T.border }]}>
    <View style={[macroS.iconBox, { backgroundColor: color + '1A' }]}>
      <Icon name={iconName} size={18} color={color} />
    </View>
    <Text style={[macroS.label, { color: T.muted }]}>{label}</Text>
    <Text style={[macroS.value, { color: T.text }]}>
      {value.toFixed(0)}
      <Text style={[macroS.unit, { color: T.muted }]}>g</Text>
    </Text>
    <View style={[macroS.track, { backgroundColor: T.border }]}>
      <View style={[macroS.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
    <Text style={[macroS.pct, { color }]}>{Math.round(pct * 100)}%</Text>
  </View>
);
};

const macroS = StyleSheet.create({
  tile:    { flex: 1, backgroundColor: C.card, borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  label:   { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 2 },
  value:   { fontSize: 20, fontWeight: '900', color: C.text },
  unit:    { fontSize: 12, fontWeight: '600', color: C.textMuted },
  track:   { width: '100%', height: 4, borderRadius: 2, backgroundColor: '#f0f0f0', marginTop: 8, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 2 },
  pct:     { fontSize: 10, fontWeight: '700', marginTop: 4 },
});

// ── ALT NAVİGASYON ────────────────────────────────────────────────────────────
type NavItemProps = {
  iconName: string;
  label: string;
  active?: boolean;
  comingSoon?: boolean;
  onPress?: () => void;
};

const NavItem = ({ iconName, label, active, comingSoon, onPress }: NavItemProps) => {
  const { T } = useTheme();
  return (
    <TouchableOpacity
      style={navS.item}
      onPress={() => {
        if (comingSoon) {
          Alert.alert('Yakında', 'Bu özellik çok yakında geliyor!');
          return;
        }
        onPress?.();
      }}
      activeOpacity={0.7}
    >
      {comingSoon && (
        <View style={navS.comingSoonBadge}>
          <Text style={navS.comingSoonText}>Yakında</Text>
        </View>
      )}
      <View style={[navS.iconWrap, active && navS.iconWrapActive]}>
        <Icon name={iconName} size={20} color={active ? C.primary : T.muted} />
      </View>
      <Text style={[navS.label, { color: T.muted }, active && navS.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const navS = StyleSheet.create({
  item:            { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconWrap:        { width: 40, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  iconWrapActive:  { backgroundColor: 'rgba(19,236,84,0.14)' },
  label:           { fontSize: 10, fontWeight: '500', color: C.textMuted, letterSpacing: 0.2 },
  labelActive:     { color: C.primary, fontWeight: '800' },
  comingSoonBadge: {
    position: 'absolute', top: -18, left: '50%',
    transform: [{ translateX: -22 }],
    backgroundColor: C.primary, paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 20, zIndex: 10,
  },
  comingSoonText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});

// ── TİPLER ───────────────────────────────────────────────────────────────────
type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_url: string | null;
  created_at: string;
};

// ── ANA BİLEŞEN ───────────────────────────────────────────────────────────────
const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { T,darkMode } = useTheme();
  const [userName, setUserName]     = useState('Misafir');
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [greeting, setGreeting]     = useState('Merhaba');

  const [dailyStats, setDailyStats] = useState({ cal: 0, protein: 0, carbs: 0, fat: 0 });
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);

  // Supabase'den gelen hedefler
  const [targets, setTargets] = useState({
    calories: 2000,
    protein:  150,
    carbs:    250,
    fat:      70,
  });

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12)      setGreeting('Günaydın');
    else if (h < 18) setGreeting('İyi günler');
    else             setGreeting('İyi akşamlar');
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('pref_name, avatar_url, calorie_goal, protein_goal, carb_goal, fat_goal')
        .eq('id', user.id)
        .single();

      if (data?.pref_name)  setUserName(data.pref_name);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);

      // Makro hedefleri güncelle
      setTargets({
        calories: data?.calorie_goal ?? 2000,
        protein:  data?.protein_goal ?? 150,
        carbs:    data?.carb_goal    ?? 250,
        fat:      data?.fat_goal     ?? 70,
      });
    } catch (e) {
      console.error('Profil yükleme hatası:', e);
    }
  }, []);

  const fetchDailyLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay   = new Date(); endOfDay.setHours(23, 59, 59, 999);

      const [mealsRes, logsRes] = await Promise.all([
        supabase
          .from('meals')
          .select('id, name, calories, protein, carbs, fat, image_url, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('food_logs')
          .select('calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString()),
      ]);

      const meals = (mealsRes.data || []) as Meal[];
      setTodayMeals(meals);

      const sum = (acc: any, cur: any) => ({
        cal:     acc.cal     + (Number(cur.calories) || 0),
        protein: acc.protein + (Number(cur.protein)  || 0),
        carbs:   acc.carbs   + (Number(cur.carbs)    || 0),
        fat:     acc.fat     + (Number(cur.fat)      || 0),
      });
      const zero = { cal: 0, protein: 0, carbs: 0, fat: 0 };
      const m = meals.reduce(sum, zero);
      const l = (logsRes.data || []).reduce(sum, zero);

      setDailyStats({
        cal:     m.cal     + l.cal,
        protein: m.protein + l.protein,
        carbs:   m.carbs   + l.carbs,
        fat:     m.fat     + l.fat,
      });
    } catch (e) {
      console.error('Log çekme hatası:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
      fetchDailyLogs();
    }, [fetchUserProfile, fetchDailyLogs])
  );

  const isOver = dailyStats.cal >= targets.calories;

  // Saat formatı
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{loading ? '…' : userName}</Text>
          </View>
          <TouchableOpacity
            style={s.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={s.onlineDot} />
          </TouchableOpacity>
        </View>

        {/* ── TARİH ŞERİDİ ── */}
        <View style={s.dateRow}>
          <Text style={s.dateText}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <View style={s.todayBadge}>
            <Text style={s.todayText}>Bugün</Text>
          </View>
        </View>

        {/* ── KALORİ HALKA ── */}
<View style={[s.ringCard, { backgroundColor: T.card, borderColor: T.border }]}>
  <CalorieRing consumed={dailyStats.cal} target={targets.calories} isOver={isOver} T={T} darkMode={darkMode} />
  <View style={s.ringMeta}>
    <View style={s.ringMetaItem}>
      <Text style={[s.ringMetaLabel, { color: T.muted }]}>Alınan</Text>
      <Text style={[s.ringMetaValue, { color: T.text }]}>{dailyStats.cal.toLocaleString()}</Text>
      <Text style={[s.ringMetaUnit, { color: T.muted }]}>kcal</Text>
    </View>
    <View style={[s.ringDivider, { backgroundColor: T.border }]} />
    <View style={s.ringMetaItem}>
      <Text style={[s.ringMetaLabel, { color: T.muted }]}>Hedef</Text>
      <Text style={[s.ringMetaValue, { color: T.text }]}>{targets.calories.toLocaleString()}</Text>
      <Text style={[s.ringMetaUnit, { color: T.muted }]}>kcal</Text>
    </View>
  </View>
</View>

        {/* ── MAKROLAR ── */}
        <View style={s.macroRow}>
          <MacroTile iconName="layers"  label="Karb"    value={dailyStats.carbs}   target={targets.carbs}   color={C.blue}   />
          <MacroTile iconName="zap"     label="Protein" value={dailyStats.protein} target={targets.protein} color={C.accent} />
          <MacroTile iconName="droplet" label="Yağ"     value={dailyStats.fat}     target={targets.fat}     color={C.orange} />
        </View>

       {/* ── BUGÜNKÜ AKTİVİTE ── */}
<View style={s.section}>
  <View style={s.sectionHeader}>
    <Text style={[s.sectionTitle]}>Bugünkü Aktivite</Text>
    <TouchableOpacity style={[s.seeAllBtn, { backgroundColor: darkMode ? 'rgba(74,124,89,0.2)' : '#e8fde9' }]} onPress={() => navigation.navigate('Progress')}>
      <Text style={[s.seeAllText, { color: T.primary }]}>Geçmiş →</Text>
    </TouchableOpacity>
  </View>

          {todayMeals.length > 0 ? (
           <View style={s.mealList}>
  {todayMeals.map((meal) => (
    <View key={meal.id} style={[s.mealItem, { backgroundColor: T.card, borderColor: T.border }]}>
      {meal.image_url ? (
        <Image source={{ uri: meal.image_url }} style={s.mealImage} />
      ) : (
        <View style={[s.mealImage, s.mealImagePlaceholder, { backgroundColor: T.surface }]}>
          <Icon name="coffee" size={20} color={T.muted} />
        </View>
                  )}
                  <View style={s.mealInfo}>
                   <Text style={[s.mealName, { color: T.text }]}>{meal.name}</Text>
                    <Text style={[s.mealMacros, { color: T.muted }]}>
                      P: {Number(meal.protein).toFixed(0)}g · K: {Number(meal.carbs).toFixed(0)}g · Y: {Number(meal.fat).toFixed(0)}g
                    </Text>
                    <Text style={[s.mealTime, { color: T.muted }]}>{formatTime(meal.created_at)}</Text>
                  </View>
                  <View style={s.mealCalBadge}>
                    <Text style={s.mealCalValue}>{Number(meal.calories).toLocaleString()}</Text>
                    <Text style={s.mealCalUnit}>kcal</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <MealCard
              mealType="Henüz Kayıt Yok"
              isEmpty
              onAddPress={() => navigation.navigate('AICamera')}
            />
          )}
        </View>

       {/* ── HIZLI EYLEMLER ── */}
<View style={s.quickRow}>
  <TouchableOpacity
    style={[s.quickBtn, { backgroundColor: darkMode ? 'rgba(74,124,89,0.2)' : '#e8fde9' }]}
    onPress={() => navigation.navigate('AICamera')}
    activeOpacity={0.8}
  >
    <View style={[s.quickIconWrap, { backgroundColor: darkMode ? 'rgba(74,124,89,0.3)' : '#bbf7d0' }]}>
      <Icon name="camera" size={20} color={T.primary} />
    </View>
    <Text style={[s.quickLabel, { color: T.primary }]}>Fotoğrafla Ekle</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[s.quickBtn, { backgroundColor: darkMode ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}
    onPress={() => navigation.navigate('Progress')}
    activeOpacity={0.8}
  >
    <View style={[s.quickIconWrap, { backgroundColor: darkMode ? 'rgba(59,130,246,0.25)' : '#bfdbfe' }]}>
      <Icon name="bar-chart-2" size={20} color="#3b82f6" />
    </View>
    <Text style={[s.quickLabel, { color: '#3b82f6' }]}>İlerlemeyi Gör</Text>
  </TouchableOpacity>
</View>

<View style={{ height: 120 }} />
      </ScrollView>

      {/* ── MODERN ALT NAVİGASYON ── */}
      <View style={navBarS.wrapper}>
        <View style={[navBarS.bar, { backgroundColor: T.card, borderColor: T.border }]}>
          <NavItem iconName="grid" label="Özet" active />
          <NavItem iconName="activity" label="Geçmiş" onPress={() => navigation.navigate('Progress')} />
          <TouchableOpacity
            style={navBarS.fabSlot}
            onPress={() => navigation.navigate('AICamera')}
            activeOpacity={0.85}
          >
            <View style={navBarS.fab}>
              <Icon name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          <NavItem iconName="cpu" label="Asistan" comingSoon />
          <NavItem iconName="settings" label="Ayarlar" onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ── STİLLER ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { paddingHorizontal: 20, paddingTop: 8 },

  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting:         { fontSize: 13, color: C.textMuted, fontWeight: '500', letterSpacing: 0.3 },
  userName:         { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  avatarBtn:        { borderRadius: 28, borderWidth: 2.5, borderColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarImg:        { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder:{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  onlineDot:        { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: C.accent, borderWidth: 2.5, borderColor: C.bg },

  dateRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText:  { fontSize: 13, color: C.textMuted, fontWeight: '500', textTransform: 'capitalize' },
  todayBadge:{ backgroundColor: C.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  todayText: { fontSize: 11, fontWeight: '800', color: C.text },

  ringCard:      { backgroundColor: C.card, borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, gap: 16 },
  ringMeta:      { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringMetaItem:  { alignItems: 'center' },
  ringMetaLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 2 },
  ringMetaValue: { fontSize: 22, fontWeight: '900', color: C.text },
  ringMetaUnit:  { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  ringDivider:   { width: 1, height: 36, backgroundColor: C.border },

  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },

  section:       { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: '800', color: C.text },
  seeAllBtn:     { backgroundColor: '#e8fde9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  seeAllText:    { fontSize: 12, color: '#15803d', fontWeight: '700' },

  mealList:             { gap: 10 },
  mealItem:             { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, gap: 12 },
  mealImage:            { width: 52, height: 52, borderRadius: 12 },
  mealImagePlaceholder: { backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
  mealInfo:             { flex: 1 },
  mealName:             { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  mealMacros:           { fontSize: 11, color: C.textMuted, fontWeight: '500', marginBottom: 2 },
  mealTime:             { fontSize: 11, color: C.textMuted },
  mealCalBadge:         { alignItems: 'center', backgroundColor: C.accentLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  mealCalValue:         { fontSize: 16, fontWeight: '900', color: C.primary },
  mealCalUnit:          { fontSize: 10, fontWeight: '600', color: C.primary },

  quickRow:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickBtn:     { flex: 1, borderRadius: 18, paddingVertical: 16, alignItems: 'center', gap: 8 },
  quickIconWrap:{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickLabel:   { fontSize: 12, fontWeight: '700' },
});

const navBarS = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 16, left: 12, right: 12 },
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 32,
    paddingVertical: 10, paddingHorizontal: 10,
    height: 72,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 12,
    borderWidth: 1, borderColor: C.border,
  },
  fabSlot: { marginTop: -28, alignItems: 'center' },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3.5, borderColor: C.bg,
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
});

export default DashboardScreen;