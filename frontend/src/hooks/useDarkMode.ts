import { useEffect, useState } from 'react';

const STORAGE_KEY = 'spendlog-theme';

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);
    window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return {
    isDark,
    toggleTheme: () => setIsDark((current) => !current)
  };
}
