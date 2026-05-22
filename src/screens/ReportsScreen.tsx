import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, Platform, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle, Line, G, Text as SvgText } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type Timeframe = 'weekly' | 'monthly' | 'yearly';

interface DayData {
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

interface ReportData {
  days: DayData[];
  avgCalories: number;
  totalCalories: number;
  macros: { carbs: number; protein: number; fat: number };
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  streak: number;
  bestDay: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TIMEFRAME_DAYS: Record<Timeframe, number> = { weekly: 7, monthly: 30, yearly: 365 };
const TIMEFRAME_LABELS: Record<Timeframe, string> = { weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' };

function formatDate(dateStr: string, tf: Timeframe): string {
  const d = new Date(dateStr);
  if (tf === 'weekly') return ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'][d.getDay() === 0 ? 6 : d.getDay() - 1];
  if (tf === 'monthly') return `${d.getDate()}`;
  return ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()];
}

function groupByMonth(days: DayData[]): DayData[] {
  const map: Record<string, DayData> = {};
  days.forEach(d => {
    const key = d.date.slice(0, 7);
    if (!map[key]) map[key] = { date: key + '-01', calories: 0, carbs: 0, protein: 0, fat: 0 };
    map[key].calories += d.calories;
    map[key].carbs    += d.carbs;
    map[key].protein  += d.protein;
    map[key].fat      += d.fat;
  });
  return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
}

// ─── Mini Sparkline Chart ─────────────────────────────────────────────────────
const SparkLine: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({
  data, color, width = SW - 64, height = 80,
}) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const pad = 8;
  const W = width; const H = height;
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    return `${x},${y}`;
  });
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  const areaD = `${pathD} L${W - pad},${H - pad} L${pad},${H - pad} Z`;

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaD} fill="url(#sg)" />
      <Path d={pathD} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const [x, y] = p.split(',').map(Number);
        return <Circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5} fill={color} />;
      })}
    </Svg>
  );
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BarChart: React.FC<{ data: DayData[]; tf: Timeframe; color: string; goal: number }> = ({
  data, tf, color, goal,
}) => {
  const W = SW - 64; const H = 120; const pad = 4;
  const max = Math.max(...data.map(d => d.calories), goal, 1);
  const barW = Math.max(4, (W - pad * (data.length + 1)) / data.length);

  return (
    <Svg width={W} height={H + 20}>
      {/* goal line */}
      <Line
        x1={0} y1={H - (goal / max) * H}
        x2={W} y2={H - (goal / max) * H}
        stroke={color} strokeWidth={1} strokeDasharray="4,4" opacity={0.5}
      />
      {data.map((d, i) => {
        const bH = Math.max(4, (d.calories / max) * H);
        const x = pad + i * (barW + pad);
        const y = H - bH;
        const hit = d.calories >= goal * 0.9;
        const label = formatDate(d.date, tf);
        return (
          <G key={i}>
            <Rect
              x={x} y={y} width={barW} height={bH}
              rx={3} fill={hit ? color : color + '55'}
            />
            {(tf === 'weekly' || (tf === 'monthly' && i % 5 === 0) || tf === 'yearly') && (
              <SvgText x={x + barW / 2} y={H + 14} fontSize={9} fill={color + 'aa'} textAnchor="middle">
                {label}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
};

// ─── Macro Ring ───────────────────────────────────────────────────────────────
const MacroRing: React.FC<{ carbs: number; protein: number; fat: number }> = ({ carbs, protein, fat }) => {
  const size = 120; const cx = size / 2; const cy = size / 2; const r = 44; const stroke = 14;
  const circ = 2 * Math.PI * r;
  const total = carbs + protein + fat || 100;
  const cPct = carbs / total; const pPct = protein / total; const fPct = fat / total;
  const segments = [
    { pct: cPct, color: '#fb923c', label: 'Karbonhidrat' },
    { pct: pPct, color: '#60a5fa', label: 'Protein' },
    { pct: fPct, color: '#a78bfa', label: 'Yağ' },
  ];
  let offset = 0;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} fill="none" />
        {segments.map((s, i) => {
          const dash = s.pct * circ;
          const gap = circ - dash;
          const rotation = offset * 360 - 90;
          offset += s.pct;
          return (
            <Circle key={i} cx={cx} cy={cy} r={r}
              stroke={s.color} strokeWidth={stroke} fill="none"
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        {segments.map((s, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{s.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
              {Math.round(s.pct * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportsScreen = () => {
  const navigation = useNavigation();
  const { T, darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [report, setReport] = useState<ReportData | null>(null);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = TIMEFRAME_DAYS[timeframe];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch calorie goal
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('calorie_goal')
        .eq('user_id', user.id)
        .single();
      if (profile?.calorie_goal) setCalorieGoal(profile.calorie_goal);

      // Fetch food logs
      const { data } = await supabase
        .from('food_logs')
        .select('calories, carbs, protein, fat, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (!data?.length) {
        setReport(null);
        return;
      }

      // Group by day
      const dayMap: Record<string, DayData> = {};
      data.forEach(row => {
        const date = row.created_at.slice(0, 10);
        if (!dayMap[date]) dayMap[date] = { date, calories: 0, carbs: 0, protein: 0, fat: 0 };
        dayMap[date].calories += row.calories || 0;
        dayMap[date].carbs    += row.carbs    || 0;
        dayMap[date].protein  += row.protein  || 0;
        dayMap[date].fat      += row.fat      || 0;
      });

      let dayArr = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
      if (timeframe === 'yearly') dayArr = groupByMonth(dayArr);

      const totalCal  = dayArr.reduce((s, d) => s + d.calories, 0);
      const totalC    = dayArr.reduce((s, d) => s + d.carbs, 0);
      const totalP    = dayArr.reduce((s, d) => s + d.protein, 0);
      const totalF    = dayArr.reduce((s, d) => s + d.fat, 0);
      const n         = dayArr.length || 1;
      const totalMacro = totalC + totalP + totalF || 1;

      // Streak
      let streak = 0;
      const today = new Date().toISOString().slice(0, 10);
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (dayMap[key] && dayMap[key].calories > 0) streak++;
        else if (key !== today) break;
      }

      setReport({
        days: dayArr,
        avgCalories:  Math.round(totalCal / n),
        totalCalories: Math.round(totalCal),
        macros: {
          carbs:   Math.round((totalC / totalMacro) * 100),
          protein: Math.round((totalP / totalMacro) * 100),
          fat:     Math.round((totalF / totalMacro) * 100),
        },
        avgProtein: Math.round(totalP / n),
        avgCarbs:   Math.round(totalC / n),
        avgFat:     Math.round(totalF / n),
        streak,
        bestDay: Math.max(...dayArr.map(d => d.calories)),
      });
    } catch (err) {
      console.error('Rapor hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const S = makeStyles(T, darkMode);

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={S.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Raporlar</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Timeframe Tabs */}
      <View style={S.tabs}>
        {(['weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
          <TouchableOpacity
            key={tf}
            style={[S.tab, timeframe === tf && S.tabActive]}
            onPress={() => setTimeframe(tf)}
            activeOpacity={0.7}
          >
            <Text style={[S.tabTxt, timeframe === tf && S.tabTxtActive]}>
              {TIMEFRAME_LABELS[tf]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={S.loader}>
          <ActivityIndicator size="large" color={T.primary} />
          <Text style={S.loaderTxt}>Veriler yükleniyor…</Text>
        </View>
      ) : !report ? (
        <View style={S.loader}>
          <Text style={{ fontSize: 40 }}>📊</Text>
          <Text style={[S.loaderTxt, { marginTop: 12 }]}>Henüz veri yok</Text>
          <Text style={{ color: T.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            Yemek kaydetmeye başlayınca{'\n'}grafikler burada görünecek
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero Stats ── */}
          <View style={S.heroRow}>
            <View style={[S.heroCard, { flex: 1 }]}>
              <Text style={S.heroLabel}>Ort. Kalori</Text>
              <Text style={S.heroValue}>{report.avgCalories}</Text>
              <Text style={S.heroUnit}>kal / gün</Text>
              <View style={[S.heroBadge, {
                backgroundColor: report.avgCalories >= calorieGoal * 0.85 && report.avgCalories <= calorieGoal * 1.1
                  ? T.primary + '30' : '#ef444420',
              }]}>
                <Text style={[S.heroBadgeTxt, {
                  color: report.avgCalories >= calorieGoal * 0.85 && report.avgCalories <= calorieGoal * 1.1
                    ? T.primary : '#ef4444',
                }]}>
                  {report.avgCalories >= calorieGoal * 0.85 && report.avgCalories <= calorieGoal * 1.1
                    ? '✓ Hedefte' : report.avgCalories < calorieGoal * 0.85 ? '↓ Düşük' : '↑ Yüksek'}
                </Text>
              </View>
            </View>
            <View style={{ gap: 10, flex: 0.9 }}>
              <View style={[S.heroCard, S.heroSmall]}>
                <Text style={S.heroLabel}>🔥 Seri</Text>
                <Text style={[S.heroValue, { fontSize: 26 }]}>{report.streak}</Text>
                <Text style={S.heroUnit}>gün</Text>
              </View>
              <View style={[S.heroCard, S.heroSmall]}>
                <Text style={S.heroLabel}>⚡ En İyi</Text>
                <Text style={[S.heroValue, { fontSize: 26 }]}>{report.bestDay}</Text>
                <Text style={S.heroUnit}>kal</Text>
              </View>
            </View>
          </View>

          {/* ── Calorie Chart ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>Kalori Takibi</Text>
              <View style={S.goalPill}>
                <Text style={S.goalPillTxt}>Hedef {calorieGoal} kal</Text>
              </View>
            </View>
            <View style={{ marginTop: 8 }}>
              <BarChart data={report.days} tf={timeframe} color={T.primary} goal={calorieGoal} />
            </View>
            <View style={S.chartLegend}>
              <View style={S.legendDot} />
              <Text style={S.legendTxt}>Hedef çizgisi</Text>
            </View>
          </View>

          {/* ── Macro Distribution ── */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Makro Dağılımı</Text>
            <View style={S.macroRingRow}>
              <MacroRing
                carbs={report.macros.carbs}
                protein={report.macros.protein}
                fat={report.macros.fat}
              />
              <View style={{ gap: 10, flex: 1 }}>
                {[
                  { label: 'Karbonhidrat', val: report.avgCarbs, unit: 'g/gün', color: '#fb923c' },
                  { label: 'Protein',      val: report.avgProtein, unit: 'g/gün', color: '#60a5fa' },
                  { label: 'Yağ',          val: report.avgFat,     unit: 'g/gün', color: '#a78bfa' },
                ].map(m => (
                  <View key={m.label} style={S.macroStatRow}>
                    <View style={[S.macroDot, { backgroundColor: m.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={S.macroStatLabel}>{m.label}</Text>
                      <View style={S.macroBarBg}>
                        <View style={[S.macroBarFill, {
                          width: `${Math.min(100, (m.val / (m.label === 'Protein' ? 200 : m.label === 'Karbonhidrat' ? 300 : 100)) * 100)}%`,
                          backgroundColor: m.color,
                        }]} />
                      </View>
                    </View>
                    <Text style={[S.macroStatVal, { color: m.color }]}>{m.val}g</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Protein Trend ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>Protein Trendi</Text>
              <Text style={[S.cardSub, { color: '#60a5fa' }]}>Ort. {report.avgProtein}g/gün</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <SparkLine data={report.days.map(d => d.protein)} color="#60a5fa" />
            </View>
          </View>

          {/* ── Calorie Trend (line) ── */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <Text style={S.cardTitle}>Kalori Trendi</Text>
              <Text style={[S.cardSub, { color: T.primary }]}>Toplam {report.totalCalories.toLocaleString()} kal</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <SparkLine data={report.days.map(d => d.calories)} color={T.primary} />
            </View>
          </View>

          {/* ── Summary Table ── */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Özet</Text>
            <View style={{ marginTop: 12, gap: 0 }}>
              {[
                { label: 'Toplam Kalori',    val: `${report.totalCalories.toLocaleString()} kal` },
                { label: 'Ort. Kalori/Gün',  val: `${report.avgCalories} kal` },
                { label: 'Ort. Protein/Gün', val: `${report.avgProtein}g` },
                { label: 'Ort. Karbonhidrat/Gün', val: `${report.avgCarbs}g` },
                { label: 'Ort. Yağ/Gün',    val: `${report.avgFat}g` },
                { label: 'Kayıt Serisi',     val: `${report.streak} gün` },
              ].map((row, i, arr) => (
                <View key={row.label} style={[
                  S.sumRow,
                  i < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: T.border },
                ]}>
                  <Text style={S.sumLabel}>{row.label}</Text>
                  <Text style={S.sumVal}>{row.val}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (T: any, darkMode: boolean) => StyleSheet.create({
  root:         { flex: 1, backgroundColor: T.bg },
  header:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    paddingBottom: 12,
  },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow:    { fontSize: 22, color: T.text, fontWeight: '300' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: T.text },

  tabs:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: T.surface, borderRadius: 14, padding: 4 },
  tab:          { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center' },
  tabActive:    { backgroundColor: T.primary },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: T.muted },
  tabTxtActive: { color: '#fff' },

  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loaderTxt:    { fontSize: 15, color: T.muted },

  scroll:       { paddingHorizontal: 16, paddingTop: 4 },

  heroRow:      { flexDirection: 'row', gap: 10, marginBottom: 14 },
  heroCard:     { backgroundColor: T.card, borderRadius: 18, borderWidth: 0.5, borderColor: T.border, padding: 16, gap: 2 },
  heroSmall:    { paddingVertical: 12 },
  heroLabel:    { fontSize: 11, color: T.muted, fontWeight: '600', letterSpacing: 0.3 },
  heroValue:    { fontSize: 34, fontWeight: '800', color: T.text, lineHeight: 38 },
  heroUnit:     { fontSize: 12, color: T.muted },
  heroBadge:    { marginTop: 8, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  heroBadgeTxt: { fontSize: 12, fontWeight: '700' },

  card:         { backgroundColor: T.card, borderRadius: 18, borderWidth: 0.5, borderColor: T.border, padding: 16, marginBottom: 14 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: T.text },
  cardSub:      { fontSize: 12, fontWeight: '600' },

  goalPill:     { backgroundColor: T.primary + '20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  goalPillTxt:  { fontSize: 11, fontWeight: '700', color: T.primary },

  chartLegend:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  legendDot:    { width: 16, height: 2, backgroundColor: T.primary, opacity: 0.5 },
  legendTxt:    { fontSize: 11, color: T.muted },

  macroRingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  macroStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot:     { width: 8, height: 8, borderRadius: 4 },
  macroStatLabel: { fontSize: 11, color: T.muted, marginBottom: 3 },
  macroBarBg:   { height: 5, borderRadius: 3, backgroundColor: T.border, overflow: 'hidden' },
  macroBarFill: { height: 5, borderRadius: 3 },
  macroStatVal: { fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  sumRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  sumLabel:     { fontSize: 14, color: T.muted, fontWeight: '500' },
  sumVal:       { fontSize: 14, color: T.text, fontWeight: '600' },
});

export default ReportsScreen;