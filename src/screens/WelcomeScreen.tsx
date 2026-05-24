import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Easing, Dimensions,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, {
  Circle, Path, G, Defs, RadialGradient,
  LinearGradient, Stop, Rect, Line,
} from 'react-native-svg';
import { useTheme } from './ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// SVG İLLÜSTRASYONLARI
// ─────────────────────────────────────────────────────────────

// Slide 1 — AI Kamera + Yemek Tanıma
const SlideOneArt = ({ color }: { color: string }) => {
  const scan   = useRef(new Animated.Value(0)).current;
  const pulse  = useRef(new Animated.Value(1)).current;
  const dotOp  = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOp, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(dotOp, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });
  const S = 260;
  const cx = S / 2; const cy = S / 2;

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id="rg1" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={color} stopOpacity="0" />
            <Stop offset="50%"  stopColor={color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Glow */}
        <Circle cx={cx} cy={cy} r={110} fill="url(#rg1)" />

        {/* Kamera gövdesi */}
        <Rect x={55} y={75} width={150} height={110} rx={16}
          fill={color + '18'} stroke={color} strokeWidth={2} strokeOpacity={0.7} />

        {/* Lens */}
        <Circle cx={cx} cy={cy + 5} r={34} fill={color + '20'} stroke={color} strokeWidth={1.8} strokeOpacity={0.6} />
        <Circle cx={cx} cy={cy + 5} r={22} fill={color + '30'} stroke={color} strokeWidth={1.2} strokeOpacity={0.8} />
        <Circle cx={cx} cy={cy + 5} r={10} fill={color} fillOpacity={0.85} />

        {/* Flash */}
        <Rect x={170} y={84} width={18} height={10} rx={4}
          fill={color} fillOpacity={0.6} />

        {/* Kamera üstü çıkıntı */}
        <Rect x={100} y={65} width={40} height={14} rx={7}
          fill={color + '30'} stroke={color} strokeWidth={1.2} strokeOpacity={0.5} />

        {/* Köşe tarama çerçevesi */}
        {[
          [58, 78], [58, 78],
        ].map((_, i) => null)}
        {/* TL */}
        <Path d="M62,95 L62,82 L78,82" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* TR */}
        <Path d="M198,95 L198,82 L182,82" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* BL */}
        <Path d="M62,165 L62,178 L78,178" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* BR */}
        <Path d="M198,165 L198,178 L182,178" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* Yanıp sönen nokta */}
        <Circle cx={84} cy={90} r={5} fill={color} fillOpacity={dotOp} />
      </Svg>

      {/* Tarama çizgisi — Animated.View ile */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 55, top: 75,
          width: 150, height: 4,
          transform: [{ translateY: scanY }],
          overflow: 'hidden',
        }}
      >
        <Svg width={150} height={4}>
          <Defs>
            <LinearGradient id="sl" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%"   stopColor={color} stopOpacity="0" />
              <Stop offset="50%"  stopColor={color} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={150} height={4} fill="url(#sl)" rx={2} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

// Slide 2 — Makro & Kalori Takibi
const SlideTwoArt = ({ color }: { color: string }) => {
  const ring  = useRef(new Animated.Value(0)).current;
  const bars  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring,  { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.delay(800),
        Animated.timing(ring,  { toValue: 0, duration: 600,  useNativeDriver: false }),
        Animated.delay(400),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bars, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.delay(1200),
        Animated.timing(bars, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.delay(400),
      ])
    ).start();
  }, []);

  const S = 260; const cx = S / 2; const cy = 110;
  const r = 72; const stroke = 18;
  const circ = 2 * Math.PI * r;

  const dash = ring.interpolate({ inputRange: [0, 1], outputRange: [0, circ * 0.78] });

  const barData = [
    { color: '#fb923c', label: 'Karb', pct: 0.62, x: 28 },
    { color: '#60a5fa', label: 'Pro',  pct: 0.45, x: 78 },
    { color: '#a78bfa', label: 'Yağ',  pct: 0.3,  x: 128 },
  ];
  const maxH = 80;

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Defs>
        <RadialGradient id="rg2" cx="50%" cy="42%" r="50%">
          <Stop offset="0%"   stopColor={color} stopOpacity="0.13" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={r + 30} fill="url(#rg2)" />

      {/* Track */}
      <Circle cx={cx} cy={cy} r={r} stroke={color + '20'} strokeWidth={stroke} fill="none" />

      {/* Animated arc — workaround: use a fixed large dash for animation feel */}
      <Circle cx={cx} cy={cy} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${circ * 0.78} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeOpacity={0.85}
      />

      {/* Merkez */}
      <Circle cx={cx} cy={cy} r={r - stroke / 2 - 4} fill={color + '10'} />
      <Circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.9} />

      {/* Kalori metni */}
      <G>
        <Path d={`M${cx - 22},${cy - 8} L${cx + 22},${cy - 8}`}
          stroke={color} strokeOpacity={0.2} strokeWidth={1} />
      </G>

      {/* Bar chart */}
      {barData.map((b, i) => (
        <G key={i}>
          <Rect
            x={b.x + 155} y={S - 40 - maxH * b.pct}
            width={30} height={maxH * b.pct}
            rx={6} fill={b.color} fillOpacity={0.85}
          />
          <Rect
            x={b.x + 155} y={S - 40 - maxH}
            width={30} height={maxH}
            rx={6} fill={b.color} fillOpacity={0.1}
          />
        </G>
      ))}

      {/* Alt çizgi */}
      <Line x1={155} y1={S - 40} x2={S - 10} y2={S - 40}
        stroke={color} strokeOpacity={0.2} strokeWidth={1} />

      {/* Bar etiketleri */}
      {barData.map((b, i) => (
        <G key={`l${i}`}>
          <Circle cx={b.x + 170} cy={S - 22} r={3} fill={b.color} fillOpacity={0.8} />
        </G>
      ))}

      {/* Makro legend - sol alt */}
      {[
        { c: '#fb923c', y: S - 60 },
        { c: '#60a5fa', y: S - 42 },
        { c: '#a78bfa', y: S - 24 },
      ].map((m, i) => (
        <G key={`m${i}`}>
          <Rect x={10} y={m.y - 4} width={22} height={8} rx={4} fill={m.c} fillOpacity={0.8} />
        </G>
      ))}
    </Svg>
  );
};

// Slide 3 — Hedef & Seri
const SlideThreeArt = ({ color }: { color: string }) => {
  const pulse  = useRef(new Animated.Value(1)).current;
  const starOp = useRef(new Animated.Value(0.4)).current;
  const ekg    = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse,  { toValue: 1.1,  duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse,  { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(starOp, { toValue: 1,    duration: 800,  useNativeDriver: true }),
      Animated.timing(starOp, { toValue: 0.4,  duration: 800,  useNativeDriver: true }),
    ])).start();
  }, []);

  const S = 260; const cx = S / 2; const cy = S / 2;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <Defs>
          <RadialGradient id="rg3" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glow */}
        <Circle cx={cx} cy={cy} r={100} fill="url(#rg3)" />

        {/* Dış halka */}
        <Circle cx={cx} cy={cy} r={95} stroke={color} strokeWidth={1}
          strokeOpacity={0.15} fill="none" strokeDasharray="5,4" />

        {/* Trophy gövde */}
        <Path
          d={`M${cx - 34},${cy - 50} L${cx + 34},${cy - 50} L${cx + 28},${cy + 10} Q${cx},${cy + 30} ${cx - 28},${cy + 10} Z`}
          fill={color + '25'} stroke={color} strokeWidth={2} strokeOpacity={0.8}
        />
        {/* Kupa sapı */}
        <Path d={`M${cx - 12},${cy + 10} L${cx - 16},${cy + 36} L${cx + 16},${cy + 36} L${cx + 12},${cy + 10}`}
          fill={color + '20'} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
        {/* Kupa tabanı */}
        <Rect x={cx - 22} y={cy + 34} width={44} height={8} rx={4}
          fill={color + '30'} stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />

        {/* Sol kulp */}
        <Path d={`M${cx - 34},${cy - 40} Q${cx - 55},${cy - 40} ${cx - 55},${cy - 18} Q${cx - 55},${cy + 2} ${cx - 34},${cy + 2}`}
          fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.55} />
        {/* Sağ kulp */}
        <Path d={`M${cx + 34},${cy - 40} Q${cx + 55},${cy - 40} ${cx + 55},${cy - 18} Q${cx + 55},${cy + 2} ${cx + 34},${cy + 2}`}
          fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.55} />

        {/* Yıldız içinde */}
        <Path
          d={`M${cx},${cy - 28} L${cx + 7},${cy - 10} L${cx + 26},${cy - 10} L${cx + 11},${cy + 0} L${cx + 17},${cy + 18} L${cx},${cy + 8} L${cx - 17},${cy + 18} L${cx - 11},${cy + 0} L${cx - 26},${cy - 10} L${cx - 7},${cy - 10} Z`}
          fill={color} fillOpacity={0.75}
        />

        {/* Parıltı noktaları */}
        {[
          [cx - 65, cy - 55], [cx + 68, cy - 48],
          [cx - 72, cy + 20], [cx + 74, cy + 28],
          [cx,      cy - 95],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={3.5} fill={color} fillOpacity={0.5 + i * 0.08} />
        ))}

        {/* EKG alt */}
        <Path
          d={`M${cx - 80},${cy + 72} L${cx - 55},${cy + 72} L${cx - 42},${cy + 54} L${cx - 30},${cy + 84} L${cx - 18},${cy + 60} L${cx - 6},${cy + 72} L${cx + 20},${cy + 72} L${cx + 33},${cy + 54} L${cx + 46},${cy + 84} L${cx + 58},${cy + 60} L${cx + 70},${cy + 72} L${cx + 85},${cy + 72}`}
          fill="none" stroke={color} strokeWidth={2.2}
          strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.65}
        />
      </Svg>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// SLIDE VERİSİ
// ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'scan',
    title: 'Fotoğraf Çek,\nAI Hesaplasın',
    sub: 'Yemeğini kameraya göster. CheckFit AI saniyelerde kalorisini, proteinini ve makrolarını hesaplar.',
    cta: null,
    Art: SlideOneArt,
  },
  {
    key: 'track',
    title: 'Her Makroyu\nTakip Et',
    sub: 'Kalori, karbonhidrat, protein ve yağ — günlük hedeflerine ne kadar yakın olduğunu anlık gör.',
    cta: null,
    Art: SlideTwoArt,
  },
  {
    key: 'goal',
    title: 'Hedefe Ulaş,\nSeriyi Kır',
    sub: 'Günlük serilerini koru, ilerlemenı takip et ve sağlıklı yaşamı bir alışkanlığa dönüştür.',
    cta: 'Hadi Başlayalım',
    Art: SlideThreeArt,
  },
];

// ─────────────────────────────────────────────────────────────
// ANA EKRAN
// ─────────────────────────────────────────────────────────────
const WelcomeScreen = () => {
  const navigation      = useNavigation<any>();
  const { T, darkMode } = useTheme();
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Fade animasyonları
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textY       = useRef(new Animated.Value(0)).current;

  const animateText = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 12, duration: 180, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();
  };

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= SLIDES.length) return;
    animateText();
    scrollRef.current?.scrollTo({ x: idx * SW, animated: true });
    setActiveIdx(idx);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== activeIdx) {
      animateText();
      setActiveIdx(idx);
    }
  };

  const PRIMARY = T.primary;
  const slide   = SLIDES[activeIdx];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: T.bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      {/* Skip */}
      <View style={s.topRow}>
        <View />
        {activeIdx < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
            <Text style={[s.skip, { color: T.muted }]}>Geç</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slider */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((sl) => (
          <View key={sl.key} style={[s.slide, { width: SW }]}>
            <sl.Art color={PRIMARY} />
          </View>
        ))}
      </ScrollView>

      {/* Alt içerik */}
      <View style={s.bottom}>

        {/* Metin */}
        <Animated.View style={[s.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          <Text style={[s.title, { color: T.text }]}>{slide.title}</Text>
          <Text style={[s.sub, { color: T.muted }]}>{slide.sub}</Text>
        </Animated.View>

        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.8}>
              <Animated.View style={[
                s.dot,
                {
                  backgroundColor: PRIMARY,
                  opacity: i === activeIdx ? 1 : 0.25,
                  width: i === activeIdx ? 24 : 8,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Butonlar */}
        {activeIdx < SLIDES.length - 1 ? (
          <View style={s.navRow}>
            <TouchableOpacity
              style={[s.ghostBtn, { borderColor: PRIMARY + '50' }]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.75}
            >
              <Text style={[s.ghostTxt, { color: T.muted }]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.mainBtn, { backgroundColor: PRIMARY }]}
              onPress={() => goTo(activeIdx + 1)}
              activeOpacity={0.85}
            >
              <Text style={s.mainBtnTxt}>İleri →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.finalCol}>
            <TouchableOpacity
              style={[s.mainBtn, s.mainBtnFull, { backgroundColor: PRIMARY }]}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={s.mainBtnTxt}>Hadi Başlayalım 🚀</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={[s.loginLink, { color: T.muted }]}>
                Zaten hesabın var mı?{' '}
                <Text style={{ color: PRIMARY, fontWeight: '700' }}>Giriş Yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STİLLER
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1 },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  skip:        { fontSize: 15, fontWeight: '600' },

  slide:       { alignItems: 'center', justifyContent: 'center', flex: 1 },

  bottom:      { paddingHorizontal: 28, paddingBottom: 36, gap: 24 },

  textBlock:   { alignItems: 'center', gap: 12 },
  title:       { fontSize: 30, fontWeight: '800', textAlign: 'center', lineHeight: 38, letterSpacing: -0.5 },
  sub:         { fontSize: 15, textAlign: 'center', lineHeight: 23, paddingHorizontal: 4 },

  dots:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot:         { height: 8, borderRadius: 4 },

  navRow:      { flexDirection: 'row', gap: 12 },
  ghostBtn:    { flex: 1, height: 54, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ghostTxt:    { fontSize: 15, fontWeight: '600' },
  mainBtn:     { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mainBtnFull: { flex: 0, width: '100%' },
  mainBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  finalCol:    { gap: 14, alignItems: 'center' },
  loginLink:   { fontSize: 14 },
});

export default WelcomeScreen;