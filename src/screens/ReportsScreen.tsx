import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

// Bileşenlerin (Bunların tanımlı olduğunu varsayıyoruz)
import SegmentedControl from '../components/SegmentedControl';
import CalorieChartCard from '../components/CalorieChartCard';
import MacroProgressCard from '../components/MacroProgressCard';
import HydrationCard from '../components/HydrationCard';
import ExtraStatCard from '../components/ExtraStatCard';

const ReportsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly', 'monthly'
  const [reportData, setReportData] = useState({
    avgCalories: 0,
    macros: { carbs: 0, protein: 0, fat: 0 },
    waterTotal: 0,
    burnedCalories: 0,
    steps: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [timeframe]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = timeframe === 'weekly' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Backend (Supabase) verilerini çekiyoruz
      const { data, error } = await supabase
        .from('food_logs')
        .select('calories, carbs, protein, fat, water_amount')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (data) {
        const total = data.reduce((acc, curr) => ({
          cal: acc.cal + (curr.calories || 0),
          c: acc.c + (curr.carbs || 0),
          p: acc.p + (curr.protein || 0),
          f: acc.f + (curr.fat || 0),
          w: acc.w + (curr.water_amount || 0)
        }), { cal: 0, c: 0, p: 0, f: 0, w: 0 });

        const totalMacros = total.c + total.p + total.f;

        setReportData({
          avgCalories: Math.round(total.cal / days),
          macros: {
            carbs: totalMacros > 0 ? Math.round((total.c / totalMacros) * 100) : 0,
            protein: totalMacros > 0 ? Math.round((total.p / totalMacros) * 100) : 0,
            fat: totalMacros > 0 ? Math.round((total.f / totalMacros) * 100) : 0,
          },
          waterTotal: total.w,
          burnedCalories: 450, // Şimdilik statik, ileride egzersiz tablosundan çekilebilir
          steps: 8432 // Şimdilik statik
        });
      }
    } catch (err) {
      console.error("Rapor hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Raporlar</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#32d411" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <SegmentedControl activeTab={timeframe} onTabChange={(val: string) => setTimeframe(val)} />
          </View>

          <View style={styles.section}>
            <CalorieChartCard calories={reportData.avgCalories} />
          </View>

          <View style={styles.section}>
            <MacroProgressCard 
              carbs={reportData.macros.carbs} 
              protein={reportData.macros.protein} 
              fat={reportData.macros.fat} 
            />
          </View>

          <View style={styles.section}>
            <HydrationCard totalWater={reportData.waterTotal} />
          </View>

          <View style={styles.gridContainer}>
             <ExtraStatCard icon="🔥" iconColor="#f97316" title="YAKILAN" value={reportData.burnedCalories.toString()} unit="kcal" />
             <ExtraStatCard icon="👟" iconColor="#a855f7" title="ADIM" value={reportData.steps.toString()} />
          </View>
          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#101b0d' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, color: '#101b0d' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16 },
  section: { marginBottom: 20 },
  gridContainer: { flexDirection: 'row', gap: 16 },
});

export default ReportsScreen;