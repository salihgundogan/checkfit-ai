import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface StepHeaderProps {
  currentStep: number; // 1, 2, 3, 4
  totalSteps?: number;
}

const StepHeader: React.FC<StepHeaderProps> = ({ currentStep, totalSteps = 4 }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backIcon}>←</Text> 
        {/* İstersek buraya material icon koyabiliriz */}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const step = index + 1;
          const isActive = step <= currentStep;
          const isCurrent = step === currentStep;
          
          return (
            <View
              key={step}
              style={[
                styles.dot,
                isActive && styles.activeDot,
                isCurrent && styles.currentDot, 
              ]}
            />
          );
        })}
      </View>
      
      {/* Sağ taraftaki logo  */}
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#111811',
    fontWeight: 'bold',
    marginBottom: 4, // Text tabanlı ok hizalaması için
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(47, 127, 52, 0.2)', // Pasif renk
  },
  activeDot: {
    backgroundColor: '#2f7f34', // Primary
  },
  currentDot: {
    width: 24, // Aktif olan daha uzun
  },
  placeholder: {
    width: 40,
  }
});

export default StepHeader;