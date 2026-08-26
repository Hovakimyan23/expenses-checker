import { useEffect } from 'react';
import type { ThemeMode } from '@/types';

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('finch.theme') as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function useThemeEffect(mode: ThemeMode): void {
  useEffect(() => {
    applyTheme(mode);
  }, [mode]);
}
