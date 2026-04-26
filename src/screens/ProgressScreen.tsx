import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  Image as RNImage
} from 'react-native';
import { supabase } from '../lib/supabase';

// Bileşenlerin
import DayItem from '../components/DayItem';
import DailySummaryCard from '../components/DailySummaryCard';
import RecentActivityItem from '../components/RecentActivityItem';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [foods, setFoods] = useState<any[]>([]);
  const [stats, setStats] = useState({ cal: 0, c: 0, p: 0, f: 0 });
  
  // Hafta Ofseti
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Yerel tarih formatı (YYYY-MM-DD)
  const getLocalDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const [selectedFullDate, setSelectedFullDate] = useState(getLocalDate(new Date()));

  // Takvim Hesaplamaları
  const { weekDays, currentMonthYear } = useMemo(() => {
    const days = [];
    const now = new Date();
    
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + (weekOffset * 7));

    for (let i = 0; i < 7; i++) {
      const tempDate = new Date(monday);
      tempDate.setDate(monday.getDate() + i);
      const iso = getLocalDate(tempDate);
      
      days.push({
        label: tempDate.toLocaleDateString('tr-TR', { weekday: 'short' }),
        day: tempDate.getDate(),
        fullDate: iso,
      });
    }

    const monthYear = monday.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return { weekDays: days, currentMonthYear: monthYear };
  }, [weekOffset]);

  useEffect(() => {
    setSelectedFullDate(weekDays[0].fullDate);
  }, [weekOffset]);

  useEffect(() => {
    loadData();
  }, [selectedFullDate]);

  // Veritabanından Veri Çekme
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = `${selectedFullDate}T00:00:00.000Z`;
      const endOfDay = `${selectedFullDate}T23:59:59.999Z`;

      // meals tablosundan verileri çekiyoruz
      const { data, error } = await supabase
        .from('meals') 
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setFoods(data);
        const totals = data.reduce((acc, curr) => ({
          cal: acc.cal + (curr.calories || 0),
          c: acc.c + (curr.carbs || 0),
          p: acc.p + (curr.protein || 0),
          f: acc.f + (curr.fat || 0),
        }), { cal: 0, c: 0, p: 0, f: 0 });
        setStats(totals);
      }
    } catch (e) {
      console.error("Veri yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => setWeekOffset(prev => prev - 1)}
        >
          <Text style={styles.navText}>{"<"}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMonth}>{currentMonthYear}</Text>
          <Text style={styles.headerSubtitle}>
            {weekOffset === 0 ? "Bu Hafta" : "Geçmiş Kayıtlar"}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.navBtn, weekOffset === 0 && { opacity: 0.2 }]} 
          onPress={() => setWeekOffset(prev => prev + 1)}
          disabled={weekOffset === 0}
        >
          <Text style={styles.navText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Yatay Takvim */}
        <View style={styles.calendarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
            {weekDays.map((item) => (
              <DayItem 
                key={item.fullDate} 
                label={item.label} 
                day={item.day} 
                isActive={item.fullDate === selectedFullDate}
                onPress={() => setSelectedFullDate(item.fullDate)} 
              />
            ))}
          </ScrollView>
        </View>

        {/* Özet Kartı */}
        <View style={styles.cardWrapper}>
          <DailySummaryCard 
            calories={stats.cal} 
            carbs={stats.c} 
            protein={stats.p} 
            fat={stats.f} 
          />
        </View>

        <View style={styles.buttonPadding}>
          <PrimaryButton 
            text="Detaylı Raporları Gör" 
            onPress={() => navigation.navigate('Reports')} 
          />
        </View>

        {/* Yemek Listesi */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Günün Yemekleri</Text>
          {loading ? (
            <ActivityIndicator color="#4b7c5a" size="large" style={{ marginTop: 20 }} />
          ) : foods.length > 0 ? (
            foods.map(item => (
              <RecentActivityItem 
                key={item.id}
                title={item.name} // meals tablosundaki 'name'
                subtitle={`${item.calories} kcal • ${new Date(item.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`}
                // İKON YERİNE RESİM: Eğer image_url varsa resmi bas, yoksa emoji göster
                icon={
                  item.image_url ? (
                    <RNImage source={{ uri: item.image_url }} style={styles.itemImage} />
                  ) : "🍲"
                }
                iconBgColor="#f1f5f9" 
                iconColor="#4b7c5a"
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bu gün için kayıt bulunmuyor.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF5' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  headerMonth: { fontSize: 18, fontWeight: 'bold', color: '#121614', textTransform: 'capitalize' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  navBtn: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 20, fontWeight: 'bold', color: '#4b7c5a' },
  calendarContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 5 },
  calendarScroll: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  cardWrapper: { paddingVertical: 15 },
  buttonPadding: { paddingHorizontal: 16, marginBottom: 15 },
  listSection: { paddingHorizontal: 16, paddingBottom: 50 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#121614', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#999', fontSize: 15, fontWeight: '500' },
  // Yemek resmi stili
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'cover'
  }
});

export default ProgressScreen;