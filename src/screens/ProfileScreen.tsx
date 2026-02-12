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
  Platform,      // EKLENDİ: Platform kontrolü için
  StatusBar      // EKLENDİ: Android status bar yüksekliği için
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// CLI için Resim Seçici
import { launchImageLibrary } from 'react-native-image-picker'; 

// Base64 decode
import { decode } from 'base64-arraybuffer'; 

import { supabase } from '../lib/supabase';

// --- ÇEVİRİ HARİTALARI ---
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Hareketsiz (Masa başı)',
  light: 'Az Aktif (1-2 gün)',
  moderate: 'Orta Aktif (3-5 gün)',
  very: 'Çok Aktif (6-7 gün)',
  athlete: 'Sporcu (2x gün)',
};

const GOAL_LABELS: Record<string, string> = {
  lose: 'Kilo Ver',
  maintain: 'Kilo Koru',
  gain: 'Kilo Al',
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Düzenleme State'leri
  const [editForm, setEditForm] = useState({
    full_name: '',
    pref_name: '',
    height: '',
    weight: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

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
        height: profileData.height ? String(profileData.height) : '',
        weight: profileData.weight ? String(profileData.weight) : '',
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
        height: heightVal,
        weight: weightVal,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profiliniz güncellendi.');

    } catch (error: any) {
      Alert.alert('Güncelleme Hatası', error.message);
    } finally {
      setLoading(false);
    }
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

      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `avatar_${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64Data), {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setProfile({ ...profile, avatar_url: publicUrl });
      Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi');

    } catch (error: any) {
      console.log('UPLOAD ERROR:', error);
      Alert.alert('Yükleme Hatası', error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- ÇIKIŞ ---
  const handleSignOut = async () => {
    Alert.alert('Çıkış', 'Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { 
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#13ec22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER  */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Geri Butonu */}
          <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
              activeOpacity={0.7}
          >
             <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profilim</Text>
          
          {/* Düzenle Butonu */}
          <TouchableOpacity 
              onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              style={styles.editButtonContainer}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
          >
            <Text style={[styles.editButtonText, isEditing && {color: '#13ec22'}]}>
              {isEditing ? 'Kaydet' : 'Düzenle'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR BÖLÜMÜ */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarContainer}>
            {uploading ? (
               <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator color="#fff" />
               </View>
            ) : profile?.avatar_url ? (
               <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatarImage} 
                  resizeMode="cover" 
                />
            ) : (
              <View style={styles.avatarPlaceholder}>
                 <Text style={styles.avatarText}>{profile?.pref_name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Text style={{fontSize: 12}}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.fullName}>{profile?.full_name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* BİLGİ KARTLARI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <View style={styles.card}>
            <EditableItem 
              label="Ad Soyad" 
              value={editForm.full_name} 
              isEditing={isEditing}
              onChange={(t: string) => setEditForm({...editForm, full_name: t})}
            />
             <EditableItem 
              label="Hitap İsmi" 
              value={editForm.pref_name} 
              isEditing={isEditing}
              onChange={(t: string) => setEditForm({...editForm, pref_name: t})}
            />
             <EditableItem 
              label="Boy (cm)" 
              value={editForm.height} 
              isEditing={isEditing}
              keyboardType="numeric"
              onChange={(t: string) => setEditForm({...editForm, height: t})}
            />
             <EditableItem 
              label="Kilo (kg)" 
              value={editForm.weight} 
              isEditing={isEditing}
              keyboardType="numeric"
              onChange={(t: string) => setEditForm({...editForm, weight: t})}
            />
            <ProfileItem label="Cinsiyet" value={profile?.gender} />
            <ProfileItem label="Doğum Tarihi" value={profile?.dob} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hedef ve Aktivite</Text>
          <View style={styles.card}>
            <ProfileItem label="Hedef" value={GOAL_LABELS[profile?.goal] || profile?.goal} />
            <ProfileItem label="Aktivite" value={ACTIVITY_LABELS[profile?.activity_level] || profile?.activity_level} />
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

// --- YARDIMCI BİLEŞENLER ---
const ProfileItem = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const EditableItem = ({ label, value, isEditing, onChange, keyboardType = 'default' }: any) => {
  if (isEditing) {
    return (
      <View style={styles.row}>
        <Text style={[styles.label, {marginTop: 12}]}>{label}</Text>
        <TextInput 
          style={styles.input} 
          value={value} 
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    );
  }
  return <ProfileItem label={label} value={value} />;
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f6f8f6' 
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // --- HEADER ---
  header: { 
    backgroundColor: '#fff', // Arka planı beyaz 
    // Android'de status bar'ın altına inmesi için:
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 4, 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10, 
  },
  
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f6f8f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  backIcon: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#111811',
    textAlign: 'center',
    flex: 1, // Ortalamak için alanı kaplasın
  },
  
  editButtonContainer: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  editButtonText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  
  // --- İÇERİK ---
  content: { padding: 24, paddingBottom: 60 },
  
  profileHeader: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatarContainer: { width: 110, height: 110, marginBottom: 16, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#13ec22', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatarText: { fontSize: 44, fontWeight: 'bold', color: '#fff' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  
  fullName: { fontSize: 24, fontWeight: 'bold', color: '#111811' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111811', marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  label: { fontSize: 14, color: '#6b7280', width: '35%' },
  value: { fontSize: 14, fontWeight: '600', color: '#111811', textAlign: 'right', flex: 1 },
  input: { flex: 1, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#13ec22', paddingVertical: 4, fontSize: 14, fontWeight: '600', color: '#111811' },
  
  signOutButton: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  signOutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;