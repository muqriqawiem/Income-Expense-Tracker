// src/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-subtitle">
            We sent a password reset link to <strong>{email}</strong>.
            Click the link to set a new password.
          </p>
          <p className="mt-4">
            <a href="/login" className="form-link">Back to sign in</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="mt-4">
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Send reset link
            </Button>
          </div>
        </form>

        <p className="text-muted mt-4" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
          <a href="/login" className="form-link">Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
