import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// --- RENK PALETİ ---
const COLORS = {
  primary: '#4b7c5a',
  primaryLight: 'rgba(75,124,90,0.1)',
  primaryMid: 'rgba(75,124,90,0.15)',
  background: '#F9FAF5',
  card: '#FFFFFF',
  inputBg: '#F0F2F5',
  text: '#121614',
  textMuted: '#6b7280',
  border: '#E8EAE5',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  white: '#FFFFFF',
};

// --- ÇEVİRİ HARİTALARI ---
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Hareketsiz (Masa başı)',
  light: 'Az Aktif (1-2 gün)',
  moderate: 'Orta Aktif (3-5 gün)',
  very: 'Çok Aktif (6-7 gün)',
  athlete: 'Sporcu (2x gün)',
};

const GOAL_OPTIONS = [
  { key: 'lose',     label: 'Kilo\nVer',   icon: '⚖️',  iconSymbol: 'monitor_weight' },
  { key: 'maintain', label: 'Kilo\nKoru',  icon: '🔄',  iconSymbol: 'balance'        },
  { key: 'gain',     label: 'Kas\nKazan',  icon: '💪',  iconSymbol: 'fitness_center' },
];

// --- GOAL CARD BİLEŞENİ ---
const GoalCard = ({
  option,
  selected,
  onPress,
  disabled,
}: {
  option: typeof GOAL_OPTIONS[0];
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    style={[
      styles.goalCard,
      selected && styles.goalCardActive,
      disabled && !selected && styles.goalCardDisabled,
    ]}
  >
    {selected && (
      <View style={styles.goalCheckBadge}>
        <Text style={styles.goalCheckIcon}>✓</Text>
      </View>
    )}
    <View style={[styles.goalIconWrap, selected && styles.goalIconWrapActive]}>
      <Text style={styles.goalEmoji}>{option.icon}</Text>
    </View>
    <Text style={[styles.goalLabel, selected && styles.goalLabelActive]}>
      {option.label}
    </Text>
  </TouchableOpacity>
);

// --- ANA BİLEŞEN ---
const ProfileScreen = () => {
  const navigation = useNavigation<any>();

  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    pref_name: '',
    height:    '',
    weight:    '',
    goal:      'lose',
  });

  useEffect(() => { fetchProfile(); }, []);

  // --- PROFİL ÇEKME ---
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı yok');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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

  // --- PROFİL GÜNCELLEME ---
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
        full_name: editForm.full_name,
        pref_name: editForm.pref_name,
        height:    heightVal,
        weight:    weightVal,
        goal:      editForm.goal,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

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
    // Değişiklikleri geri al
    setEditForm({
      full_name: profile?.full_name || '',
      pref_name: profile?.pref_name || '',
      height:    profile?.height ? String(profile.height) : '',
      weight:    profile?.weight ? String(profile.weight) : '',
      goal:      profile?.goal || 'lose',
    });
    setIsEditing(false);
  };

  // --- RESİM YÜKLEME ---
  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit: 1,
        includeBase64: true,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Hata', result.errorMessage || 'Resim seçilemedi');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64 && asset.uri) {
          uploadImage(asset.base64, asset.uri);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const uploadImage = async (base64Data: string, uri: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const ext      = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `avatar_${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64Data), {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile({ ...profile, avatar_url: publicUrl });
      Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi');
    } catch (error: any) {
      Alert.alert('Yükleme Hatası', error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- ÇIKIŞ ---
  const handleSignOut = async () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const initials = (profile?.pref_name || profile?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profili Düzenle</Text>

        {isEditing ? (
          <TouchableOpacity
            onPress={handleCancelEdit}
            style={styles.headerIconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── AVATAR ── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} activeOpacity={0.85}>
            <View style={styles.avatarOuter}>
              {uploading ? (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator color={COLORS.white} size="large" />
                </View>
              ) : profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Text style={{ fontSize: 14 }}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Fotoğrafı değiştir</Text>
        </View>

        {/* ── KİŞİSEL BİLGİLER ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

          {/* Ad Soyad */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.full_name}
                onChangeText={t => setEditForm({ ...editForm, full_name: t })}
                placeholder="Adınızı girin"
                placeholderTextColor={COLORS.textMuted}
              />
            ) : (
              <View style={styles.inputStatic}>
                <Text style={styles.inputStaticText}>{profile?.full_name || '-'}</Text>
              </View>
            )}
          </View>

          {/* Hitap İsmi */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Hitap İsmi</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editForm.pref_name}
                onChangeText={t => setEditForm({ ...editForm, pref_name: t })}
                placeholder="Takma ad veya kısa isim"
                placeholderTextColor={COLORS.textMuted}
              />
            ) : (
              <View style={styles.inputStatic}>
                <Text style={styles.inputStaticText}>{profile?.pref_name || '-'}</Text>
              </View>
            )}
          </View>

          {/* Kilo & Boy */}
          <View style={styles.metricRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.fieldLabel}>Kilo</Text>
              {isEditing ? (
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 36 }]}
                    value={editForm.weight}
                    onChangeText={t => setEditForm({ ...editForm, weight: t })}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.unitLabel}>kg</Text>
                </View>
              ) : (
                <View style={styles.inputStatic}>
                  <Text style={styles.inputStaticText}>
                    {profile?.weight ? `${profile.weight} kg` : '-'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.fieldLabel}>Boy</Text>
              {isEditing ? (
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1, paddingRight: 40 }]}
                    value={editForm.height}
                    onChangeText={t => setEditForm({ ...editForm, height: t })}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.unitLabel}>cm</Text>
                </View>
              ) : (
                <View style={styles.inputStatic}>
                  <Text style={styles.inputStaticText}>
                    {profile?.height ? `${profile.height} cm` : '-'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Sadece görüntüleme alanları */}
          {!isEditing && (
            <>
              <View style={styles.readonlyRow}>
                <Text style={styles.readonlyLabel}>Cinsiyet</Text>
                <Text style={styles.readonlyValue}>{profile?.gender || '-'}</Text>
              </View>
              <View style={[styles.readonlyRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.readonlyLabel}>Doğum Tarihi</Text>
                <Text style={styles.readonlyValue}>{profile?.dob || '-'}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── HEDEF SEÇİCİ ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hedefim</Text>
          <View style={styles.goalGrid}>
            {GOAL_OPTIONS.map(opt => (
              <GoalCard
                key={opt.key}
                option={opt}
                selected={editForm.goal === opt.key}
                onPress={() => setEditForm({ ...editForm, goal: opt.key })}
                disabled={!isEditing}
              />
            ))}
          </View>
          {!isEditing && (
            <Text style={styles.goalHint}>
              Hedefi değiştirmek için "Düzenle" butonuna basın.
            </Text>
          )}
        </View>

        {/* ── AKTİVİTE BİLGİSİ (sadece göster) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktivite Seviyesi</Text>
          <View style={styles.card}>
            <Text style={styles.activityValue}>
              {ACTIVITY_LABELS[profile?.activity_level] || profile?.activity_level || '-'}
            </Text>
          </View>
        </View>

        {/* ── ÇIKIŞ ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── KAYDET BUTONU (düzenleme modunda) ── */}
      {isEditing && (
        <View style={styles.saveBarWrap}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveProfile}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── DÜZENLE FAB (düzenleme modunda değilken) ── */}
      {!isEditing && (
        <View style={styles.saveBarWrap}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.88}
          >
            <Text style={styles.saveBtnText}>✏️  Profili Düzenle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(249,250,245,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: -2,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // SCROLL
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    paddingTop: 4,
  },

  // AVATAR
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarOuter: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // SECTION
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // FIELD GROUP
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputStatic: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputStaticText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputWithUnit: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitLabel: {
    position: 'absolute',
    right: 16,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // READONLY ROWS
  readonlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  readonlyLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  readonlyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // GOAL CARDS
  goalGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCard: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  goalCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  goalCardDisabled: {
    opacity: 0.6,
  },
  goalCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckIcon: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  goalIconWrapActive: {
    backgroundColor: COLORS.white,
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  goalLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  goalHint: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // AKTİVİTE KARTI
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ÇIKIŞ
  signOutBtn: {
    backgroundColor: COLORS.dangerBg,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  signOutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 15,
  },

  // ALT KAYDET ÇUBUĞU
  saveBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 20 : 36,
    paddingTop: 12,
    backgroundColor: 'rgba(249,250,245,0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  editBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default ProfileScreen;