
import { useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';

type ThemeType = 'light' | 'soft-light' | 'dark' | 'midnight' | 'neon-blue' | 'neon-purple' | 'high-contrast';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeType>('selected_theme', 'light');

  // Apply the theme whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'neon-theme', 'neon-neon-blue', 'neon-neon-purple');
    
    // Set the theme
    root.setAttribute('data-theme', theme);
    
    // Apply dark class if needed
    if (theme === 'dark' || theme === 'midnight') {
      root.classList.add('dark');
    }
    
    // Apply neon classes if needed
    if (theme === 'neon-blue' || theme === 'neon-purple') {
      root.classList.add('neon-theme');
      root.classList.add(`neon-${theme}`);
      root.classList.add('dark'); // Neon themes use dark as a base
    }
    
    // Apply high contrast specific settings
    if (theme === 'high-contrast') {
      root.classList.add('high-focus');
      root.classList.add('neon-theme');
      root.classList.add('dark');
    }
  }, [theme]);

  return { theme, setTheme };
}
