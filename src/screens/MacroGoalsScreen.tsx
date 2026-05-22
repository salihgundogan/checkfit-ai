/**
 * MacroGoalsScreen.tsx
 * Profesyonel Kalori & Makro Hedef Ekranı
 * - Otomatik TDEE hesaplama (Harris-Benedict + aktivite faktörü)
 * - Manuel kalori & protein/karb/yağ hedefi ayarlama
 * - Supabase'e kaydetme
 * - Dark mode desteği
 *
 * Navigator'a ekle: <Stack.Screen name="MacroGoals" component={MacroGoalsScreen} />
 * Gerekli tablo sütunları: calorie_goal, protein_goal, carb_goal, fat_goal (integer)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
  TextInput, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';
// ─── Theme (SettingsScreen ile aynı) ─────────────────────────────────────────

const LIGHT = {
  bg: '#F9FAF5', card: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
  text: '#0d1b0e', muted: '#6b7280',
  primary: '#4A7C59', surface: '#f3f5f0', inputBg: '#f0f2f5',
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const PROTEIN_KCAL = 4;
const CARB_KCAL    = 4;
const FAT_KCAL     = 9;

/** Makro dağılım önerileri */
const PRESETS = [
  { label: 'Dengeli',    desc: 'Genel sağlık',       p: 25, c: 50, f: 25 },
  { label: 'Yüksek Pro', desc: 'Kas kazanımı',        p: 35, c: 40, f: 25 },
  { label: 'Düşük Karb', desc: 'Yağ yakımı',          p: 35, c: 25, f: 40 },
  { label: 'Ketojenik',  desc: 'Yüksek yağ protokolü', p: 20, c: 5,  f: 75 },
];

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── Bileşenler ───────────────────────────────────────────────────────────────

const T = LIGHT; // tek renk paleti (ileride dark mode parametresi geçilebilir)

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { T } = useTheme();
  return (
    <View style={ms.section}>
      <Text style={[ms.sectionTitle, { color: T.text }]}>{title}</Text>
      {children}
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => {
  const { T, darkMode } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: darkMode ? '#fff' : T.text }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: accent ? T.primary : T.text }}>{value}</Text>
    </View>
  );
};

/** Makro yüzdesi slider satırı */
const MacroSliderRow: React.FC<{
  label: string; emoji: string; color: string;
  pct: number; kcal: number;
  onInc: () => void; onDec: () => void;
}> = ({ label, emoji, color, pct, kcal, onInc, onDec }) => (
 <View style={ms.macroRow}>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
    <View style={[ms.macroEmoji, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
    <View>
      <Text style={[ms.macroLabel, { color: T.text }]}>{label}</Text>
      <Text style={[ms.macroPct, { color }]}>{pct}% · {kcal} kal</Text>
    </View>
  </View>

  <View style={ms.stepper}>
    <TouchableOpacity onPress={onDec} style={[ms.stepBtn, { backgroundColor: T.surface }]} activeOpacity={0.7}>
      <Text style={[ms.stepTxt, { color: T.text }]}>−</Text>  
    </TouchableOpacity>
    <Text style={[ms.stepVal, { color: T.text }]}>{pct}%</Text>
    <TouchableOpacity onPress={onInc} style={[ms.stepBtn, { backgroundColor: T.surface }]} activeOpacity={0.7}>
      <Text style={[ms.stepTxt, { color: T.text }]}>+</Text>  
    </TouchableOpacity>
  </View>
</View>
);

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

const MacroGoalsScreen: React.FC = () => {
  const navigation = useNavigation();

  // Profil verisi
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [saving,  setSaving]          = useState(false);

  // Hedefler
  const [calorieGoal,  setCalorieGoal]  = useState(2000);
  const [proteinPct,   setProteinPct]   = useState(25);
  const [carbPct,      setCarbPct]      = useState(50);
  const [fatPct,       setFatPct]       = useState(25);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [manualMode,   setManualMode]   = useState(false);
  const [calorieInput, setCalorieInput] = useState('2000');
  const { T, darkMode } = useTheme();
  // ── Profil & Mevcut Hedefleri Çek ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('weight, height, age, gender, activity_level, goal, calorie_goal, protein_goal, carb_goal, fat_goal')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setProfileData(data);

        if (data.calorie_goal) {
          setCalorieGoal(data.calorie_goal);
          setCalorieInput(String(data.calorie_goal));
        } else {
          const tdee = calcTDEE(data);
          setCalorieGoal(Math.round(tdee));
          setCalorieInput(String(Math.round(tdee)));
        }

        if (data.protein_goal && data.carb_goal && data.fat_goal && data.calorie_goal) {
          const totalKcal = data.calorie_goal;
          setProteinPct(Math.round((data.protein_goal * PROTEIN_KCAL / totalKcal) * 100));
          setCarbPct(Math.round((data.carb_goal    * CARB_KCAL    / totalKcal) * 100));
          setFatPct(Math.round((data.fat_goal      * FAT_KCAL     / totalKcal) * 100));
          setSelectedPreset(null);
        }
      } catch (e) { console.log('MacroGoals yükleme:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── TDEE Hesaplama (Harris-Benedict Revised) ───────────────────────────────
  const calcTDEE = (d: any): number => {
    const w = parseFloat(d?.weight) || 70;
    const h = parseFloat(d?.height) || 170;
    const a = parseInt(d?.age)       || 25;
    const g = d?.gender?.toLowerCase();

    const bmr = g === 'kadın' || g === 'female'
      ? 447.593 + 9.247 * w + 3.098 * h - 4.330 * a
      : 88.362  + 13.397 * w + 4.799 * h - 5.677 * a;

    const factors: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, athlete: 1.9,
    };
    const f = factors[d?.activity_level] ?? 1.375;
    const tdee = bmr * f;

    // Hedefe göre ayarla
    if (d?.goal === 'lose')     return tdee - 500;
    if (d?.goal === 'gain')     return tdee + 300;
    return tdee;
  };

  // ── Makro gramları hesapla ─────────────────────────────────────────────────
  const proteinG = Math.round((calorieGoal * (proteinPct / 100)) / PROTEIN_KCAL);
  const carbG    = Math.round((calorieGoal * (carbPct    / 100)) / CARB_KCAL);
  const fatG     = Math.round((calorieGoal * (fatPct     / 100)) / FAT_KCAL);
  const totalPct = proteinPct + carbPct + fatPct;

  // ── Preset uygula ──────────────────────────────────────────────────────────
  const applyPreset = (idx: number) => {
    setSelectedPreset(idx);
    const p = PRESETS[idx];
    setProteinPct(p.p); setCarbPct(p.c); setFatPct(p.f);
  };

  // ── Makro adım (toplam 100'ü geçmeden) ────────────────────────────────────
  const adjustMacro = (
    setter: (v: number) => void,
    current: number,
    dir: 1 | -1,
    otherA: number,
    otherB: number,
    otherSetterA: (v: number) => void,
    otherSetterB: (v: number) => void,
  ) => {
    const next = clamp(current + dir * 5, 5, 90);
    const diff = next - current;
    const remaining = 100 - next;
    // Diğer iki makroyu orantılı küçült/büyüt
    const totalOther = otherA + otherB;
    if (totalOther === 0) return;
    const na = Math.round((otherA / totalOther) * remaining);
    const nb = remaining - na;
    setter(next);
    otherSetterA(Math.max(5, na));
    otherSetterB(Math.max(5, nb));
    setSelectedPreset(null);
  };

  // ── Kalori kaydet ──────────────────────────────────────────────────────────
  const handleCalorieInput = (txt: string) => {
    setCalorieInput(txt);
    const v = parseInt(txt);
    if (!isNaN(v) && v > 0) setCalorieGoal(clamp(v, 800, 6000));
  };

  // ── Kaydet ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (totalPct !== 100) {
      Alert.alert('Hata', `Makro toplamı %100 olmalı. Şu an: %${totalPct}`);
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      const { error } = await supabase.from('profiles').update({
        calorie_goal: calorieGoal,
        protein_goal: proteinG,
        carb_goal:    carbG,
        fat_goal:     fatG,
      }).eq('id', user.id);
      if (error) throw error;
      Alert.alert('Kaydedildi ✓', 'Makro hedefleriniz güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Hata', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  const tdeeDisplay = profileData ? Math.round(calcTDEE(profileData)) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
       <View style={[ms.header, { backgroundColor: T.bg, borderBottomColor: T.border }]}>
    <TouchableOpacity onPress={() => navigation.goBack()}
      style={[ms.backBtn, { backgroundColor: T.surface }]} activeOpacity={0.7}>
      <Text style={[ms.backArrow, { color: T.text }]}>‹</Text>
    </TouchableOpacity>
    <Text style={[ms.headerTitle, { color: T.text }]}>Kalori & Makro Hedefleri</Text>
    <View style={{ width: 40 }} />
  </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>

        {/* ── TDEE Özeti ─────────────────────────────────────────────────── */}
        {tdeeDisplay && (
          <View style={ms.tdeeCard}>
            <Text style={ms.tdeeLabel}>Tahmini Günlük Enerji İhtiyacı (TDEE)</Text>
            <Text style={ms.tdeeValue}>{tdeeDisplay} kal</Text>
            <Text style={ms.tdeeSub}>
              {profileData?.goal === 'lose' ? '−500 kal kilo verme hedefi uygulandı' :
               profileData?.goal === 'gain' ? '+300 kal kas kazanımı hedefi uygulandı' :
               'Kilo koruma hedefi seçildi'}
            </Text>
          </View>
        )}

        {/* ── Kalori Hedefi ──────────────────────────────────────────────── */}
        <Section title="Günlük Kalori Hedefi">
         <View style={[ms.calorieCard, { backgroundColor: T.card, borderColor: T.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={ms.calLabel}>Hedef Kalori</Text>
              <View style={ms.calorieInputRow}>
                <TextInput
                  style={ms.calorieInput}
                  value={calorieInput}
                  onChangeText={handleCalorieInput}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={[ms.calUnit, { color: T.muted }]}>kal/gün</Text>
              </View>
              {calorieGoal < 1200 && (
                <Text style={ms.warning}>⚠️ 1200 kal altı sağlıksız olabilir.</Text>
              )}
            </View>
            {/* Hızlı ayar butonları */}
            <View style={ms.quickBtns}>
              {[-200, -100, +100, +200].map(d => (
                <TouchableOpacity key={d}
                  style={[ms.quickBtn, { backgroundColor: d < 0 ? '#fee2e2' : '#dcfce7' }]}
                  onPress={() => { const v = clamp(calorieGoal + d, 800, 6000); setCalorieGoal(v); setCalorieInput(String(v)); }}
                  activeOpacity={0.7}>
                  <Text style={[ms.quickBtnTxt, { color: d < 0 ? '#ef4444' : '#4A7C59' }]}>
                    {d > 0 ? `+${d}` : d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Section>

        {/* ── Hazır Dağılımlar ───────────────────────────────────────────── */}
        <Section title="Makro Dağılım Önerileri">
          <View style={ms.presetGrid}>
            {PRESETS.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => applyPreset(i)} activeOpacity={0.75}
                style={[ms.presetCard, selectedPreset === i && ms.presetCardActive]}>
                {selectedPreset === i && (
                  <View style={ms.presetCheck}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text></View>
                )}
                <Text style={[ms.presetName, selectedPreset === i && { color: T.primary }]}>{p.label}</Text>
                <Text style={ms.presetDesc}>{p.desc}</Text>
                <Text style={ms.presetMacros}>P{p.p}·K{p.c}·Y{p.f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* ── Makro Ayarı ────────────────────────────────────────────────── */}
        <Section title="Detaylı Makro Ayarı">
          {/* Toplam progress bar */}
          <View style={ms.progressWrap}>
            <View style={[ms.progressBar, { flex: proteinPct, backgroundColor: '#3b82f6' }]} />
            <View style={[ms.progressBar, { flex: carbPct,    backgroundColor: '#f97316' }]} />
            <View style={[ms.progressBar, { flex: fatPct,     backgroundColor: '#8b5cf6' }]} />
          </View>
          <Text style={[ms.totalPctTxt, { color: totalPct === 100 ? T.primary : '#ef4444' }]}>
            Toplam: %{totalPct} {totalPct === 100 ? '✓' : `(${totalPct > 100 ? 'fazla' : 'eksik'})`}
          </Text>

          <View style={[ms.macroCard, {  }]}>
  <MacroSliderRow label="Protein" emoji="🥩" color="#3b82f6"
    pct={proteinPct} kcal={Math.round(calorieGoal * proteinPct / 100)}
    onInc={() => adjustMacro(setProteinPct, proteinPct,  1, carbPct, fatPct, setCarbPct, setFatPct)}
    onDec={() => adjustMacro(setProteinPct, proteinPct, -1, carbPct, fatPct, setCarbPct, setFatPct)} />
  <View style={[ms.macroDivider, { backgroundColor: T.border }]} />
  <MacroSliderRow label="Karbonhidrat" emoji="🍞" color="#f57316"
    pct={carbPct} kcal={Math.round(calorieGoal * carbPct / 100)}
    onInc={() => adjustMacro(setCarbPct, carbPct,  1, proteinPct, fatPct, setProteinPct, setFatPct)}
    onDec={() => adjustMacro(setCarbPct, carbPct, -1, proteinPct, fatPct, setProteinPct, setFatPct)} />
  <View style={[ms.macroDivider, { backgroundColor: T.border }]} />
  <MacroSliderRow label="Yağ" emoji="🥑" color="#8b5cf6"
    pct={fatPct} kcal={Math.round(calorieGoal * fatPct / 100)}
    onInc={() => adjustMacro(setFatPct, fatPct,  1, proteinPct, carbPct, setProteinPct, setCarbPct)}
    onDec={() => adjustMacro(setFatPct, fatPct, -1, proteinPct, carbPct, setProteinPct, setCarbPct)} />
</View>
        </Section>

       {/* ── Özet ── */}
<Section title="Günlük Hedef Özeti">
  <View style={[ms.summaryCard, { backgroundColor: T.card, borderColor: T.border }]}>
    <InfoRow label="Toplam Kalori" value={`${calorieGoal} kal`} accent />
    <View style={[ms.macroDivider, { backgroundColor: T.border }]} />
    <InfoRow label="🥩 Protein"      value={`${proteinG}g · ${Math.round(calorieGoal * proteinPct / 100)} kal`} />
    <View style={[ms.macroDivider, ]} />
    <InfoRow label="🍞 Karbonhidrat" value={`${carbG}g · ${Math.round(calorieGoal * carbPct / 100)} kal`} />
    <View style={[ms.macroDivider, ]} />
    <InfoRow label="🥑 Yağ"          value={`${fatG}g · ${Math.round(calorieGoal * fatPct / 100)} kal`} />
  </View>
</Section>
      </ScrollView>

      {/* ── Kaydet Butonu ─────────────────────────────────────────────────── */}
      <View style={ms.saveBar}>
        <TouchableOpacity style={[ms.saveBtn, { opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={ms.saveTxt}>Hedefleri Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    paddingBottom: 14,
    backgroundColor: T.bg, borderBottomWidth: 0.5, borderBottomColor: T.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, fontWeight: '300', color: T.text },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: T.text, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },

  tdeeCard: {
    marginTop: 20, backgroundColor: T.primary, borderRadius: 20,
    padding: 20, alignItems: 'center', gap: 4,
  },
  tdeeLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  tdeeValue: { fontSize: 36, fontWeight: '800', color: '#fff' },
  tdeeSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  calorieCard: {
    backgroundColor: T.card, borderRadius: 18, borderWidth: 0.5, borderColor: T.border,
    padding: 16, gap: 14,
  },
  calLabel: { fontSize: 12, fontWeight: '600', color: T.muted, marginBottom: 4 },
  calorieInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  calorieInput: {
    fontSize: 40, fontWeight: '800', color: T.primary,
    borderBottomWidth: 2, borderBottomColor: T.primary, minWidth: 100, paddingBottom: 2,
  },
  calUnit: { fontSize: 14, color: T.muted, fontWeight: '500' },
  warning: { fontSize: 12, color: '#ef4444', marginTop: 6 },
  quickBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  quickBtnTxt: { fontSize: 13, fontWeight: '700' },

  presetGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  presetCard: {
    width: '47%', borderRadius: 16, borderWidth: 1.5, borderColor: T.border,
    backgroundColor: T.card, padding: 14, gap: 3, position: 'relative',
  },
  presetCardActive: { borderColor: T.primary, backgroundColor: 'rgba(74,124,89,0.06)' },
  presetCheck: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18,
    borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
  },
  presetName:   { fontSize: 14, fontWeight: '700', color: T.text },
  presetDesc:   { fontSize: 11, color: T.muted },
  presetMacros: { fontSize: 11, fontWeight: '600', color: T.primary, marginTop: 4 },

  progressWrap: { flexDirection: 'row', height: 10, borderRadius: 10, overflow: 'hidden', marginBottom: 6, gap: 2 },
  progressBar:  { height: 10, borderRadius: 10 },
  totalPctTxt:  { fontSize: 12, fontWeight: '700', marginBottom: 12, textAlign: 'right' },

  macroCard: { backgroundColor: T.card, borderRadius: 18, borderWidth: 0.5, borderColor: T.border, overflow: 'hidden' },
  macroRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  macroEmoji: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  macroLabel: { fontSize: 14, fontWeight: '600', color: T.text },
  macroPct:   { fontSize: 12, fontWeight: '500', marginTop: 2 },
  stepper:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontSize: 18, fontWeight: '600', lineHeight: 22, color: T.text },
  stepVal:    { fontSize: 13, fontWeight: '700', color: T.text, minWidth: 36, textAlign: 'center' },
  macroDivider: { height: 0.5, backgroundColor: T.border, marginHorizontal: 14 },

  summaryCard: { backgroundColor: T.card, borderRadius: 18, borderWidth: 0.5, borderColor: T.border, overflow: 'hidden' },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  infoLabel:   { fontSize: 14, color: T.muted, fontWeight: '500' },
  infoValue:   { fontSize: 14, color: T.text, fontWeight: '600' },

  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 36,
    paddingTop: 12,
    backgroundColor: 'rgba(249,250,245,0.97)',
    borderTopWidth: 0.5, borderTopColor: T.border,
  },
  saveBtn: {
    height: 56, borderRadius: 28, backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MacroGoalsScreen;