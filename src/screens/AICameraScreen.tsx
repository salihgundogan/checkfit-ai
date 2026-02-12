import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import CameraOverlay from '../components/CameraOverlay';
import AnalysisBottomSheet from '../components/AnalysisBottomSheet';

const AICameraScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8f6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Öğününü Tanı</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Kamera/Resim Alanı */}
        <View style={styles.cameraContainer}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1529042410759-befb72002f40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }} // Örnek yemek resmi
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 24 }}
          >
             <CameraOverlay />
          </ImageBackground>
        </View>
      </View>

      {/* Alt Panel - Absolute positioned */}
      <View style={styles.bottomSheetContainer}>
        <AnalysisBottomSheet />
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  content: { flex: 1, padding: 16, paddingBottom: 0 },
  cameraContainer: {
    flex: 1,
    marginBottom: 80, // Bottom sheet için yer bırak
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#000',
  },
  imageBackground: { width: '100%', height: '100%' },
  
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});

export default AICameraScreen;