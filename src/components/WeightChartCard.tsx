import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WeightChartCard = () => {
  // Grafik verilerini simüle ediyoruz 
  const dataPoints = [35, 45, 25, 20, 18, 15, 10]; 
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Son 7 Gün</Text>
          <Text style={styles.subtitle}>Kilo Değişimi</Text>
        </View>
        <View style={styles.statsRight}>
          <Text style={styles.mainValue}>-1.2 <Text style={styles.unit}>kg</Text></Text>
          <View style={styles.badge}>
            <Text style={styles.trendIcon}>📉</Text>
            <Text style={styles.trendValue}>%0.4</Text>
          </View>
        </View>
      </View>

      {/* Grafik Alanı */}
      <View style={styles.chartContainer}>
        {/* Arka plan çizgileri */}
        <View style={styles.gridLines}>
            {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.gridLine} />
            ))}
        </View>

        {/* Barlar ve Noktalar */}
        <View style={styles.barsContainer}>
          {dataPoints.map((point, index) => (
            <View key={index} style={styles.barWrapper}>
              {/* Nokta ve Çizgi Simülasyonu */}
              <View style={[styles.barPoint, { bottom: point * 2 }]} />
              <View style={[styles.barFill, { height: point * 2 }]} />
              <Text style={styles.dayText}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  mainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#13ec22', // Primary Color
  },
  unit: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIcon: { fontSize: 12 },
  trendValue: { fontSize: 12, fontWeight: '600', color: '#059669' },
  
  // Grafik Stilleri
  chartContainer: {
    height: 150,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30, // Gün isimleri için boşluk
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 10,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: 20,
  },
  barPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#13ec22',
    position: 'absolute',
    zIndex: 10,
    marginBottom: -4, // Çizginin tam ucuna gelsin
  },
  barFill: {
    width: 2,
    backgroundColor: '#13ec22',
    opacity: 0.3,
    marginBottom: 24, // Gün yazısının üstünde dursun
    borderRadius: 2,
  },
  dayText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    position: 'absolute',
    bottom: 0,
  },
});

export default WeightChartCard;