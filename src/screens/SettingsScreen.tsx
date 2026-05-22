import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  StyleSheet, Modal, ActivityIndicator, StatusBar,
  SafeAreaView, Alert, Linking, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  RepeatFrequency,
} from '@notifee/react-native';
import { supabase } from '../lib/supabase';
import ChangePasswordModal from './ChangePasswordModal';
import { useTheme } from './ThemeContext';
// ─── Kanal oluştur ────────────────────────────────────────────────────────────
async function createChannel() {
  await notifee.createChannel({
    id: 'checkfit-reminders',
    name: 'CheckFit Hatırlatıcılar',
    importance: AndroidImportance.HIGH,
  });
}
createChannel();

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'danger' | 'primary';

interface SettingRowProps {
  iconBg: string; iconColor: string; iconLabel: string;
  title: string; titleColor: string;
  subtitle?: string; subtitleColor: string;
  right?: React.ReactNode; onPress?: () => void; isLast?: boolean;
}

interface ProfileData { full_name?: string; pref_name?: string; email?: string; }

// ─── Theme ───────────────────────────────────────────────────────────────────

const LIGHT = {
  bg: '#F9FAF5', card: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
  text: '#0d1b0e', muted: '#6b7280',
  primary: '#4A7C59', surface: '#f3f5f0', accent: '#13ec54', danger: '#ef4444',
};

const DARK = {
  bg: '#0a0a0a', card: '#1c1c1e', border: 'rgba(255,255,255,0.10)',
  text: '#ffffff',
  muted: '#aeaeb2',
  primary: '#5fcc7a', surface: '#2c2c2e', accent: '#13ec54', danger: '#ff453a',
};

const ICON_L = {
  green:  { bg: 'rgba(19,236,84,0.12)',   color: '#4A7C59' },
  blue:   { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  amber:  { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  purple: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  red:    { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  gray:   { bg: 'rgba(0,0,0,0.06)',       color: '#6b7280' },
};

const ICON_D = {
  green:  { bg: 'rgba(95,204,122,0.18)',  color: '#5fcc7a' },
  blue:   { bg: 'rgba(96,165,250,0.18)',  color: '#60a5fa' },
  amber:  { bg: 'rgba(251,146,60,0.18)',  color: '#fb923c' },
  purple: { bg: 'rgba(167,139,250,0.18)', color: '#a78bfa' },
  red:    { bg: 'rgba(255,69,58,0.18)',   color: '#ff453a' },
  gray:   { bg: 'rgba(255,255,255,0.08)', color: '#aeaeb2' },
};

// ─── Primitive Bileşenler ─────────────────────────────────────────────────────

const Badge: React.FC<{ variant: BadgeVariant; label: string }> = ({ variant, label }) => {
  const map: Record<BadgeVariant, { bg: string; color: string }> = {
    success: { bg: 'rgba(19,236,84,0.15)', color: '#2d7a45' },
    danger:  { bg: 'rgba(239,68,68,0.13)', color: '#ef4444' },
    primary: { bg: '#4A7C59', color: '#fff' },
  };
  const c = map[variant];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: c.color, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
};

const Chevron: React.FC<{ color: string }> = ({ color }) => (
  <Text style={{ fontSize: 20, color, fontWeight: '300', lineHeight: 22 }}>›</Text>
);

const SectionLabel: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.8,
    textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 }}>
    {label}
  </Text>
);

const SettingRow: React.FC<SettingRowProps> = ({
  iconBg, iconColor, iconLabel, title, titleColor,
  subtitle, subtitleColor, right, onPress, isLast,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.65 : 1}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingVertical: 13, paddingHorizontal: 16,
      borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: 'rgba(128,128,128,0.18)' }}>
    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: iconBg,
      alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 19 }}>{iconLabel}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '600', color: titleColor }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 12, marginTop: 2, color: subtitleColor }}>{subtitle}</Text>}
    </View>
    {right && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{right}</View>}
  </TouchableOpacity>
);

const Group: React.FC<{ children: React.ReactNode; card: string; border: string; borderColor?: string }> = (
  { children, card, border, borderColor }
) => (
  <View style={{ marginHorizontal: 16, backgroundColor: card, borderRadius: 18,
    borderWidth: 0.5, borderColor: borderColor ?? border, overflow: 'hidden' }}>
    {children}
  </View>
);

// ─── Bildirim Yardımcıları (notifee) ─────────────────────────────────────────

/**
 * Belirtilen saat için bir sonraki tetiklenme zamanını döndürür.
 * Eğer o saat bugün geçtiyse yarına ayarlar.
 */
function nextTriggerDate(hour: number): number {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d.getTime();
}

// ── Öğün Hatırlatıcıları ──────────────────────────────────────────────────────

const scheduleMealReminders = async (): Promise<void> => {
  // Önce mevcut öğün bildirimlerini iptal et
  await cancelMealReminders();

  const meals = [
    { id: 'meal-0', hour: 8,  title: '🍳 Kahvaltı zamanı!',     body: 'Güne sağlıklı bir kahvaltıyla başla.' },
    { id: 'meal-1', hour: 12, title: '🥗 Öğle yemeği zamanı!',  body: 'Besin ihtiyaçlarını karşılamayı unutma.' },
    { id: 'meal-2', hour: 19, title: '🍽️ Akşam yemeği zamanı!', body: 'Sağlıklı akşam yemeğinin vakti geldi.' },
  ];

  for (const meal of meals) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextTriggerDate(meal.hour),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: meal.id,
        title: meal.title,
        body: meal.body,
        android: {
          channelId: 'checkfit-reminders',
          smallIcon: 'ic_launcher', // drawable klasöründeki ikon adı
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );
  }
};

const cancelMealReminders = async (): Promise<void> => {
  await notifee.cancelTriggerNotifications(['meal-0', 'meal-1', 'meal-2']);
};

// ── Su Hatırlatıcıları ────────────────────────────────────────────────────────

const scheduleWaterReminders = async (): Promise<void> => {
  await cancelWaterReminders();

  const hours = [8, 10, 12, 14, 16, 18, 20, 22];

  for (let i = 0; i < hours.length; i++) {
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextTriggerDate(hours[i]),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    await notifee.createTriggerNotification(
      {
        id: `water-${i}`,
        title: '💧 Su içme vakti!',
        body: 'Günlük su hedefini tamamlamayı unutma.',
        android: {
          channelId: 'checkfit-reminders',
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );
  }
};

const cancelWaterReminders = async (): Promise<void> => {
  const ids = Array.from({ length: 8 }, (_, i) => `water-${i}`);
  await notifee.cancelTriggerNotifications(ids);
};

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [mealReminder, setMealReminder]     = useState(false);
  const [waterReminder, setWaterReminder]   = useState(false);
  const [biometric, setBiometric]           = useState(false);
  const [showLogout, setShowLogout]         = useState(false);
  const [showPwModal, setShowPwModal]       = useState(false);
  const [logoutLoading, setLogoutLoading]   = useState(false);
  const [profile, setProfile]               = useState<ProfileData>({});
  const [profileLoading, setProfileLoading] = useState(true);

 const { darkMode, toggleDark, T } = useTheme();
  const ICON = darkMode ? ICON_D : ICON_L;

  // ── Profil ───────────────────────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !active) return;
        const { data, error } = await supabase
          .from('profiles').select('full_name, pref_name').eq('id', user.id).single();
        if (error) throw error;
        if (active) setProfile({ ...data, email: user.email ?? '' });
      } catch (e) { console.log('Profil hatası:', e); }
      finally { if (active) setProfileLoading(false); }
    })();
    return () => { active = false; };
  }, []));

  // ── Toggle handlers ──────────────────────────────────────────────────────────
  const handleMealToggle = async (val: boolean) => {
    setMealReminder(val);
    if (val) {
      // iOS'ta bildirim izni iste
      await notifee.requestPermission();
      await scheduleMealReminders();
      Alert.alert('✅ Açık', 'Öğün hatırlatıcıları ayarlandı:\n08:00 · 12:00 · 19:00');
    } else {
      await cancelMealReminders();
    }
  };

  const handleWaterToggle = async (val: boolean) => {
    setWaterReminder(val);
    if (val) {
      await notifee.requestPermission();
      await scheduleWaterReminders();
      Alert.alert('✅ Açık', 'Su hatırlatıcısı her 2 saatte bir\n(08:00–22:00) çalışacak.');
    } else {
      await cancelWaterReminders();
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err: any) { Alert.alert('Hata', err.message); }
    finally { setLogoutLoading(false); setShowLogout(false); }
  };

  // ── Hesap Sil ─────────────────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert('Hesabı Kalıcı Sil', 'Tüm verileriniz silinecek. Geri alınamaz.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Evet, Sil', style: 'destructive', onPress: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('profiles').delete().eq('id', user.id);
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err: any) { Alert.alert('Hata', err.message); }
      }},
    ]);
  };

  // ── Puan Ver ──────────────────────────────────────────────────────────────────
  const handleRate = () => {
    const url = Platform.OS === 'android'
      ? 'market://details?id=com.yourapp.checkfit'
      : 'https://apps.apple.com/app/idYOUR_APP_ID';
    Linking.openURL(url).catch(() =>
      Linking.openURL('https://play.google.com/store/apps/details?id=com.yourapp.checkfit')
    );
  };

  // ── Switch yardımcısı ─────────────────────────────────────────────────────────
  const sw = (val: boolean, fn: (v: boolean) => void) => (
    <Switch value={val} onValueChange={fn}
      trackColor={{ false: darkMode ? '#3a3a3c' : '#d1d5db', true: T.primary }}
      thumbColor="#fff" ios_backgroundColor={darkMode ? '#3a3a3c' : '#d1d5db'} />
  );

  const displayName = profile.pref_name || profile.full_name || 'Kullanıcı';
  const initial     = displayName.charAt(0).toUpperCase();

  const R = (p: Omit<SettingRowProps, 'titleColor' | 'subtitleColor'>) => (
    <SettingRow {...p} titleColor={T.text} subtitleColor={T.muted} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <View style={[st.topBar, { backgroundColor: T.bg, borderBottomColor: T.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={[st.backBtn, { backgroundColor: T.surface }]} activeOpacity={0.7}>
          <Text style={{ fontSize: 20, fontWeight: '300', color: T.text }}>‹</Text>
        </TouchableOpacity>
        <Text style={[st.topTitle, { color: T.text }]}>Ayarlar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}>

        {/* ── Profil Kartı ─────────────────────────────────────────────────── */}
        <View style={[st.profileCard, { backgroundColor: T.card, borderColor: T.border }]}>
          {profileLoading
            ? <ActivityIndicator color={T.primary} style={{ marginRight: 14 }} />
            : <View style={[st.avatar, { borderColor: T.accent }]}>
                <Text style={st.avatarTxt}>{initial}</Text>
              </View>
          }
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.text }}>
              {profileLoading ? '…' : displayName}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 2, color: T.muted }}>
              {profileLoading ? '' : profile.email}
            </Text>
          </View>
          <TouchableOpacity style={[st.editBadge, { backgroundColor: T.surface, borderColor: T.border }]}
            onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: T.primary }}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* ── Görünüm ──────────────────────────────────────────────────────── */}
        <SectionLabel label="Görünüm" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.blue.bg} iconColor={ICON.blue.color} iconLabel="🌙"
            title="Karanlık Mod" subtitle="Koyu tema kullan"
            right={sw(darkMode, toggleDark)} onPress={() => toggleDark(!darkMode)} isLast />
        </Group>

        {/* ── Hesap ────────────────────────────────────────────────────────── */}
        <SectionLabel label="Hesap" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.green.bg} iconColor={ICON.green.color} iconLabel="👤"
            title="Profil Bilgileri" subtitle="Ad, fotoğraf, hedefler"
            right={<Chevron color={T.muted} />} onPress={() => navigation.navigate('Profile')} />
          <R iconBg={ICON.amber.bg} iconColor={ICON.amber.color} iconLabel="🎯"
            title="Kalori & Makro Hedefleri" subtitle="Günlük besin hedeflerini ayarla"
            right={<Chevron color={T.muted} />} onPress={() => navigation.navigate('MacroGoals')} isLast />
        </Group>

        {/* ── Bildirimler ──────────────────────────────────────────────────── */}
        <SectionLabel label="Bildirimler" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.green.bg} iconColor={ICON.green.color} iconLabel="🔔"
            title="Öğün Hatırlatıcıları" subtitle="Kahvaltı 08:00 · Öğle 12:00 · Akşam 19:00"
            right={sw(mealReminder, handleMealToggle)} onPress={() => handleMealToggle(!mealReminder)} />
          <R iconBg={ICON.blue.bg} iconColor={ICON.blue.color} iconLabel="💧"
            title="Su Hatırlatıcısı" subtitle="Her 2 saatte bir (08:00–22:00)"
            right={sw(waterReminder, handleWaterToggle)} onPress={() => handleWaterToggle(!waterReminder)} isLast />
        </Group>

        {/* ── Uygulama İzinleri ─────────────────────────────────────────────── */}
        <SectionLabel label="Uygulama İzinleri" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.blue.bg}   iconColor={ICON.blue.color}   iconLabel="📷"
            title="Kamera"        subtitle="AI yiyecek analizi için gerekli"
            right={<Badge variant="success" label="İzin Verildi" />} onPress={() => Linking.openSettings()} />
          <R iconBg={ICON.green.bg}  iconColor={ICON.green.color}  iconLabel="🖼️"
            title="Galeri / Medya" subtitle="Fotoğraf seçmek için"
            right={<Badge variant="success" label="İzin Verildi" />} onPress={() => Linking.openSettings()} />
          <R iconBg={ICON.amber.bg}  iconColor={ICON.amber.color}  iconLabel="🔕"
            title="Bildirimler"   subtitle="Hatırlatıcılar için gerekli"
            right={<Badge variant="danger" label="İzin Yok" />}     onPress={() => Linking.openSettings()} />
          <R iconBg={ICON.purple.bg} iconColor={ICON.purple.color} iconLabel="❤️"
            title="Sağlık Verileri" subtitle="Google Fit entegrasyonu"
            right={<Chevron color={T.muted} />} onPress={() => Linking.openSettings()} isLast />
        </Group>

        {/* ── Güvenlik ─────────────────────────────────────────────────────── */}
        <SectionLabel label="Güvenlik" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.gray.bg} iconColor={ICON.gray.color} iconLabel="🔒"
            title="Şifre Değiştir" subtitle="Hesap güvenliğini güncelle"
            right={<Chevron color={T.muted} />} onPress={() => setShowPwModal(true)} />
          <R iconBg={ICON.blue.bg} iconColor={ICON.blue.color} iconLabel="🫆"
            title="Biyometrik Giriş" subtitle="Parmak izi / yüz tanıma"
            right={sw(biometric, setBiometric)} onPress={() => setBiometric(v => !v)} isLast />
        </Group>

        {/* ── Yasal ────────────────────────────────────────────────────────── */}
        <SectionLabel label="Yasal" color={T.muted} />
        <Group card={T.card} border={T.border}>
          <R iconBg={ICON.gray.bg} iconColor={ICON.gray.color} iconLabel="📄"
            title="Kullanıcı Sözleşmesi"
            right={<Chevron color={T.muted} />}
           onPress={() => navigation.navigate('Terms', { title: 'Kullanıcı Sözleşmesi' })} />
          <R iconBg={ICON.gray.bg} iconColor={ICON.gray.color} iconLabel="🛡️"
            title="KVKK ve Gizlilik"
            right={<Chevron color={T.muted} />}
           onPress={() => navigation.navigate('Terms', { title: 'KVKK ve Gizlilik Politikası' })} />
          <R iconBg={ICON.gray.bg} iconColor={ICON.gray.color} iconLabel="⭐"
            title="Uygulamayı Puanla" subtitle="Google Play'de değerlendir"
            right={<Text style={{ fontSize: 16, color: T.muted }}>↗</Text>}
            onPress={handleRate} isLast />
        </Group>

        {/* ── Oturum ───────────────────────────────────────────────────────── */}
        <SectionLabel label="Oturum" color={T.muted} />
        <Group card={T.card} border={T.border} borderColor="rgba(239,68,68,0.3)">
          <TouchableOpacity onPress={() => setShowLogout(true)} activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: ICON.red.bg,
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 19 }}>🚪</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.danger }}>
              Oturumu Sonlandır
            </Text>
          </TouchableOpacity>
        </Group>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity onPress={handleDeleteAccount}>
            <Text style={{ fontSize: 12, color: T.muted, textDecorationLine: 'underline' }}>
              Hesabı kalıcı olarak sil
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 6 }}>
          <Text style={{ fontSize: 11, color: T.muted, fontWeight: '500' }}>
            Versiyon 1.0.0 · CheckFit AI
          </Text>
        </View>
      </ScrollView>

      {/* ── Logout Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={showLogout} transparent animationType="fade"
        onRequestClose={() => !logoutLoading && setShowLogout(false)}>
        <TouchableOpacity style={st.backdrop} activeOpacity={1}
          onPress={() => !logoutLoading && setShowLogout(false)}>
          <View style={[st.sheet, { backgroundColor: T.card }]}>
            <View style={[st.handle, { backgroundColor: T.border }]} />
            <View style={[st.modalIconWrap, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Text style={{ fontSize: 28 }}>🚪</Text>
            </View>
            <Text style={[st.modalTitle, { color: T.text }]}>Oturumu Sonlandır</Text>
            <Text style={[st.modalSub, { color: T.muted }]}>
              Hesabından çıkış yapmak istediğine emin misin?
            </Text>
            <TouchableOpacity onPress={handleLogout} disabled={logoutLoading}
              style={[st.confirmBtn, { opacity: logoutLoading ? 0.7 : 1 }]} activeOpacity={0.8}>
              {logoutLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Evet, Çıkış Yap</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLogout(false)} disabled={logoutLoading}
              style={[st.cancelBtn, { backgroundColor: T.surface, borderColor: T.border }]} activeOpacity={0.7}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: T.text }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Şifre Modal ──────────────────────────────────────────────────────── */}
      <ChangePasswordModal visible={showPwModal} onClose={() => setShowPwModal(false)} T={T} />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, gap: 12 },
  backBtn:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topTitle:     { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  profileCard:  { margin: 16, borderRadius: 20, borderWidth: 0.5, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#4A7C59', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
  avatarTxt:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  editBadge:    { borderRadius: 20, borderWidth: 0.5, paddingHorizontal: 14, paddingVertical: 6 },
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet:        { width: '100%', maxWidth: 420, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 38, alignItems: 'center' },
  handle:       { width: 36, height: 4, borderRadius: 2, marginBottom: 20 },
  modalIconWrap:{ width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  modalSub:     { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  confirmBtn:   { width: '100%', padding: 14, borderRadius: 14, backgroundColor: '#ef4444', alignItems: 'center', marginBottom: 10 },
  cancelBtn:    { width: '100%', padding: 14, borderRadius: 14, borderWidth: 0.5, alignItems: 'center' },
});

export default SettingsScreen;