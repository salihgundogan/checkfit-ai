import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, TextInput, Platform, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');

// --- ÇEVİRİ HARİTALARI ---
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Hareketsiz (Masa başı)',
  light:     'Az Aktif (1-2 gün)',
  moderate:  'Orta Aktif (3-5 gün)',
  very:      'Çok Aktif (6-7 gün)',
  athlete:   'Sporcu (2x gün)',
};

const GOAL_OPTIONS = [
  { key: 'lose',     label: 'Kilo\nVer',  icon: '⚖️' },
  { key: 'maintain', label: 'Kilo\nKoru', icon: '🔄' },
  { key: 'gain',     label: 'Kas\nKazan', icon: '💪' },
];

// --- GOAL CARD ---
const GoalCard = ({
  option, selected, onPress, disabled, T,
}: {
  option: typeof GOAL_OPTIONS[0];
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
  T: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[
      {
        flex: 1, height: 110, borderRadius: 20,
        backgroundColor: selected ? T.primary + '18' : T.surface,
        alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 2, borderColor: selected ? T.primary : 'transparent',
        position: 'relative', paddingVertical: 12, paddingHorizontal: 8,
        opacity: disabled && !selected ? 0.6 : 1,
      },
    ]}
  >
    {selected && (
      <View style={{
        position: 'absolute', top: 8, right: 8, width: 20, height: 20,
        borderRadius: 10, backgroundColor: T.primary,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text>
      </View>
    )}
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: T.card, justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    }}>
      <Text style={{ fontSize: 22 }}>{option.icon}</Text>
    </View>
    <Text style={{
      fontSize: 11, fontWeight: selected ? '700' : '600',
      color: selected ? T.primary : T.muted,
      textAlign: 'center', lineHeight: 15,
    }}>
      {option.label}
    </Text>
  </TouchableOpacity>
);

// --- ANA BİLEŞEN ---
const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { T, darkMode } = useTheme();

  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '', pref_name: '', height: '', weight: '', goal: 'lose',
  });

  const S = useMemo(() => StyleSheet.create({
    container:        { flex: 1, backgroundColor: T.bg },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 56,
      paddingBottom: 14, paddingHorizontal: 16,
      backgroundColor: T.bg,
      borderBottomWidth: 0.5, borderBottomColor: T.border,
    },
    headerIconBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center',
    },
    backArrow:   { fontSize: 20, color: T.text, fontWeight: '600', marginTop: -2 },
    cancelText:  { fontSize: 14, color: T.muted, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 4 },

    avatarSection:     { alignItems: 'center', paddingVertical: 28 },
    avatarOuter:       { position: 'relative', width: 120, height: 120 },
    avatarImage:       { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: T.card },
    avatarPlaceholder: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: T.primary, justifyContent: 'center', alignItems: 'center',
      borderWidth: 4, borderColor: T.card,
      shadowColor: T.primary, shadowOpacity: 0.3, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    avatarInitial: { fontSize: 48, fontWeight: '700', color: '#fff' },
    cameraBadge:   {
      position: 'absolute', bottom: 2, right: 2,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: T.card, borderWidth: 2, borderColor: T.bg,
      justifyContent: 'center', alignItems: 'center', elevation: 3,
      shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    avatarHint: { marginTop: 12, fontSize: 13, color: T.muted, fontWeight: '500' },

    section:      { marginBottom: 24 },
    sectionTitle: {
      fontSize: 14, fontWeight: '700', color: T.text,
      marginBottom: 12, marginLeft: 4,
      textTransform: 'uppercase', letterSpacing: 0.6,
    },

    fieldGroup: { marginBottom: 12 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: T.muted, marginBottom: 6, marginLeft: 4 },
    input: {
      height: 52, borderRadius: 16, backgroundColor: T.surface,
      paddingHorizontal: 16, fontSize: 15, fontWeight: '600', color: T.text,
    },
    inputStatic: {
      height: 52, borderRadius: 16, backgroundColor: T.surface,
      paddingHorizontal: 16, justifyContent: 'center',
    },
    inputStaticText: { fontSize: 15, fontWeight: '600', color: T.text },
    metricRow:       { flexDirection: 'row', marginBottom: 4 },
    inputWithUnit:   { position: 'relative', flexDirection: 'row', alignItems: 'center' },
    unitLabel:       { position: 'absolute', right: 16, fontSize: 14, fontWeight: '500', color: T.muted },

    readonlyRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: T.border,
      alignItems: 'center', paddingHorizontal: 4,
    },
    readonlyLabel: { fontSize: 14, color: T.muted, fontWeight: '500' },
    readonlyValue: { fontSize: 14, fontWeight: '600', color: T.text },

    goalGrid: { flexDirection: 'row', gap: 10 },
    goalHint: { marginTop: 10, fontSize: 12, color: T.muted, textAlign: 'center', fontStyle: 'italic' },

    card: {
      backgroundColor: T.card, borderRadius: 16,
      paddingVertical: 16, paddingHorizontal: 20,
      borderWidth: 0.5, borderColor: T.border,
    },
    activityValue: { fontSize: 15, fontWeight: '600', color: T.text },

    signOutBtn: {
      backgroundColor: darkMode ? '#ef444420' : '#fee2e2',
      paddingVertical: 16, borderRadius: 18,
      alignItems: 'center', marginTop: 8, marginBottom: 12,
    },
    signOutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },

    saveBarWrap: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'android' ? 20 : 36,
      paddingTop: 12,
      backgroundColor: T.bg,
      borderTopWidth: 0.5, borderTopColor: T.border,
    },
    saveBtn: {
      height: 56, borderRadius: 28, backgroundColor: T.primary,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: T.primary, shadowOpacity: 0.35, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  }), [T, darkMode]);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı yok');
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      const profileData = { ...data, email: user.email };
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || '',
        pref_name: profileData.pref_name || '',
        height:    profileData.height ? String(profileData.height) : '',
        weight:    profileData.weight ? String(profileData.weight) : '',
        goal:      profileData.goal || 'lose',
      });
    } catch (error: any) {
      console.log('Profil yükleme hatası:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const heightVal = parseFloat(editForm.height);
      const weightVal = parseFloat(editForm.weight);
      if (isNaN(heightVal) || isNaN(weightVal)) {
        Alert.alert('Hata', 'Lütfen boy ve kilo için geçerli sayılar girin.');
        setLoading(false);
        return;
      }
      const updates = {
        full_name: editForm.full_name, pref_name: editForm.pref_name,
        height: heightVal, weight: weightVal, goal: editForm.goal,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, ...updates });
      setIsEditing(false);
      Alert.alert('Başarılı ✓', 'Profiliniz güncellendi.');
    } catch (error: any) {
      Alert.alert('Güncelleme Hatası', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: profile?.full_name || '', pref_name: profile?.pref_name || '',
      height:    profile?.height ? String(profile.height) : '',
      weight:    profile?.weight ? String(profile.weight) : '',
      goal:      profile?.goal || 'lose',
    });
    setIsEditing(false);
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5, selectionLimit: 1, includeBase64: true });
      if (result.didCancel) return;
      if (result.errorCode) { Alert.alert('Hata', result.errorMessage || 'Resim seçilemedi'); return; }
      if (result.assets?.[0]?.base64 && result.assets[0].uri) {
        uploadImage(result.assets[0].base64, result.assets[0].uri);
      }
    } catch (e) { console.log(e); }
  };

  const uploadImage = async (base64Data: string, uri: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, decode(base64Data), { contentType: `image/${ext}`, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      setProfile({ ...profile, avatar_url: data.publicUrl });
      Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi');
    } catch (error: any) {
      Alert.alert('Yükleme Hatası', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={S.loadingContainer}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  const initials = (profile?.pref_name || profile?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <View style={S.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerIconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
          <Text style={S.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Profili Düzenle</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleCancelEdit} style={S.headerIconBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
            <Text style={S.cancelText}>İptal</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* AVATAR */}
        <View style={S.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} activeOpacity={0.85}>
            <View style={S.avatarOuter}>
              {uploading ? (
                <View style={S.avatarPlaceholder}><ActivityIndicator color="#fff" size="large" /></View>
              ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={S.avatarImage} resizeMode="cover" />
              ) : (
                <View style={S.avatarPlaceholder}>
                  <Text style={S.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={S.cameraBadge}>
                <Text style={{ fontSize: 14 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={S.avatarHint}>Fotoğrafı değiştir</Text>
        </View>

        {/* KİŞİSEL BİLGİLER */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Kişisel Bilgiler</Text>

          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Ad Soyad</Text>
            {isEditing ? (
              <TextInput style={S.input} value={editForm.full_name} onChangeText={t => setEditForm({ ...editForm, full_name: t })} placeholder="Adınızı girin" placeholderTextColor={T.muted} />
            ) : (
              <View style={S.inputStatic}><Text style={S.inputStaticText}>{profile?.full_name || '-'}</Text></View>
            )}
          </View>

          <View style={S.fieldGroup}>
            <Text style={S.fieldLabel}>Hitap İsmi</Text>
            {isEditing ? (
              <TextInput style={S.input} value={editForm.pref_name} onChangeText={t => setEditForm({ ...editForm, pref_name: t })} placeholder="Takma ad veya kısa isim" placeholderTextColor={T.muted} />
            ) : (
              <View style={S.inputStatic}><Text style={S.inputStaticText}>{profile?.pref_name || '-'}</Text></View>
            )}
          </View>

          <View style={S.metricRow}>
            <View style={[S.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={S.fieldLabel}>Kilo</Text>
              {isEditing ? (
                <View style={S.inputWithUnit}>
                  <TextInput style={[S.input, { flex: 1, paddingRight: 36 }]} value={editForm.weight} onChangeText={t => setEditForm({ ...editForm, weight: t })} keyboardType="numeric" placeholder="0" placeholderTextColor={T.muted} />
                  <Text style={S.unitLabel}>kg</Text>
                </View>
              ) : (
                <View style={S.inputStatic}><Text style={S.inputStaticText}>{profile?.weight ? `${profile.weight} kg` : '-'}</Text></View>
              )}
            </View>
            <View style={[S.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={S.fieldLabel}>Boy</Text>
              {isEditing ? (
                <View style={S.inputWithUnit}>
                  <TextInput style={[S.input, { flex: 1, paddingRight: 40 }]} value={editForm.height} onChangeText={t => setEditForm({ ...editForm, height: t })} keyboardType="numeric" placeholder="0" placeholderTextColor={T.muted} />
                  <Text style={S.unitLabel}>cm</Text>
                </View>
              ) : (
                <View style={S.inputStatic}><Text style={S.inputStaticText}>{profile?.height ? `${profile.height} cm` : '-'}</Text></View>
              )}
            </View>
          </View>

          {!isEditing && (
            <>
              <View style={S.readonlyRow}>
                <Text style={S.readonlyLabel}>Cinsiyet</Text>
                <Text style={S.readonlyValue}>{profile?.gender || '-'}</Text>
              </View>
              <View style={[S.readonlyRow, { borderBottomWidth: 0 }]}>
                <Text style={S.readonlyLabel}>Doğum Tarihi</Text>
                <Text style={S.readonlyValue}>{profile?.dob || '-'}</Text>
              </View>
            </>
          )}
        </View>

        {/* HEDEF SEÇİCİ */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Hedefim</Text>
          <View style={S.goalGrid}>
            {GOAL_OPTIONS.map(opt => (
              <GoalCard
                key={opt.key} option={opt}
                selected={editForm.goal === opt.key}
                onPress={() => setEditForm({ ...editForm, goal: opt.key })}
                disabled={!isEditing} T={T}
              />
            ))}
          </View>
          {!isEditing && (
            <Text style={S.goalHint}>Hedefi değiştirmek için "Düzenle" butonuna basın.</Text>
          )}
        </View>

        {/* AKTİVİTE */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Aktivite Seviyesi</Text>
          <View style={S.card}>
            <Text style={S.activityValue}>
              {ACTIVITY_LABELS[profile?.activity_level] || profile?.activity_level || '-'}
            </Text>
          </View>
        </View>

        {/* ÇIKIŞ */}
        <TouchableOpacity style={S.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={S.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ALT BUTON */}
      <View style={S.saveBarWrap}>
        <TouchableOpacity
          style={S.saveBtn}
          onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
          activeOpacity={0.88}
          disabled={isEditing && loading}
        >
          {isEditing && loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={S.saveBtnText}>{isEditing ? 'Değişiklikleri Kaydet' : '✏️  Profili Düzenle'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;