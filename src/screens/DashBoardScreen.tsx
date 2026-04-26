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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Supabase Bağlantısı
import { supabase } from '../lib/supabase';

// Bileşenler
import MacroCard from '../components/MacroCard';
import MealCard from '../components/MealCard';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  
  const [userName, setUserName] = useState('Misafir');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // ✅ GERÇEK AVATAR
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({ cal: 0, protein: 0, carbs: 0, fat: 0 });
  const [greeting, setGreeting] = useState('Merhaba');
  
  // Hedef Değerler
  const CALORIE_TARGET = 2000;
  const PROTEIN_TARGET = 150;
  const CARBS_TARGET = 250;
  const FAT_TARGET = 70;

  // Günün saatine göre selamlama
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi günler');
    else setGreeting('İyi akşamlar');
  }, []);

  // ✅ Kullanıcı profilini + avatar_url çekme
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('pref_name, avatar_url') // avatar_url eklendi
          .eq('id', user.id)
          .single();

        if (data?.pref_name) setUserName(data.pref_name);
        if (data?.avatar_url) setAvatarUrl(data.avatar_url); // ✅ gerçek resim
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    }
  }, []);

  // Günlük yemek loglarını çekme
  const fetchDailyLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const isoStart = startOfDay.toISOString();
      const isoEnd = endOfDay.toISOString();

      const [mealsResponse, logsResponse] = await Promise.all([
        supabase
          .from('meals')
          .select('calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .gte('created_at', isoStart)
          .lte('created_at', isoEnd),
        supabase
          .from('food_logs')
          .select('calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .gte('created_at', isoStart)
          .lte('created_at', isoEnd)
      ]);

      const combineData = (acc: any, curr: any) => ({
        cal: acc.cal + (Number(curr.calories) || 0),
        protein: acc.protein + (Number(curr.protein) || 0),
        carbs: acc.carbs + (Number(curr.carbs) || 0),
        fat: acc.fat + (Number(curr.fat) || 0),
      });

      const mealsTotals = (mealsResponse.data || []).reduce(combineData, { cal: 0, protein: 0, carbs: 0, fat: 0 });
      const logsTotals = (logsResponse.data || []).reduce(combineData, { cal: 0, protein: 0, carbs: 0, fat: 0 });

      setDailyStats({
        cal: mealsTotals.cal + logsTotals.cal,
        protein: mealsTotals.protein + logsTotals.protein,
        carbs: mealsTotals.carbs + logsTotals.carbs,
        fat: mealsTotals.fat + logsTotals.fat,
      });

    } catch (error) {
      console.error('Log çekme hatası:', error);
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

  const remainingCalories = Math.max(0, CALORIE_TARGET - dailyStats.cal);
  const fillPercentage = Math.min(1, dailyStats.cal / CALORIE_TARGET);

  // Yarım daire progress hesabı
  const isOverLimit = dailyStats.cal >= CALORIE_TARGET;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f7f1" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{greeting} 👋</Text>
            <Text style={styles.userName}>
              {loading && dailyStats.cal === 0 ? '...' : userName}
            </Text>
          </View>

          {/* ✅ GERÇEK PROFİL RESMİ */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            {avatarUrl ? (
              <Image 
                source={{ uri: avatarUrl }} 
                style={styles.profileImage}
              />
            ) : (
              // Avatar yoksa baş harfi göster
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
        </View>

        {/* ── TARİH ŞERIDI ── */}
        <View style={styles.dateStrip}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>Bugün</Text>
          </View>
        </View>

        {/* ── KALORİ KARTİ ── */}
        <View style={styles.calorieCard}>
          {/* Sol bilgi */}
          <View style={styles.calorieLeft}>
            <View style={styles.calorieStatBox}>
              <Text style={styles.calorieStatLabel}>Alınan</Text>
              <Text style={styles.calorieStatValue}>{dailyStats.cal.toLocaleString()}</Text>
              <Text style={styles.calorieStatUnit}>kcal</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieStatBox}>
              <Text style={styles.calorieStatLabel}>Hedef</Text>
              <Text style={styles.calorieStatValue}>{CALORIE_TARGET.toLocaleString()}</Text>
              <Text style={styles.calorieStatUnit}>kcal</Text>
            </View>
          </View>

          {/* Sağ – Halka */}
          <View style={styles.ringWrapper}>
            <View style={[styles.ringOuter, isOverLimit && styles.ringOuterOver]}>
              <View style={styles.ringInner}>
                <Text style={[styles.ringMainValue, isOverLimit && { color: '#ef4444' }]}>
                  {remainingCalories.toLocaleString()}
                </Text>
                <Text style={styles.ringMainLabel}>kalan</Text>
              </View>
            </View>
            {/* Progress arc – basit çizgisel gösterim */}
            <View style={styles.ringProgressTrack}>
              <View style={[styles.ringProgressFill, { width: `${Math.round(fillPercentage * 100)}%`, backgroundColor: isOverLimit ? '#ef4444' : '#13ec22' }]} />
            </View>
            <Text style={styles.ringProgressPercent}>
              %{Math.round(fillPercentage * 100)}
            </Text>
          </View>
        </View>

        {/* ── MAKROLAR ── */}
        <View style={styles.macroRow}>
          <MacroTile
            emoji="🌾"
            label="Karb"
            value={dailyStats.carbs.toFixed(0)}
            target={CARBS_TARGET}
            color="#3b82f6"
          />
          <MacroTile
            emoji="🥚"
            label="Protein"
            value={dailyStats.protein.toFixed(0)}
            target={PROTEIN_TARGET}
            color="#13ec22"
          />
          <MacroTile
            emoji="💧"
            label="Yağ"
            value={dailyStats.fat.toFixed(0)}
            target={FAT_TARGET}
            color="#f97316"
          />
        </View>

        {/* ── BUGÜNKÜ AKTİVİTE ── */}
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugünkü Aktivite</Text>
            <TouchableOpacity 
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate('Progress')}
            >
              <Text style={styles.seeAllText}>Geçmiş →</Text>
            </TouchableOpacity>
          </View>

          {dailyStats.cal > 0 ? (
            <MealCard 
              mealType="Günlük Özet"
              foodName="AI Analiz ve Manuel Kayıtlar"
              calories={dailyStats.cal}
              imageSource={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80' }}
            />
          ) : (
            <MealCard 
              mealType="Henüz Kayıt Yok"
              isEmpty={true}
              onAddPress={() => navigation.navigate('AICamera')}
            />
          )}
        </View>

        {/* ── HIZLI EYLEMLER ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: '#e8fde9' }]}
            onPress={() => navigation.navigate('AICamera')}
          >
            <Text style={styles.quickBtnEmoji}>📸</Text>
            <Text style={[styles.quickBtnLabel, { color: '#15803d' }]}>Fotoğrafla Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: '#eff6ff' }]}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.quickBtnEmoji}>📊</Text>
            <Text style={[styles.quickBtnLabel, { color: '#1d4ed8' }]}>İlerlemeyi Gör</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── FLOATING BOTTOM BAR ── */}
      <View style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>

          <NavItem 
            icon="🏠" 
            label="Ana Sayfa" 
            active 
          />

          <NavItem 
            icon="📜" 
            label="Geçmiş" 
            onPress={() => navigation.navigate('Progress')} 
          />

          {/* Kamera merkez butonu */}
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={() => navigation.navigate('AICamera')}
            activeOpacity={0.85}
          >
            <View style={styles.cameraButtonInner}>
              <Text style={styles.cameraIcon}>📸</Text>
            </View>
          </TouchableOpacity>

          <NavItem 
            icon="🤖" 
            label="Asistan" 
          />

          <NavItem 
            icon="👤" 
            label="Profil" 
            onPress={() => navigation.navigate('Profile')} 
          />

        </View>
      </View>
    </SafeAreaView>
  );
};

// ── YARDIMCI BİLEŞENLER ──

const MacroTile = ({ emoji, label, value, target, color }: {
  emoji: string; label: string; value: string; target: number; color: string;
}) => {
  const pct = Math.min(1, Number(value) / target);
  return (
    <View style={macroStyles.tile}>
      <View style={[macroStyles.iconBox, { backgroundColor: color + '18' }]}>
        <Text style={macroStyles.emoji}>{emoji}</Text>
      </View>
      <Text style={macroStyles.label}>{label}</Text>
      <Text style={macroStyles.value}>{value}<Text style={macroStyles.unit}>g</Text></Text>
      <View style={macroStyles.track}>
        <View style={[macroStyles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[macroStyles.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
};

const NavItem = ({ icon, label, active, onPress }: {
  icon: string; label: string; active?: boolean; onPress?: () => void;
}) => (
  <TouchableOpacity 
    style={navStyles.item} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    {active ? (
      <View style={navStyles.activeBg}>
        <Text style={navStyles.activeIcon}>{icon}</Text>
      </View>
    ) : (
      <Text style={navStyles.icon}>{icon}</Text>
    )}
    <Text style={[navStyles.label, active && navStyles.labelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ── STİLLER ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f1' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  headerLeft: {},
  greetingText: { fontSize: 13, color: '#6b7280', fontWeight: '500', letterSpacing: 0.3 },
  userName: { fontSize: 24, fontWeight: '800', color: '#0d1b0e', letterSpacing: -0.5 },

  profileButton: { 
    borderRadius: 28, 
    borderWidth: 3, 
    borderColor: '#13ec22',
    shadowColor: '#13ec22',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: { width: 52, height: 52, borderRadius: 26 },
  profilePlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#13ec22',
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { fontSize: 22, fontWeight: '800', color: '#fff' },
  onlineIndicator: { 
    position: 'absolute', bottom: 1, right: 1, 
    width: 13, height: 13, 
    backgroundColor: '#13ec22', 
    borderRadius: 7, 
    borderWidth: 2.5, 
    borderColor: '#f0f7f1',
  },

  // Tarih şeridi
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: { fontSize: 13, color: '#6b7280', fontWeight: '500', textTransform: 'capitalize' },
  dateBadge: {
    backgroundColor: '#13ec22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dateBadgeText: { fontSize: 11, fontWeight: '800', color: '#0d1b0e' },

  // Kalori kartı
  calorieCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e8f5ea',
  },
  calorieLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calorieStatBox: { alignItems: 'center' },
  calorieStatLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  calorieStatValue: { fontSize: 22, fontWeight: '900', color: '#111811' },
  calorieStatUnit: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  calorieDivider: { width: 1, height: 36, backgroundColor: '#f0f0f0' },

  ringWrapper: { alignItems: 'center', minWidth: 110 },
  ringOuter: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 6, borderColor: '#13ec22',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f8fff9',
    shadowColor: '#13ec22',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ringOuterOver: { borderColor: '#ef4444', shadowColor: '#ef4444' },
  ringInner: { alignItems: 'center' },
  ringMainValue: { fontSize: 20, fontWeight: '900', color: '#111811' },
  ringMainLabel: { fontSize: 9, color: '#9ca3af', fontWeight: '700', letterSpacing: 1 },
  ringProgressTrack: {
    width: 90, height: 5, borderRadius: 3,
    backgroundColor: '#e5e7eb', marginTop: 8, overflow: 'hidden',
  },
  ringProgressFill: { height: '100%', borderRadius: 3 },
  ringProgressPercent: { fontSize: 11, color: '#6b7280', fontWeight: '700', marginTop: 4 },

  // Makrolar
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  // Öğün bölümü
  mealsSection: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0d1b0e' },
  seeAllBtn: {
    backgroundColor: '#e8fde9',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  seeAllText: { fontSize: 12, color: '#15803d', fontWeight: '700' },

  // Hızlı eylemler
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickBtnEmoji: { fontSize: 22, marginBottom: 4 },
  quickBtnLabel: { fontSize: 12, fontWeight: '700' },

  // Bottom bar
  bottomBarWrapper: { position: 'absolute', bottom: 16, left: 12, right: 12 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 12,
    height: 72,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cameraButton: {
    marginTop: -32,
  },
  cameraButtonInner: {
    width: 62, height: 62,
    borderRadius: 31,
    backgroundColor: '#13ec22',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#f0f7f1',
    shadowColor: '#13ec22',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  cameraIcon: { fontSize: 26 },
});

const macroStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  emoji: { fontSize: 18 },
  label: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 18, fontWeight: '900', color: '#111811' },
  unit: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  track: {
    width: '100%', height: 4, borderRadius: 2,
    backgroundColor: '#f3f4f6', marginTop: 6, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
  pct: { fontSize: 10, fontWeight: '700', marginTop: 3 },
});

const navStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeBg: {
    width: 42, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(19, 236, 34, 0.12)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  activeIcon: { fontSize: 18 },
  icon: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 9, fontWeight: '600', color: '#9ca3af' },
  labelActive: { color: '#13ec22', fontWeight: '800' },
});

export default DashboardScreen;