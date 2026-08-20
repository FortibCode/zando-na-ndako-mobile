import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme, type ThemeColors, type Theme } from '@/design/theme';
import { Spacing, Radii, Shadows, TextSizes, FontWeights } from '@/design/tokens';

const THEME_KEY = '@zando_theme';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  colors: ThemeColors;
  theme: Theme;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // Mode par défaut : 'system' pour un Dark Mode immersif automatique
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Charger la préférence au montage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode);
    } catch { /* ignore */ }
  };

  const effectiveDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

const colors = effectiveDark ? DarkTheme : LightTheme;
  const theme = useMemo(
    () => ({
      colors,
      spacing: Spacing,
      radii: Radii,
      shadows: Shadows,
      textSizes: TextSizes,
      fontWeights: FontWeights,
    }),
    [colors]
  );

  const value = useMemo(
    () => ({ mode, setMode, colors, theme, isDark: effectiveDark }),
    [mode, setMode, colors, theme, effectiveDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}

