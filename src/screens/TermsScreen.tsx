/**
 * TermsScreen.tsx
 * Kullanıcı Sözleşmesi & KVKK ekranı — WebView tabanlı.
 * Navigator'a ekle: <Stack.Screen name="Terms" component={TermsScreen} />
 *
 * Paramlar:
 *   url   : string  — gösterilecek URL
 *   title : string  — başlık çubuğu metni
 *
 * Gerekli paket: yarn add react-native-webview
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

const TermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route      = useRoute<any>();

  const url   = route.params?.url   ?? 'https://selami7321.github.io/checkfitai-privacy/';
  const title = route.params?.title ?? 'Gizlilik Politikası';

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAF5" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── WebView ────────────────────────────────────────────────────────── */}
      <View style={{ flex: 1, position: 'relative' }}>
        {!error ? (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1 }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
          />
        ) : (
          <View style={s.errorWrap}>
            <Text style={s.errorIcon}>😕</Text>
            <Text style={s.errorTitle}>Sayfa yüklenemedi</Text>
            <Text style={s.errorSub}>Lütfen internet bağlantınızı kontrol edin.</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => setError(false)} activeOpacity={0.8}>
              <Text style={s.retryTxt}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Yükleniyor overlay */}
        {loading && !error && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A7C59" />
            <Text style={s.loadingTxt}>Yükleniyor…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAF5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    paddingBottom: 14,
    backgroundColor: '#F9FAF5',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f3f5f0', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, fontWeight: '300', color: '#0d1b0e' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0d1b0e', textAlign: 'center', paddingHorizontal: 8 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAF5',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingTxt: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#0d1b0e' },
  errorSub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 13,
    backgroundColor: '#4A7C59', borderRadius: 14,
  },
  retryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default TermsScreen;