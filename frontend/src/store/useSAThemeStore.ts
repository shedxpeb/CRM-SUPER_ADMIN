import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SATheme = 'dark' | 'light' | 'sky';

interface ThemeState {
  theme: SATheme;
  setTheme: (theme: SATheme) => void;
}

export const useSAThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sa-theme',
    }
  )
);
