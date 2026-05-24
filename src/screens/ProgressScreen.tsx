import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Platform, Image as RNImage, StatusBar,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';

import DayItem from '../components/DayItem';
import DailySummaryCard from '../components/DailySummaryCard';
import RecentActivityItem from '../components/RecentActivityItem';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation }: any) => {
  const { T, darkMode } = useTheme();

  const [loading, setLoading]   = useState(true);
  const [foods, setFoods]       = useState<any[]>([]);
  const [stats, setStats]       = useState({ cal: 0, c: 0, p: 0, f: 0 });
  const [weekOffset, setWeekOffset] = useState(0);

  const getLocalDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
  };

  const [selectedFullDate, setSelectedFullDate] = useState(getLocalDate(new Date()));

  const { weekDays, currentMonthYear } = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = getLocalDate(d);
      days.push({
        label: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        day: d.getDate(),
        fullDate: iso,
      });
    }

    const monthYear = monday.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return { weekDays: days, currentMonthYear: monthYear };
  }, [weekOffset]);

  useEffect(() => {
    if (weekOffset === 0) setSelectedFullDate(getLocalDate(new Date()));
    else setSelectedFullDate(weekDays[0].fullDate);
  }, [weekOffset]);

  useEffect(() => { loadData(); }, [selectedFullDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${selectedFullDate}T00:00:00.000Z`)
        .lte('created_at', `${selectedFullDate}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setFoods(data);
        setStats(data.reduce((acc, curr) => ({
          cal: acc.cal + (curr.calories || 0),
          c:   acc.c   + (curr.carbs    || 0),
          p:   acc.p   + (curr.protein  || 0),
          f:   acc.f   + (curr.fat      || 0),
        }), { cal: 0, c: 0, p: 0, f: 0 }));
      }
    } catch (e) {
      console.error('Veri yükleme hatası:', e);
    } finally {
      setLoading(false);
    }
  };

  const S = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 15,
      backgroundColor: T.card,
      borderBottomWidth: 0.5, borderBottomColor: T.border,
    },
    headerTitleContainer: { alignItems: 'center', flex: 1 },
    headerMonth:    { fontSize: 18, fontWeight: 'bold', color: T.text, textTransform: 'capitalize' },
    headerSubtitle: { fontSize: 13, color: T.muted, marginTop: 2 },
    navBtn: {
      width: 44, height: 44, backgroundColor: T.surface,
      borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    },
    navText: { fontSize: 20, fontWeight: 'bold', color: T.primary },

    calendarContainer: {
      backgroundColor: T.card,
      borderBottomWidth: 0.5, borderBottomColor: T.border,
      paddingVertical: 5,
    },
    calendarScroll: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },

    cardWrapper:   { paddingVertical: 15 },
    buttonPadding: { paddingHorizontal: 16, marginBottom: 15 },

    listSection: { paddingHorizontal: 16, paddingBottom: 50 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: T.text, marginBottom: 15 },

    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText:      { color: T.muted, fontSize: 15, fontWeight: '500' },

    itemImage: { width: 40, height: 40, borderRadius: 8, resizeMode: 'cover' },

    bottomButtons: {
      flexDirection: 'row', gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: T.card,
      borderTopWidth: 0.5, borderTopColor: T.border,
    },
    homeBtn: {
      flex: 1, height: 50, borderRadius: 14,
      borderWidth: 1.5, borderColor: T.border,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: T.card,
    },
    homeBtnText: { fontSize: 14, fontWeight: '700', color: T.primary },
    cameraBtn: {
      flex: 2, height: 50, borderRadius: 14,
      backgroundColor: T.primary,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: T.primary, shadowOpacity: 0.3,
      shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    },
    cameraBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
  }), [T]);

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={T.card} />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.navBtn} onPress={() => setWeekOffset(prev => prev - 1)}>
          <Text style={S.navText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={S.headerTitleContainer}>
          <Text style={S.headerMonth}>{currentMonthYear}</Text>
          <Text style={S.headerSubtitle}>{weekOffset === 0 ? 'Bu Hafta' : 'Geçmiş Kayıtlar'}</Text>
        </View>

        <TouchableOpacity
          style={[S.navBtn, weekOffset === 0 && { opacity: 0.2 }]}
          onPress={() => setWeekOffset(prev => prev + 1)}
          disabled={weekOffset === 0}
        >
          <Text style={S.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Takvim */}
        <View style={S.calendarContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.calendarScroll}>
            {weekDays.map(item => (
              <DayItem
                key={item.fullDate}
                label={item.label}
                day={item.day}
                isActive={item.fullDate === selectedFullDate}
                onPress={() => setSelectedFullDate(item.fullDate)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Özet Kartı */}
        <View style={S.cardWrapper}>
          <DailySummaryCard calories={stats.cal} carbs={stats.c} protein={stats.p} fat={stats.f} />
        </View>

        <View style={S.buttonPadding}>
          <PrimaryButton text="Detaylı Raporları Gör" onPress={() => navigation.navigate('Reports')} />
        </View>

        {/* Yemek Listesi */}
        <View style={S.listSection}>
          <Text style={S.sectionTitle}>Günün Yemekleri</Text>
          {loading ? (
            <ActivityIndicator color={T.primary} size="large" style={{ marginTop: 20 }} />
          ) : foods.length > 0 ? (
            foods.map(item => (
              <RecentActivityItem
                key={item.id}
                title={item.name}
                subtitle={`${item.calories} kcal • ${new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                icon={item.image_url ? <RNImage source={{ uri: item.image_url }} style={S.itemImage} /> : '🍲'}
                iconBgColor={T.surface}
                iconColor={T.primary}
              />
            ))
          ) : (
            <View style={S.emptyContainer}>
              <Text style={S.emptyText}>Bu gün için kayıt bulunmuyor.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Alt Butonlar */}
      <View style={S.bottomButtons}>
        <TouchableOpacity style={S.homeBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={S.homeBtnText}>🏠 Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.cameraBtn} onPress={() => navigation.navigate('AICamera')}>
          <Text style={S.cameraBtnText}>📷 Analiz Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProgressScreen;