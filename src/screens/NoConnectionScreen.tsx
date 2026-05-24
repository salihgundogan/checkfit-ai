import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from './ThemeContext';

import PrimaryButton from '../components/PrimaryButton';
import ErrorIllustration from '../components/ErrorIllustration';

const NoConnectionScreen = () => {
  const navigation = useNavigation();
  const { T, darkMode } = useTheme();

  const S = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: T.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: T.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 28,
      color: T.text,
      fontWeight: '300',
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginTop: -40,
    },
    textContainer: {
      alignItems: 'center',
      marginBottom: 32,
      maxWidth: 320,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: T.text,
      marginBottom: 12,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: T.muted,
      textAlign: 'center',
      lineHeight: 24,
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 280,
      gap: 16,
    },
    secondaryButton: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
    },
    secondaryButtonText: {
      color: T.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  }), [T]);

  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        navigation.goBack();
      } else {
        Alert.alert('Bağlantı Yok', 'Hala internet bağlantısı bulunamadı.');
      }
    });
  };

  const handleSettings = () => {
    console.log('Ayarlar açılıyor...');
  };

  return (
    <SafeAreaView style={S.container}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={T.bg}
      />

      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backButton}>
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerSpacer} />
      </View>

      <View style={S.content}>
        <ErrorIllustration />

        <View style={S.textContainer}>
          <Text style={S.title}>Bağlantı Kesildi</Text>
          <Text style={S.subtitle}>
            İnternet bağlantısı kurulamadı. Lütfen ağ ayarlarınızı kontrol edip tekrar deneyin.
          </Text>
        </View>

        <View style={S.buttonContainer}>
          <PrimaryButton text="Tekrar Dene" onPress={handleRetry} />
          <TouchableOpacity style={S.secondaryButton} onPress={handleSettings}>
            <Text style={S.secondaryButtonText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NoConnectionScreen;