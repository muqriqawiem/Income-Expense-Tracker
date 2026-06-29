// src/components/layout/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',     icon: '◈' },
  { href: '/transactions', label: 'Transactions',  icon: '⇄' },
  { href: '/categories',   label: 'Categories',    icon: '◉' },
  { href: '/budgets',      label: 'Budgets',       icon: '◎' },
];

const COLLAPSED_W = 60;
const EXPANDED_W  = 220;

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
    document.documentElement.style.setProperty(
      '--sidebar-w',
      `${collapsed ? COLLAPSED_W : EXPANDED_W}px`
    );
  }, [collapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────── */}
      <aside
        className="desktop-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${sidebarW}px`,
          height: '100vh',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'width 0.22s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo + collapse toggle */}
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 14px 0 20px',
          borderBottom: '1px solid var(--sidebar-border)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              FinanceTracker
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              background: 'rgba(128,128,128,0.04)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: '1rem',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(128,128,128,0.1)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? '0' : '10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                  border: active ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                  boxShadow: active ? 'var(--sidebar-active-shadow)' : 'none',
                  transition: 'all 0.18s ease',
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem', opacity: 0.85, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </a>
            );
          })}
        </nav>

        {/* Bottom actions: theme toggle + sign out */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <ThemeToggle collapsed={collapsed} />

          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign out' : undefined}
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
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <span style={{ flexShrink: 0 }}>↪</span>
            {!collapsed && ' Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <header
        className="mobile-topbar"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--sidebar-border)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>FinanceTracker</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Inline theme toggle for mobile top bar */}
          <ThemeToggleMini />
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              border: '1px solid var(--border)',
              background: 'rgba(128,128,128,0.04)',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            aria-label="Open menu"
          >
            <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
            <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer overlay ────────────────────────────── */}
      {drawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(2,6,23,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
        />
      )}

      <aside
        className="mobile-drawer"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '260px',
          height: '100vh',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          flexDirection: 'column',
          zIndex: 100,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Drawer header */}
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>FinanceTracker</span>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              borderRadius: '6px',
            }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                  border: active ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                  transition: 'all 0.18s ease',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem', opacity: 0.85 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Drawer bottom */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <ThemeToggle collapsed={false} />
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 14px',
              width: '100%',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
            }}
          >
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar               { display: none !important; }
          .mobile-topbar                 { display: flex !important; }
          .mobile-drawer                 { display: flex !important; }
          .mobile-drawer-backdrop        { display: block !important; }
        }
      `}</style>
    </>
  );
}

// Small icon-only toggle for mobile top bar
function ThemeToggleMini() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setIsDark((stored ?? system) === 'dark');
  }, []);

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border)',
        background: 'rgba(128,128,128,0.04)',
        cursor: 'pointer',
        borderRadius: '6px',
        fontSize: '1rem',
        color: 'var(--text-muted)',
      }}
    >
      {isDark ? '☀' : '☽'}
    </button>
  );
}
