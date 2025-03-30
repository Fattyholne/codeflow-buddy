
import React, { createContext, useContext, useEffect } from "react";
import { useTheme as useThemeHook } from "@/hooks/use-theme";

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeHook();

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'soft-light', 'neon-theme', 'neon-neon-blue', 'neon-neon-purple', 'high-focus');
    
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
