// src/lib/hooks/useIsDark.ts
'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the current theme is dark.
 * Subscribes to data-theme attribute changes on <html> via MutationObserver,
 * so pill colors update instantly when the user toggles the theme.
 * Defaults to true (dark) for SSR.
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.getAttribute('data-theme') !== 'light';
  });

  useEffect(() => {
    // Read initial value after mount (resolves SSR/client mismatch)
    setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
