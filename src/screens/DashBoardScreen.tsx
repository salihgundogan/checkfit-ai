import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Supabase
import { supabase } from '../lib/supabase';

// Componentler
import MacroCard from '../components/MacroCard';
import MealCard from '../components/MealCard';

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Misafir');
  const [loading, setLoading] = useState(true);

  // Kullanıcı Bilgisini Çekme
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // 1. Mevcut oturumu al
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Profiles tablosundan ismi çek
        const { data, error } = await supabase
          .from('profiles')
          .select('pref_name')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserName(data.pref_name);
        }
      }
    } catch (error) {
      console.log('Profil yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      {/* --- SCROLL CONTENT --- */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. HEADER (Dinamik İsim) */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hoş geldin,</Text>
            {/* Supabase'den gelen isim burada yazıyor */}
            <Text style={styles.userName}>
              {loading ? 'Yükleniyor...' : `Merhaba ${userName}!`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')} // Profile git
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80' }} 
              style={styles.profileImage} 
            />
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
        </View>

        {/* 2. KALORİ HALKASI */}
        <View style={styles.ringSection}>
          <View style={styles.outerRing}>
            <View style={styles.innerRing}>
              <View style={styles.ringContent}>
                <Text style={styles.ringValue}>1,250</Text>
                <Text style={styles.ringLabel}>KCAL KALDI</Text>
                <View style={styles.ringTargetBadge}>
                  <Text style={styles.ringTargetText}>Hedef: 2,000</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. MAKRO BİLGİLERİ */}
        <View style={styles.macroContainer}>
          <MacroCard 
            title="Karb" value="128g" percentage={65} 
            color="#3b82f6" iconCharacter="🌾" 
          />
          <MacroCard 
            title="Protein" value="95g" percentage={80} 
            color="#13ec22" iconCharacter="🥚" 
          />
          <MacroCard 
            title="Yağ" value="45g" percentage={45} 
            color="#f97316" iconCharacter="💧" 
          />
        </View>

        {/* 4. BUGÜNKÜ ÖĞÜNLER */}
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugünkü Öğünler</Text>
            <TouchableOpacity>
               <Text style={styles.seeAllText}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          <MealCard 
            mealType="Kahvaltı"
            foodName="Yulaf ve Meyveler"
            calories={350}
            imageSource={{ uri: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
          />

          <MealCard 
            mealType="Öğle Yemeği"
            foodName="Izgara Tavuk Salatası"
            calories={450}
            imageSource={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
          />

          <MealCard 
            mealType="Akşam Yemeği"
            isEmpty={true}
            onAddPress={() => console.log('Yemek Ekle')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 5.  BOTTOM BAR */}
      <View style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
            {/* Aktif Tab: Home */}
            <TouchableOpacity style={styles.navItemActive}>
                <View style={styles.activeIconBg}>
                    <Text style={styles.navIconActive}>🏠</Text>
                </View>
                <Text style={styles.navTextActive}>Ana Sayfa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}  onPress={() => navigation.navigate('Progress')} >
                <Text style={styles.navIcon}>📜</Text>
                <Text style={styles.navText}>Geçmiş</Text>
            </TouchableOpacity>

            {/* Orta Kamera Butonu (Yüzen) */}
            <View style={styles.cameraContainer}>
                <TouchableOpacity style={styles.cameraButton}   onPress={() => navigation.navigate('AICamera')} // Yönlendirme
>
                    <Text style={{ fontSize: 28 }}>📸</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.navItem}>
                <Text style={styles.navIcon}>🤖</Text>
                <Text style={styles.navText}>Asistan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.navItem} 
                onPress={() => navigation.navigate('Profile')}
            >
                <Text style={styles.navIcon}>👤</Text>
                <Text style={styles.navText}>Profil</Text>
            </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  scrollContent: { padding: 24 },
  
  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greetingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#0d1b0e' },
  profileButton: { padding: 2, borderWidth: 2, borderColor: '#ffffff', borderRadius: 24, shadowColor: "#13ec22", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10 },
  profileImage: { width: 48, height: 48, borderRadius: 24 },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, backgroundColor: '#13ec22', borderRadius: 6, borderWidth: 2, borderColor: '#ffffff' },
  
  // RING & MACRO
  ringSection: { alignItems: 'center', marginVertical: 12 },
  outerRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 20, borderColor: '#e2e8e2', justifyContent: 'center', alignItems: 'center', borderTopColor: '#13ec22', borderRightColor: '#13ec22', transform: [{ rotate: '-45deg' }] },
  innerRing: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '45deg' }] },
  ringContent: { alignItems: 'center' },
  ringValue: { fontSize: 40, fontWeight: 'bold', color: '#111811' },
  ringLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  ringTargetBadge: { marginTop: 8, backgroundColor: '#e7fce9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  ringTargetText: { fontSize: 12, color: '#15803d', fontWeight: '600' },
  macroContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, marginTop: 24 },
  
  // MEALS
  mealsSection: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0d1b0e' },
  seeAllText: { fontSize: 12, color: '#13ec22', fontWeight: '600' },

  //  BOTTOM BAR
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    height: 70,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navIcon: { fontSize: 22, color: '#9ca3af', marginBottom: 2 },
  navText: { fontSize: 10, fontWeight: '500', color: '#9ca3af' },
  
  // Aktif Item Stili
  navItemActive: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  activeIconBg: {
    backgroundColor: 'rgba(19, 236, 34, 0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navIconActive: { fontSize: 20 },
  navTextActive: { fontSize: 10, fontWeight: '700', color: '#13ec22' },

  // Kamera Butonu
  cameraContainer: { 
    top: -25, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10 
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#13ec22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#f6f8f6', // Arka plan rengiyle aynı çerçeve
    shadowColor: "#13ec22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default DashboardScreen;