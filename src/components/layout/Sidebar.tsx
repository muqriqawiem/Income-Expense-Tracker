// src/components/layout/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

  // Desktop: collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Mobile: drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync collapsed pref to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
    // Update CSS variable so main content shifts correctly
    document.documentElement.style.setProperty(
      '--sidebar-w',
      `${collapsed ? COLLAPSED_W : EXPANDED_W}px`
    );
  }, [collapsed]);

  // Close drawer on route change
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
          background: 'rgba(15, 23, 42, 0.75)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,0,0,0.25)',
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
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#67E8F9', whiteSpace: 'nowrap', overflow: 'hidden' }}>
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
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: '1rem',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
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
                  background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(56,189,248,0.20)' : '1px solid transparent',
                  boxShadow: active ? '0 0 16px rgba(56,189,248,0.08)' : 'none',
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

        {/* Sign out */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
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
          background: 'rgba(15, 23, 42, 0.75)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
        }}
      >
        <span style={{ fontWeight: 700, color: '#67E8F9', fontSize: '0.95rem' }}>FinanceTracker</span>
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
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            borderRadius: '6px',
          }}
          aria-label="Open menu"
        >
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text-muted)', borderRadius: '2px' }} />
        </button>
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
            background: 'rgba(2,6,23,0.65)',
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
          background: 'rgba(15, 23, 42, 0.85)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
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
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, color: '#67E8F9', fontSize: '0.95rem' }}>FinanceTracker</span>
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
                  background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(56,189,248,0.20)' : '1px solid transparent',
                  boxShadow: active ? '0 0 16px rgba(56,189,248,0.08)' : 'none',
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

        {/* Drawer sign out */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
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
