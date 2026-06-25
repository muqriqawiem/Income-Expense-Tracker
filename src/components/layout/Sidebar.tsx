// src/components/layout/Sidebar.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',     icon: '◈' },
  { href: '/transactions', label: 'Transactions',  icon: '⇄' },
  { href: '/categories',   label: 'Categories',    icon: '◉' },
  { href: '/budgets',      label: 'Budgets',       icon: '◎' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'var(--sidebar-w)',
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        zIndex: 50,
      }}
      className="desktop-sidebar"
      >
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)' }}>
            FinanceTracker
          </span>
        </div>

        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  background: active ? 'var(--bg-raised)' : 'transparent',
                  transition: 'background 0.15s, color 0.15s',
                  fontSize: '0.875rem',
                }}
              >
                <span style={{ fontSize: '1rem', opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: '16px 10px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              width: '100%',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
          >
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
      }}
      className="mobile-topbar"
      >
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>FinanceTracker</span>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                color: pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '1.1rem',
              }}
            >
              {item.icon}
            </a>
          ))}
        </nav>
      </header>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
