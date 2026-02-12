import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Bileşenlerimizi import ediyoruz
import WeightChartCard from '../components/WeightChartCard';
import StatCard from '../components/StatCard';
import MotivationCard from '../components/MotivationCard';
import RecentActivityItem from '../components/RecentActivityItem';

const ProgressScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gelişimim</Text>
        <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 1. Grafik Bölümü */}
        <WeightChartCard />

        {/* 2. İstatistik Grid */}
        <View style={styles.gridContainer}>
          <StatCard 
            title="Haftalık Ort. Kalori"
            value="1,850"
            icon="🔥"
            iconBgColor="#fff7ed" // Turuncumsu açık
            iconColor="#f97316"   // Turuncu
          />
          <StatCard 
            title="Kalan Hedef"
            value="3.2"
            unit="kg"
            icon="⚖️"
            iconBgColor="#eff6ff" // Mavimsi açık
            iconColor="#3b82f6"   // Mavi
          />
        </View>

        {/* 3. Motivasyon Kartı */}
        <MotivationCard />

        {/* 4. Son Aktiviteler Listesi */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>Tümünü gör</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.listContainer}>
            <RecentActivityItem 
              title="Su İçimi"
              subtitle="200ml • 10:30"
              icon="💧"
              iconBgColor="#eff6ff"
              iconColor="#3b82f6"
            />
            <RecentActivityItem 
              title="Kahvaltı"
              subtitle="450 kcal • 08:15"
              icon="🍳"
              iconBgColor="#fff7ed"
              iconColor="#f97316"
            />
          </View>
        </View>

        {/* Alt boşluk (Bottom navigation için) */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f6f8f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  moreIcon: { fontSize: 18, fontWeight: 'bold', color: '#333', letterSpacing: 2 },
  
  content: {
    padding: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  
  // Aktivite Bölümü
  activitySection: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#13ec22', // Primary
  },
  listContainer: {
    // Liste elemanları buraya gelecek
  }
});

export default ProgressScreen;