// src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Supabase client automatically parses the hash fragment
    // and fires onAuthStateChange with SIGNED_IN + type=recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Token is valid — send them to set a new password
          router.replace('/reset-password');
        } else if (event === 'SIGNED_IN' && session) {
          // Already had a session, not a recovery flow
          router.replace('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verifying your link…
        </p>
      </div>
    </div>
  );
}
