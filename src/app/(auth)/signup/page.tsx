// src/app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-subtitle">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </p>
          <p className="mt-4">
            <a href="/login" className="form-link">
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start tracking your finances</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="mt-4">
            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Create account
            </Button>
          </div>
        </form>

        <p className="text-muted mt-4" style={{ fontSize: '0.85rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <a href="/login" className="form-link">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
