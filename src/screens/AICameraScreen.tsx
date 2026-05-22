import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SelectionCard from '../components/SelectionCard';
import ManualSearchButton from '../components/ManualSearchButton';
import { useTheme } from './ThemeContext';
type RootStackParamList = {
  AICamera: undefined;
  ManualEntry: undefined;
  Analysis: { imageUri: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AICamera'>;

const AICameraScreen: React.FC<Props> = ({ navigation }) => {
  const { T,darkMode } = useTheme(); 
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Kamera İzni',
        message: 'Yemek fotoğrafı çekmek için kamera izni gerekli',
        buttonPositive: 'İzin Ver',
        buttonNegative: 'İptal',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Kamera İzni Gerekli',
        'Kamera iznini ayarlardan manuel olarak vermeniz gerekiyor.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleCamera = async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    }, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Hata', response.errorMessage || 'Kamera açılamadı');
      } else if (response.assets?.[0]?.uri) {
        navigation.navigate('Analysis', { imageUri: response.assets[0].uri });
      }
    });
  };

 
  // Galeri için izin yönetimini launchImageLibrary'e bırakıyoruz
  // Android sistem galerisi zaten kendi izin popup'ını gösteriyor
  const handleGallery = (): void => {
    launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    }, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode === 'permission') {
        Alert.alert(
          'Galeri İzni Gerekli',
          'Fotoğraf seçmek için galeri iznine ihtiyaç var.',
          [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
          ]
        );
      } else if (response.errorCode) {
        Alert.alert('Hata', response.errorMessage || 'Galeri açılamadı');
      } else if (response.assets?.[0]?.uri) {
        navigation.navigate('Analysis', { imageUri: response.assets[0].uri });
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={T.bg} />


      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Öğün Ekle</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { backgroundColor: T.surface }]}
          activeOpacity={0.7}
        >
          <Icon name="close" size={26} color={T.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          <SelectionCard
            title="Fotoğraf Çek"
            iconName="photo-camera"
            onPress={handleCamera}
          />
          <SelectionCard
            title="Galeriden Seç"
            iconName="image"
            onPress={handleGallery}
          />
        </View>

            <View style={styles.separator}>
          <View style={[styles.line, { backgroundColor: T.border }]} />
          <Text style={[styles.separatorText, { color: T.muted }]}>VEYA</Text>
          <View style={[styles.line, { backgroundColor: T.border }]} />
        </View>

        <ManualSearchButton onPress={() => navigation.navigate('ManualEntry')} />
      </View>

      <View style={{ height: 40 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAF5' },
  header:       {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  closeButton:  {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content:      { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  grid:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35, gap: 15 },
  separator:    { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line:         { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  separatorText:{ paddingHorizontal: 15, fontSize: 12, fontWeight: '700', color: '#94a3b8' },
});

export default AICameraScreen;