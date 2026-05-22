import React, { useRef, useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text,
  StatusBar, Platform, Alert, ActivityIndicator,SafeAreaView
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from './ThemeContext';
const CameraScreen: React.FC<NativeStackScreenProps<any, 'Camera'>> = ({ navigation }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
   const { T, darkMode } = useTheme();
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, []);

  const takePhoto = async () => {
    if (!camera.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        flash,
        qualityPrioritization: 'balanced',
      });
      navigation.replace('Analysis', {
        imageUri: `file://${photo.path}`,
      });
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setCapturing(false);
    }
  };

  // İzin yoksa
  if (!hasPermission) {
    return (
      <View style={[styles.centered, { backgroundColor: T.bg }]}>
        <Icon name="camera-alt" size={48} color="#4A7C59" />
        <Text style={styles.permText}>Kamera izni gerekli</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cihazda kamera yoksa
  if (!device) {
    return (
      <View style={[styles.centered, { backgroundColor: T.bg }]}>
        <ActivityIndicator color="#4A7C59" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Kamera önizleme */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Karartma overlay - sadece üst ve alt */}
      <View style={styles.topOverlay}>
        {/* Geri butonu */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="arrow-back-ios" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Flash butonu */}
        <TouchableOpacity
          onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}
          style={styles.iconBtn}
        >
          <Icon
            name={flash === 'on' ? 'flash-on' : 'flash-off'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Viewfinder köşeleri */}
      <View style={styles.viewfinder}>
        <View style={styles.vRow}>
          <View style={[styles.corner, { borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { borderTopWidth: 3, borderRightWidth: 3 }]} />
        </View>
        <View style={styles.vRow}>
          <View style={[styles.corner, { borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { borderBottomWidth: 3, borderRightWidth: 3 }]} />
        </View>
      </View>

      {/* Alt kontroller */}
      <View style={styles.bottomBar}>
        {/* Galeri butonu */}
        <TouchableOpacity
          style={styles.sideBtn}
          onPress={() => {
            // Galeri açma — react-native-image-picker ile
            Alert.alert('Bilgi', 'Galeri özelliği için react-native-image-picker gerekli');
          }}
        >
          <Icon name="photo-library" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Çek butonu */}
        <TouchableOpacity
          style={[styles.captureBtn, capturing && { opacity: 0.7 }]}
          onPress={takePhoto}
          disabled={capturing}
          activeOpacity={0.8}
        >
          {capturing
            ? <ActivityIndicator color="#0d1b0e" size="small" />
            : <View style={styles.captureBtnInner} />
          }
        </TouchableOpacity>

        {/* Sağ boşluk (simetri için) */}
        <View style={styles.sideBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b0e', gap: 16 },
  permText:       { color: '#fff', fontSize: 16, fontWeight: '600' },
  permBtn:        { backgroundColor: '#4A7C59', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  permBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  topOverlay:     {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iconBtn:        {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Viewfinder
  viewfinder:     {
    position: 'absolute',
    top: '25%', left: '10%', right: '10%', bottom: '25%',
    justifyContent: 'space-between',
  },
  vRow:           { flexDirection: 'row', justifyContent: 'space-between' },
  corner:         { width: 28, height: 28, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 4 },

  // Alt bar
  bottomBar:      {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sideBtn:        { width: 52, height: 52, justifyContent: 'center', alignItems: 'center' },
  captureBtn:     {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
  },
  captureBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#e2e2e2',
  },
});

export default CameraScreen;