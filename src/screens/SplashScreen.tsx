import React, { useEffect, useRef, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  useColorScheme,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { height, width } = Dimensions.get('window');

// ── YENİ: AI & SAĞLIK İKONU (nöron ağı + EKG) ──
const AiHealthLogo = ({ color = '#13ec22', size = 68 }: { color?: string; size?: number }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Noktaların yanıp sönme animasyonu (AI hissi)
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Nokta opaklıkları için interpolasyon
  const opacity1 = dotAnim;
  const opacity2 = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const opacity3 = dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.2] });

  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* Dış halka */}
      <Circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="1.8" strokeOpacity="0.4" />
      
      {/* Nöron ağı (AI) – çizgiler ve noktalar */}
      <G stroke={color} strokeWidth="1.5" strokeOpacity="0.85" fill="none">
        <Path d="M40,18 L28,32 M40,18 L52,32 M28,32 L20,48 M28,32 L40,44 M52,32 L60,48 M52,32 L40,44" />
        <Path d="M20,48 L28,60 M20,48 L40,60 M60,48 L52,60 M60,48 L40,60" />
      </G>
      
      {/* Noktalar (sinapslar) – animasyonlu */}
      <Circle cx="40" cy="18" r="2.5" fill={color} fillOpacity={0.9} />
      <Circle cx="28" cy="32" r="2.2" fill={color} fillOpacity={opacity1} />
      <Circle cx="52" cy="32" r="2.2" fill={color} fillOpacity={opacity2} />
      <Circle cx="20" cy="48" r="2" fill={color} fillOpacity={opacity3} />
      <Circle cx="60" cy="48" r="2" fill={color} fillOpacity={opacity1} />
      <Circle cx="40" cy="44" r="2.5" fill={color} fillOpacity={0.9} />
      <Circle cx="28" cy="60" r="2" fill={color} fillOpacity={opacity2} />
      <Circle cx="52" cy="60" r="2" fill={color} fillOpacity={opacity3} />

      {/* EKG çizgisi (kalp atışı) */}
      <Path
        d="M18,66 L24,66 L27,58 L30,70 L33,62 L36,66 L44,66 L47,58 L50,70 L53,62 L56,66 L62,66"
        fill="none"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.95"
      />
      
      {/* Merkezde minik kalp sembolü */}
      <Path
        d="M40,52 C40,52 36,48 34,50 C32,52 32,55 36,58 L40,61 L44,58 C48,55 48,52 46,50 C44,48 40,52 40,52 Z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="1.2"
      />
    </Svg>
  );
};

const SplashScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  // Animasyon ref'leri
  const ring1Scale    = useRef(new Animated.Value(0.65)).current;
  const ring1Opacity  = useRef(new Animated.Value(0)).current;
  const ring2Scale    = useRef(new Animated.Value(0.72)).current;
  const ring2Opacity  = useRef(new Animated.Value(0)).current;
  const ring3Scale    = useRef(new Animated.Value(0.8)).current;
  const ring3Opacity  = useRef(new Animated.Value(0)).current;

  const logoScale     = useRef(new Animated.Value(0.45)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const logoRotate    = useRef(new Animated.Value(-10)).current;

  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(28)).current;
  const tagsOpacity   = useRef(new Animated.Value(0)).current;
  const tagsY         = useRef(new Animated.Value(18)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const loadWidth     = useRef(new Animated.Value(0)).current;

  const pulseScale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1, duration: 700, easing: easeOut, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 1, duration: 700, easing: easeOut, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1, duration: 550, easing: easeOut, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 1, duration: 550, easing: easeOut, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring3Scale,   { toValue: 1, duration: 450, easing: easeOut, useNativeDriver: true }),
        Animated.timing(ring3Opacity, { toValue: 1, duration: 450, easing: easeOut, useNativeDriver: true }),
        Animated.spring(logoScale,    { toValue: 1, tension: 52, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity,  { toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true }),
        Animated.timing(logoRotate,   { toValue: 0, duration: 550, easing: easeOut, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 500, easing: easeOut, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(tagsOpacity, { toValue: 1, duration: 450, easing: easeOut, useNativeDriver: true }),
        Animated.timing(tagsY,       { toValue: 0, duration: 450, easing: easeOut, useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true }),
      // ⏱️ SÜRE UZATILDI: 2 saniyeden 4 saniyeye (2000 → 4000)
      Animated.timing(loadWidth, {
        toValue: 120,
        duration: 4000,   // ← 2 dakika değil, 4 saniye (kullanıcı deneyimi için makul)
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Sürekli pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.045,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const bg        = isDarkMode ? '#0b1a0e' : '#f0f7f1';
  const txt       = isDarkMode ? '#ffffff' : '#0d1b0e';
  const subColor  = isDarkMode ? 'rgba(255,255,255,0.42)' : 'rgba(13,27,14,0.42)';
  const tagBg     = isDarkMode ? 'rgba(19,236,34,0.12)' : 'rgba(19,236,34,0.1)';
  const tagBorder = isDarkMode ? 'rgba(19,236,34,0.3)'  : 'rgba(19,236,34,0.32)';
  const tagTxt    = isDarkMode ? '#7dffa0' : '#0d600f';
  const ringBg    = isDarkMode ? 'rgba(19,236,34,0.07)' : 'rgba(19,236,34,0.06)';
  const ringBorderC = isDarkMode ? 'rgba(19,236,34,0.22)' : 'rgba(19,236,34,0.2)';

  const logoRotateDeg = logoRotate.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* Halkalar */}
      <Animated.View style={[styles.ring, styles.ringXL, { borderColor: ringBorderC, opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]} />
      <Animated.View style={[styles.ring, styles.ringLG, { borderColor: ringBorderC, opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]} />
      <Animated.View style={[styles.ring, styles.ringMD, { backgroundColor: ringBg, borderColor: 'rgba(19,236,34,0.3)', opacity: ring3Opacity, transform: [{ scale: ring3Scale }] }]} />

      {/* Dekoratif çizgiler */}
      <View style={[styles.divRow, { top: height * 0.265 }]}>
        <View style={[styles.divLine, { backgroundColor: 'rgba(19,236,34,0.18)' }]} />
        <View style={[styles.divDot,  { backgroundColor: 'rgba(19,236,34,0.32)' }]} />
        <View style={[styles.divLine, { backgroundColor: 'rgba(19,236,34,0.18)' }]} />
      </View>
      <View style={[styles.divRow, { top: height * 0.60 }]}>
        <View style={[styles.divLine, { backgroundColor: 'rgba(19,236,34,0.12)' }]} />
        <View style={[styles.divDot,  { backgroundColor: 'rgba(19,236,34,0.2)' }]} />
        <View style={[styles.divLine, { backgroundColor: 'rgba(19,236,34,0.12)' }]} />
      </View>

      {/* Köşe noktaları */}
      {[0,1,2,3].map(i => (
        <View key={`tr${i}`} style={[styles.dot, { top: 98 + i*7, right: 36 - i*4, opacity: 0.14 + i*0.04, backgroundColor: '#13ec22' }]} />
      ))}
      {[0,1,2,3].map(i => (
        <View key={`bl${i}`} style={[styles.dot, { bottom: 162 + i*7, left: 36 - i*4, opacity: 0.14 + i*0.04, backgroundColor: '#13ec22' }]} />
      ))}

      {/* Merkez içerik */}
      <View style={styles.center}>
        <Animated.View style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [
              { scale: Animated.multiply(logoScale, pulseScale) },
              { rotate: logoRotateDeg },
            ],
          },
        ]}>
          <View style={[styles.logoBorderOuter, { borderColor: 'rgba(19,236,34,0.2)' }]} />
          <View style={[styles.logoBorderMid, { borderColor: 'rgba(19,236,34,0.38)', backgroundColor: 'rgba(19,236,34,0.05)' }]} />
          <View style={[styles.logoInner, { backgroundColor: isDarkMode ? 'rgba(19,236,34,0.13)' : 'rgba(19,236,34,0.11)', borderColor: 'rgba(19,236,34,0.52)' }]}>
            <AiHealthLogo color="#13ec22" size={68} />
          </View>
        </Animated.View>

        {/* Başlık */}
        <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: txt }]}>CheckFit</Text>
            <Text style={styles.titleAccent}> AI</Text>
          </View>
          <View style={styles.subtitleRow}>
            <View style={[styles.subtitleLine, { backgroundColor: 'rgba(19,236,34,0.35)' }]} />
            <Text style={[styles.subtitle, { color: subColor }]}>SAĞLIKLI YAŞAM ASİSTANINIZ</Text>
            <View style={[styles.subtitleLine, { backgroundColor: 'rgba(19,236,34,0.35)' }]} />
          </View>
        </Animated.View>

        {/* Etiketler */}
       <Animated.View style={[styles.tagsRow, { opacity: tagsOpacity, transform: [{ translateY: tagsY }] }]}>
  {[
    { icon: 'food-apple', l: 'Beslenme', big: false },
    { icon: 'robot', l: 'AI Analiz', big: true },
    { icon: 'dumbbell', l: 'Aktivite', big: false },
  ].map(tag => (
    <View 
      key={tag.l} 
      style={[
        styles.tag, 
        { backgroundColor: tagBg, borderColor: tagBorder }, 
        tag.big && styles.tagBig
      ]}
    >
      <Icon 
        name={tag.icon} 
        size={tag.big ? 32 : 22} 
        color={tagTxt} 
        style={{ marginRight: 6 }}
      />
      
      <Text style={[styles.tagText, { color: tagTxt }]}>
        {tag.l}
      </Text>
    </View>
  ))}
</Animated.View>
      </View>

      {/* Alt dalgalar */}
      <View style={[styles.wave1, { backgroundColor: isDarkMode ? 'rgba(19,236,34,0.045)' : 'rgba(19,236,34,0.055)' }]} />
      <View style={[styles.wave2, { backgroundColor: isDarkMode ? 'rgba(19,236,34,0.03)'  : 'rgba(19,236,34,0.04)'  }]} />
      <View style={[styles.wave3, { backgroundColor: isDarkMode ? 'rgba(19,236,34,0.02)'  : 'rgba(19,236,34,0.028)' }]} />

      {/* Footer (loading bar) */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingFill, { width: loadWidth }]} />
        </View>
        <Text style={[styles.version, { color: subColor }]}>V 1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const RING_TOP  = height * 0.395;
const LOGO_SIZE = 122;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1, alignSelf: 'center', top: RING_TOP },
  ringXL: { width: 342, height: 342, marginTop: -171, borderStyle: 'dashed' },
  ringLG: { width: 268, height: 268, marginTop: -134 },
  ringMD: { width: 198, height: 198, marginTop: -99, borderWidth: 1.5 },
  divRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', width: width * 0.74, alignSelf: 'center', gap: 8 },
  divLine: { flex: 1, height: 1 },
  divDot:  { width: 5, height: 5, borderRadius: 3 },
  dot:     { position: 'absolute', width: 5, height: 5, borderRadius: 3 },
  center: { alignItems: 'center', zIndex: 10, width: '100%', paddingHorizontal: 24 },
  logoWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 42, width: LOGO_SIZE + 64, height: LOGO_SIZE + 64 },
  logoBorderOuter: { position: 'absolute', width: LOGO_SIZE + 58, height: LOGO_SIZE + 58, borderRadius: (LOGO_SIZE + 58) / 2, borderWidth: 1, borderStyle: 'dashed' },
  logoBorderMid: { position: 'absolute', width: LOGO_SIZE + 30, height: LOGO_SIZE + 30, borderRadius: (LOGO_SIZE + 30) / 2, borderWidth: 1.5 },
  logoInner: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#13ec22', shadowOpacity: 0.38, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  textBlock: { alignItems: 'center', marginBottom: 30 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  title: { fontSize: 46, fontWeight: '900', letterSpacing: -1.8 },
  titleAccent: { fontSize: 46, fontWeight: '900', letterSpacing: -1.8, color: '#13ec22' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtitleLine: { width: 26, height: 1 },
  subtitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2.5 },
  tagsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tagBig: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5 },
  tagEmoji: { fontSize: 13 },
  tagText: { fontSize: 11, fontWeight: '700' },
  wave1: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.21, borderTopLeftRadius: width * 0.65, borderTopRightRadius: width * 0.65 },
  wave2: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.135, borderTopLeftRadius: width * 0.55, borderTopRightRadius: width * 0.55 },
  wave3: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.075, borderTopLeftRadius: width * 0.45, borderTopRightRadius: width * 0.45 },
  footer: { position: 'absolute', bottom: 46, alignItems: 'center', gap: 10, zIndex: 10 },
  loadingTrack: { width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(19,236,34,0.15)', overflow: 'hidden' },
  loadingFill: { height: '100%', borderRadius: 2, backgroundColor: '#13ec22', opacity: 0.72 },
  version: { fontSize: 11, fontWeight: '500', letterSpacing: 3.5 },
});

export default SplashScreen;