/**
 * ChangePasswordModal — tam TextInput destekli şifre değiştirme modalı.
 * SettingsScreen içine import edin ya da ayrı dosya olarak bırakın.
 *
 * Kullanım:
 *   import ChangePasswordModal from './ChangePasswordModal';
 *   <ChangePasswordModal visible={showPwModal} onClose={() => setShowPwModal(false)} T={T} />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';
interface Props {
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<Props> = ({ visible, onClose }) => {
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const { T,darkMode } = useTheme(); 
  const reset = () => {
    setNewPw('');
    setConfirmPw('');
    setShowNew(false);
    setShowCon(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleUpdate = async () => {
    if (newPw.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      Alert.alert('Başarılı ✓', 'Şifreniz başarıyla güncellendi.');
      reset();
      onClose();
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Şifre güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    s.input,
    {
      backgroundColor: T.surface,
      borderColor: T.border,
      color: T.text,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={handleClose}>
          {/* İçerik tıklamalarını kesmek için */}
          <TouchableOpacity
            activeOpacity={1}
            style={[s.sheet, { backgroundColor: T.card }]}
            onPress={() => {}} // propagation engelle
          >
            {/* Handle */}
            <View style={[s.handle, { backgroundColor: T.border }]} />

            {/* Başlık */}
            <View style={s.iconWrap}>
              <Text style={{ fontSize: 26 }}>🔒</Text>
            </View>
            <Text style={[s.title, { color: T.text }]}>Şifre Değiştir</Text>
            <Text style={[s.subtitle, { color: T.muted }]}>
              Yeni şifrenizi belirleyin.{'\n'}En az 6 karakter olmalıdır.
            </Text>

            {/* Yeni Şifre */}
            <Text style={[s.label, { color: T.muted }]}>Yeni Şifre</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[...inputStyle, { flex: 1, marginBottom: 0 }]}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="Yeni şifre"
                placeholderTextColor={T.muted}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowNew(v => !v)}>
                <Text style={{ fontSize: 18, color: T.muted }}>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Şifre Tekrar */}
            <Text style={[s.label, { color: T.muted, marginTop: 12 }]}>Yeni Şifre (Tekrar)</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[...inputStyle, { flex: 1, marginBottom: 0 }]}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Şifreyi tekrar girin"
                placeholderTextColor={T.muted}
                secureTextEntry={!showCon}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowCon(v => !v)}>
                <Text style={{ fontSize: 18, color: T.muted }}>{showCon ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Güncelle butonu */}
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: T.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleUpdate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Güncelle</Text>
              }
            </TouchableOpacity>

            {/* Vazgeç */}
            <TouchableOpacity
              style={[s.cancelBtn, { backgroundColor: T.surface, borderColor: T.border }]}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: T.text }}>Vazgeç</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, marginBottom: 20,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(75,124,90,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17, fontWeight: '700', marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 22,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 12, fontWeight: '600', marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 0.5,
    marginBottom: 12,
    width: '100%',
  },
  eyeBtn: {
    padding: 8,
  },
  confirmBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    alignItems: 'center',
  },
});

export default ChangePasswordModal;