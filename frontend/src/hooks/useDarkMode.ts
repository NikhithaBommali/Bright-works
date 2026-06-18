import { useEffect, useState } from 'react';

const STORAGE_KEY = 'brightcone-theme';

export function useDarkMode(defaultValue = true) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    return defaultValue;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, setIsDark, toggleTheme: () => setIsDark((value) => !value) };
}
