import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CameraOverlay = () => {
  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Köşe Çizgileri */}
      <View style={styles.cornersContainer}>
        <View style={styles.row}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
        </View>
        <View style={styles.row}>
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Ortadaki "Algılandı" Rozeti */}
      <View style={styles.badgeContainer}>
        <View style={styles.pulseCircle} />
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>📹</Text>
          <Text style={styles.badgeText}>YEMEK ALGILANDI</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: 'space-between',
  },
  cornersContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  corner: {
    width: 32,
    height: 32,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  topLeft: { borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  topRight: { borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  bottomLeft: { borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  bottomRight: { borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
  
  badgeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -20 }], // Ortalamak için yaklaşık değerler
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(19, 236, 34, 0.2)', // Primary color
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  badgeIcon: { fontSize: 16 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
});

export default CameraOverlay;