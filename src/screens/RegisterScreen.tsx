import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  Keyboard, StyleSheet, StatusBar, Platform, Alert, Image,
  Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from './ThemeContext';
import StepHeader from '../components/StepHeader';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// WOW ENTRANCE — staggered burst
// ─────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 12;

const useWowEntrance = () => {
  // Ana elementler
  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate  = useRef(new Animated.Value(-15)).current;

  // Partiküller
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      scale:   new Animated.Value(0),
      opacity: new Animated.Value(0),
      x:       new Animated.Value(0),
      y:       new Animated.Value(0),
    }))
  ).current;

  // Form satırları — cascade
  const rows = useRef(
    Array.from({ length: 8 }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(28),
    }))
  ).current;

  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(-24)).current;
  const titleScale      = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    const spring = (anim: Animated.Value, toValue: number) =>
      Animated.spring(anim, { toValue, tension: 65, friction: 8, useNativeDriver: true });

    // 1. Logo burst
    Animated.sequence([
      Animated.parallel([
        spring(logoScale, 1.18),
        Animated.timing(logoOpacity,  { toValue: 1, duration: 320, easing: ease, useNativeDriver: true }),
        Animated.timing(logoRotate,   { toValue: 0, duration: 420, easing: ease, useNativeDriver: true }),
      ]),
      spring(logoScale, 1), // settle

      // 2. Particle burst
      Animated.parallel(
        particles.map((p, i) => {
          const angle  = (i / PARTICLE_COUNT) * Math.PI * 2;
          const dist   = 55 + Math.random() * 35;
          return Animated.parallel([
            Animated.timing(p.opacity, { toValue: 0.9, duration: 120, useNativeDriver: true }),
            Animated.timing(p.scale,   { toValue: 1,   duration: 120, useNativeDriver: true }),
            Animated.timing(p.x, {
              toValue: Math.cos(angle) * dist,
              duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(p.y, {
              toValue: Math.sin(angle) * dist,
              duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
          ]);
        })
      ),

      // Partiküller solar
      Animated.parallel(
        particles.map(p =>
          Animated.timing(p.opacity, { toValue: 0, duration: 280, useNativeDriver: true })
        )
      ),
    ]).start();

    // 3. Başlık aşağıdan yukarı
    Animated.sequence([
      Animated.delay(380),
      Animated.parallel([
        Animated.timing(titleOpacity,    { toValue: 1, duration: 480, easing: ease, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 480, easing: ease, useNativeDriver: true }),
        spring(titleScale, 1),
      ]),
    ]).start();

    // 4. Form satırları cascade
    rows.forEach((row, i) => {
      Animated.sequence([
        Animated.delay(520 + i * 80),
        Animated.parallel([
          Animated.timing(row.opacity,    { toValue: 1, duration: 380, easing: ease, useNativeDriver: true }),
          Animated.timing(row.translateY, { toValue: 0, duration: 380, easing: ease, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  return { logoScale, logoOpacity, logoRotate, particles, rows, titleOpacity, titleTranslateY, titleScale };
};

// ─────────────────────────────────────────────────────────────
// LOGO — animasyonlu SVG
// ─────────────────────────────────────────────────────────────
const RegisterLogo = ({ color, size = 80 }: { color: string; size?: number }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  const cx = size / 2; const cy = size / 2;
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="lg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={cx - 2} fill="url(#lg)" />
        <Circle cx={cx} cy={cy} r={cx - 4} stroke={color} strokeWidth={1.5} strokeOpacity={0.4} fill="none" strokeDasharray="4,3" />
        <Circle cx={cx} cy={cy} r={cx - 14} stroke={color} strokeWidth={1.2} strokeOpacity={0.6} fill="none" />
        {/* Kullanıcı ikonu */}
        <Circle cx={cx} cy={cy - 8} r={10} fill={color} fillOpacity={0.85} />
        <Path
          d={`M${cx - 18},${cy + 22} Q${cx - 18},${cy + 8} ${cx},${cy + 8} Q${cx + 18},${cy + 8} ${cx + 18},${cy + 22}`}
          fill={color} fillOpacity={0.85}
        />
        {/* Spark */}
        <Circle cx={cx + 22} cy={cy - 18} r={4} fill={color} fillOpacity={0.9} />
        <Circle cx={cx - 24} cy={cy - 14} r={3} fill={color} fillOpacity={0.6} />
        <Circle cx={cx + 18} cy={cy + 20} r={2.5} fill={color} fillOpacity={0.5} />
      </Svg>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────
// ŞİFRE GÜÇ ANALİZİ
// ─────────────────────────────────────────────────────────────
function analyzePassword(pw: string) {
  const checks = [
    { label: 'En az 8 karakter',        passed: pw.length >= 8 },
    { label: 'Büyük harf (A-Z)',         passed: /[A-Z]/.test(pw) },
    { label: 'Küçük harf (a-z)',         passed: /[a-z]/.test(pw) },
    { label: 'Rakam (0-9)',              passed: /[0-9]/.test(pw) },
    { label: 'Özel karakter (!@#$...)',  passed: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = pw ? checks.filter(c => c.passed).length : 0;
  const levels = [
    { label: '',          color: 'transparent' },
    { label: 'Çok Zayıf', color: '#ef4444' },
    { label: 'Zayıf',     color: '#f97316' },
    { label: 'Orta',      color: '#eab308' },
    { label: 'İyi',       color: '#22c55e' },
    { label: '💪 Güçlü', color: '#16a34a' },
  ];
  return { score, checks, ...levels[score] };
}

// ─────────────────────────────────────────────────────────────
// ŞİFRE GÜÇ METRESİ
// ─────────────────────────────────────────────────────────────
const PasswordStrengthMeter = ({ password, T }: { password: string; T: any }) => {
  const result = analyzePassword(password);
  const segAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const checkAnims = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    result.checks.forEach((c, i) => {
      Animated.timing(segAnims[i], {
        toValue: c.passed ? 1 : 0,
        duration: 300,
        delay: i * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.spring(checkAnims[i], {
        toValue: c.passed ? 1 : 0.6,
        tension: 70, friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [password]);

  if (!password) return null;

  return (
    <View style={{ marginTop: 10, marginBottom: 2 }}>
      {/* 5 segment bar */}
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 7 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Animated.View key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            backgroundColor: segAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [T.border, result.color],
            }),
          }} />
        ))}
      </View>

      {/* Label */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: T.muted, fontWeight: '500' }}>Şifre Gücü</Text>
        {result.label ? (
          <Text style={{ fontSize: 12, fontWeight: '800', color: result.color }}>{result.label}</Text>
        ) : null}
      </View>

      {/* Checklist */}
      <View style={{
        backgroundColor: T.surface, borderRadius: 14,
        borderWidth: 1, borderColor: T.border, padding: 14, gap: 9,
      }}>
        {result.checks.map((c, i) => (
          <Animated.View key={i} style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            transform: [{ scale: checkAnims[i] }],
          }}>
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: c.passed ? result.color + '22' : T.border + '55',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1,
              borderColor: c.passed ? result.color + '60' : 'transparent',
            }}>
              <Text style={{ fontSize: 11, color: c.passed ? result.color : T.muted, fontWeight: '800' }}>
                {c.passed ? '✓' : '·'}
              </Text>
            </View>
            <Text style={{
              fontSize: 12.5,
              color: c.passed ? T.text : T.muted,
              fontWeight: c.passed ? '700' : '400',
            }}>
              {c.label}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// FOCUS INPUT
// ─────────────────────────────────────────────────────────────
function Input({ label, placeholder, value, onChange, onSubmit, inputRef,
  keyboardType = 'default', isPassword = false, T, extraContent }: any) {
  const [show, setShow] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;
  const onF = () => Animated.timing(focus, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onB = () => Animated.timing(focus, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, marginBottom: 7, fontWeight: '700', color: T.text, letterSpacing: 0.1 }}>
        {label}
      </Text>
      <Animated.View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: T.card,
        borderWidth: 1.5,
        borderColor: focus.interpolate({ inputRange: [0, 1], outputRange: [T.border, T.primary] }),
        borderRadius: 14, paddingHorizontal: 16,
      }}>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor={T.muted}
          value={value}
          keyboardType={keyboardType}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          secureTextEntry={isPassword && !show}
          returnKeyType="next"
          onFocus={onF} onBlur={onB}
          style={{ flex: 1, height: 52, fontSize: 16, color: T.text }}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={{ padding: 10 }}>
            <Text style={{ fontSize: 17 }}>{show ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      {extraContent}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// AVATAR — pulse ring
// ─────────────────────────────────────────────────────────────
const AvatarPicker = ({ uri, onPress, T }: { uri: string; onPress: () => void; T: any }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const ringOp = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (uri) return;
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulse,  { toValue: 1.1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOp, { toValue: 1,   duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(pulse,  { toValue: 1,   duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOp, { toValue: 0.4, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ])).start();
  }, [uri]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ alignItems: 'center', marginBottom: 20 }}>
      <View style={{ width: 116, height: 116, alignItems: 'center', justifyContent: 'center' }}>
        {!uri && (
          <Animated.View style={{
            position: 'absolute', width: 116, height: 116, borderRadius: 58,
            borderWidth: 2.5, borderColor: T.primary,
            opacity: ringOp, transform: [{ scale: pulse }],
          }} />
        )}
        <Animated.View style={{
          width: 96, height: 96, borderRadius: 48,
          overflow: 'hidden', borderWidth: 3,
          borderColor: uri ? T.primary : T.border,
          transform: [{ scale: uri ? 1 : pulse }],
        }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: 96, height: 96 }} />
          ) : (
            <View style={{ flex: 1, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 34 }}>📷</Text>
            </View>
          )}
        </Animated.View>
        <View style={{
          position: 'absolute', bottom: 2, right: 8,
          backgroundColor: T.primary, width: 28, height: 28, borderRadius: 14,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2.5, borderColor: T.bg,
        }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, lineHeight: 18 }}>+</Text>
        </View>
      </View>
      <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13, marginTop: 4 }}>
        {uri ? 'Fotoğrafı Değiştir' : 'Profil Fotoğrafı Ekle'}
      </Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────
// ANA EKRAN
// ─────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const navigation      = useNavigation<any>();
  const { T, darkMode } = useTheme();
  const scrollRef       = useRef<ScrollView>(null);
  const anim            = useWowEntrance();

  const emailRef           = useRef<TextInput>(null);
  const passwordRef        = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const fullNameRef        = useRef<TextInput>(null);
  const prefNameRef        = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', prefName: '',
    dob: new Date(), gender: 'Kadın',
    avatarUri: '', avatarBase64: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const strength = analyzePassword(formData.password);

  // 18 yaş max tarihi
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5, selectionLimit: 1, includeBase64: true });
      if (result.didCancel) return;
      if (result.errorCode) { Alert.alert('Hata', 'Resim seçilemedi'); return; }
      if (result.assets?.[0]) {
        const a = result.assets[0];
        setFormData(f => ({ ...f, avatarUri: a.uri || '', avatarBase64: a.base64 || '' }));
      }
    } catch (e) { console.log(e); }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    setFormData(f => ({ ...f, dob: selectedDate || f.dob }));
  };

  const handleNext = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Eksik Bilgi', 'Lütfen gerekli alanları doldurun.'); return;
    }
    if (formData.dob > maxDate) {
      Alert.alert('18 Yaş Sınırı', 'Bu uygulamayı kullanmak için 18 yaşında veya daha büyük olmalısın.'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler uyuşmuyor.'); return;
    }
    if (formData.password.length < 8) {
      Alert.alert('Güvenlik', 'Şifreniz en az 8 karakter olmalıdır.'); return;
    }
    if (strength.score < 3) {
      Alert.alert(
        '⚠️ Zayıf Şifre',
        'Hesabını korumak için daha güçlü bir şifre belirle.\nBüyük/küçük harf, rakam ve özel karakter ekle.',
        [
          { text: 'Değiştir', style: 'cancel' },
          { text: 'Devam Et', onPress: doNavigate },
        ]
      );
      return;
    }
    doNavigate();
  };

  const doNavigate = () =>
    navigation.navigate('RegisterStep2', {
      prevData: { ...formData, dob: formData.dob.toISOString().split('T')[0] },
    });

  const S = useMemo(() => makeStyles(T), [T]);

  const rotateDeg = anim.logoRotate.interpolate({
    inputRange: [-15, 0], outputRange: ['-15deg', '0deg'],
  });

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />
      <StepHeader currentStep={1} totalSteps={4} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={S.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── WOW HERO ── */}
        <View style={S.heroArea}>
          {/* Partiküller */}
          {anim.particles.map((p, i) => {
            const size = 6 + (i % 4) * 3;
            return (
              <Animated.View key={i} style={{
                position: 'absolute',
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: T.primary,
                opacity: p.opacity,
                transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
              }} />
            );
          })}

          {/* Logo */}
          <Animated.View style={{
            opacity: anim.logoOpacity,
            transform: [
              { scale: anim.logoScale },
              { rotate: rotateDeg },
            ],
          }}>
            <View style={[S.logoRing, { borderColor: T.primary + '35' }]}>
              <View style={[S.logoInner, { backgroundColor: T.primary + '18', borderColor: T.primary + '55' }]}>
                <RegisterLogo color={T.primary} size={72} />
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Başlık ── */}
        <Animated.View style={[S.titleBlock, {
          opacity: anim.titleOpacity,
          transform: [
            { translateY: anim.titleTranslateY },
            { scale: anim.titleScale },
          ],
        }]}>
          <Text style={S.title}>Hesabını Oluştur</Text>
          <Text style={S.subtitle}>Sağlıklı yolculuğuna şimdi başla 🚀</Text>
        </Animated.View>

        {/* ── AVATAR ── */}
        <Animated.View style={{
          opacity: anim.rows[0].opacity,
          transform: [{ translateY: anim.rows[0].translateY }],
        }}>
          <AvatarPicker uri={formData.avatarUri} onPress={pickImage} T={T} />
        </Animated.View>

        {/* ── Giriş Bilgileri ── */}
        <Animated.View style={[S.card, {
          opacity: anim.rows[1].opacity,
          transform: [{ translateY: anim.rows[1].translateY }],
        }]}>
          <Text style={[S.cardTitle, { color: T.primary }]}>🔐 Giriş Bilgileri</Text>

          <Input label="E-posta Adresi" placeholder="ornek@email.com"
            value={formData.email} inputRef={emailRef} keyboardType="email-address"
            onChange={(v: string) => setFormData(f => ({ ...f, email: v }))}
            onSubmit={() => passwordRef.current?.focus()} T={T} />

          <Input label="Şifre" placeholder="En az 8 karakter"
            value={formData.password} inputRef={passwordRef} isPassword
            onChange={(v: string) => setFormData(f => ({ ...f, password: v }))}
            onSubmit={() => confirmPasswordRef.current?.focus()} T={T}
            extraContent={<PasswordStrengthMeter password={formData.password} T={T} />}
          />

          <Input label="Şifre Tekrar" placeholder="Şifreni tekrar gir"
            value={formData.confirmPassword} inputRef={confirmPasswordRef} isPassword
            onChange={(v: string) => setFormData(f => ({ ...f, confirmPassword: v }))}
            onSubmit={() => fullNameRef.current?.focus()} T={T}
            extraContent={
              formData.confirmPassword.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7, marginLeft: 2 }}>
                  <Text style={{ fontSize: 13 }}>
                    {formData.password === formData.confirmPassword ? '✅' : '❌'}
                  </Text>
                  <Text style={{
                    fontSize: 12.5, fontWeight: '700',
                    color: formData.password === formData.confirmPassword ? '#22c55e' : '#ef4444',
                  }}>
                    {formData.password === formData.confirmPassword ? 'Şifreler eşleşiyor' : 'Şifreler eşleşmiyor'}
                  </Text>
                </View>
              ) : null
            }
          />

          <TouchableOpacity style={{ alignItems: 'flex-end', marginTop: -4, marginBottom: 2 }}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={{ color: T.primary, fontSize: 13, fontWeight: '600' }}>Şifreni mi unuttun?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Kişisel Bilgiler ── */}
        <Animated.View style={[S.card, {
          opacity: anim.rows[2].opacity,
          transform: [{ translateY: anim.rows[2].translateY }],
        }]}>
          <Text style={[S.cardTitle, { color: T.primary }]}>👤 Kişisel Bilgiler</Text>

          <Input label="Tam Ad" placeholder="Ad Soyad"
            value={formData.fullName} inputRef={fullNameRef}
            onChange={(v: string) => setFormData(f => ({ ...f, fullName: v }))}
            onSubmit={() => prefNameRef.current?.focus()} T={T} />

          <Input label="Sana nasıl hitap edelim?" placeholder="Takma isim"
            value={formData.prefName} inputRef={prefNameRef}
            onChange={(v: string) => setFormData(f => ({ ...f, prefName: v }))}
            onSubmit={() => Keyboard.dismiss()} T={T} />

          {/* Doğum Tarihi */}
          <Animated.View style={{
            opacity: anim.rows[3].opacity,
            transform: [{ translateY: anim.rows[3].translateY }],
            marginBottom: 14,
          }}>
            <Text style={S.inputLabel}>Doğum Tarihi</Text>
            <TouchableOpacity style={S.dateBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={{ fontSize: 16, color: T.text }}>
                {formData.dob.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={{ fontSize: 18 }}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={maxDate}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ alignItems: 'flex-end', marginTop: 8 }}>
                <Text style={{ color: T.primary, fontWeight: 'bold' }}>Tamam</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Cinsiyet */}
          <Animated.View style={{
            opacity: anim.rows[4].opacity,
            transform: [{ translateY: anim.rows[4].translateY }],
          }}>
            <Text style={S.inputLabel}>Cinsiyet</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[{ key: 'Erkek', emoji: '👨' }, { key: 'Kadın', emoji: '👩' }].map(g => (
                <TouchableOpacity key={g.key} activeOpacity={0.8}
                  style={[S.genderBtn, formData.gender === g.key && { backgroundColor: T.primary, borderColor: T.primary }]}
                  onPress={() => setFormData(f => ({ ...f, gender: g.key }))}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{g.emoji}</Text>
                  <Text style={[S.genderTxt, formData.gender === g.key && { color: '#fff' }]}>{g.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <Animated.View style={[S.footer, {
        opacity: anim.rows[7].opacity,
        transform: [{ translateY: anim.rows[7].translateY }],
      }]}>
        {formData.password.length > 0 && strength.score < 3 && (
          <View style={S.warnBanner}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={S.warnText}>Güçlü şifre hesabını korur. Devam edebilirsin ama önerilmez.</Text>
          </View>
        )}
        <TouchableOpacity style={[S.btn, { backgroundColor: T.primary }]} onPress={handleNext} activeOpacity={0.87}>
          <Text style={S.btnTxt}>İleri →</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STİLLER
// ─────────────────────────────────────────────────────────────
const makeStyles = (T: any) => StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  content: { padding: 20 },

  heroArea: {
    alignItems: 'center', justifyContent: 'center',
    height: 160, marginBottom: 4,
  },
  logoRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },

  titleBlock: { alignItems: 'center', marginBottom: 20 },
  title:      { fontSize: 26, fontWeight: '900', color: T.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle:   { fontSize: 15, color: T.muted, fontWeight: '500' },

  card:      {
    backgroundColor: T.card, borderRadius: 20,
    borderWidth: 1, borderColor: T.border,
    padding: 18, marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 16, letterSpacing: 0.1 },

  inputLabel: { fontSize: 13, marginBottom: 7, fontWeight: '700', color: T.text },
  dateBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.border,
    borderRadius: 14, padding: 15,
  },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: T.border,
    alignItems: 'center', backgroundColor: T.surface,
  },
  genderTxt: { fontWeight: '700', color: T.muted, fontSize: 14 },

  footer: {
    position: 'absolute', bottom: 0, width: '100%',
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: T.bg,
    borderTopWidth: 0.5, borderTopColor: T.border,
  },
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef444412', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  warnText: { fontSize: 12, color: '#ef4444', flex: 1, fontWeight: '600' },
  btn:      { padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
  btnTxt:   { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});