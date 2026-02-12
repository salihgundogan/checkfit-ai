// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BURAYA KBACKENDDLE ÇALIŞACAK KİŞİNİN  SUPABASE BİLGİLERİNİ GİRECEK
const supabaseUrl = 'https://koxgjuyiuwfovsjljoja.supabase.co';
const supabaseAnonKey = 'sb_publishable_RjafvNLT8Zri-hnl1iCbKg_6pf9-ezj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});