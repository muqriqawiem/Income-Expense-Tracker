// src/components/layout/Sidebar.tsx
'use client';

import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Wallet,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/budgets', label: 'Budgets', icon: Wallet },
];

const COLLAPSED_W = 60;
const EXPANDED_W = 220;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop: collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Sync collapsed pref to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
    // Update CSS variable so main content shifts correctly
    document.documentElement.style.setProperty(
      '--sidebar-w',
      `${collapsed ? COLLAPSED_W : EXPANDED_W}px`
    );
  }, [collapsed]);

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
                <item.icon size={19} strokeWidth={2} style={{ opacity: 0.9, flexShrink: 0 }} />
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
            <LogOut size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!collapsed && ' Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar (Instagram-style, icons only) ── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(58px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(15, 23, 42, 0.85)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
          zIndex: 50,
          alignItems: 'stretch',
          justifyContent: 'space-around',
        }}
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              aria-label={item.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                position: 'relative',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  width: '28px',
                  height: '2.5px',
                  borderRadius: '0 0 4px 4px',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px rgba(56,189,248,0.7)',
                }} />
              )}
              <item.icon
                size={23}
                strokeWidth={active ? 2.4 : 2}
                style={{
                  filter: active ? 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' : 'none',
                  transition: 'transform 0.15s ease, stroke-width 0.15s ease',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                }}
              />
            </a>
          );
        })}

        {/* Sign out as the last icon, matching the same tap target size */}
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={22} strokeWidth={2} />
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar     { display: none !important; }
          .mobile-bottom-nav   { display: flex !important; }
        }
      `}</style>
    </>
  );
}