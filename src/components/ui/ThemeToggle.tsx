// src/components/ui/ThemeToggle.tsx
'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // On mount: read from localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const resolved = stored ?? system;
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return { theme, toggleTheme };
}

interface ThemeToggleProps {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? '0' : '10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '9px 12px',
        width: '100%',
        borderRadius: '8px',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        fontFamily: 'inherit',
        transition: 'color 0.15s, background 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(128,128,128,0.08)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
      }}
    >
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
        {isDark ? '☀' : '☽'}
      </span>
      {!collapsed && (
        <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      )}
    </button>
  );
}
