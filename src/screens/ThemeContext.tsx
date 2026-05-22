import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIGHT = {
  bg: '#F9FAF5', card: '#FFFFFF', border: 'rgba(0,0,0,0.08)',
  text: '#0d1b0e', muted: '#6b7280',
  primary: '#4A7C59', surface: '#f3f5f0', accent: '#13ec54', danger: '#ef4444',
};

export const DARK = {
  bg: '#0a0a0a', card: '#1c1c1e', border: 'rgba(255,255,255,0.10)',
  text: '#ffffff', muted: '#aeaeb2',
  primary: '#5fcc7a', surface: '#2c2c2e', accent: '#13ec54', danger: '#ff453a',
};

const ThemeContext = createContext<{
  darkMode: boolean;
  toggleDark: (val: boolean) => void;
  T: typeof LIGHT;
}>({
  darkMode: false,
  toggleDark: (_val: boolean) => {},
  T: LIGHT,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Uygulama açılınca kayıtlı tercihi yükle
  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(val => {
      if (val === 'true') setDarkMode(true);
    });
  }, []);

const toggleDark = (val: boolean) => {
  setDarkMode(val);
  AsyncStorage.setItem('darkMode', val.toString());
};

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark, T: darkMode ? DARK : LIGHT }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);