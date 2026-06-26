// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',

    borderRadius: '12px',

    fontWeight: 600,
    fontFamily: 'inherit',

    cursor: 'pointer',

    whiteSpace: 'nowrap',

    transition:
      'all 0.18s ease',

    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },

  primary: {
    background: 'var(--accent)',
    color: '#ffffff',

    border: '1px solid rgba(255,255,255,0.08)',

    boxShadow:
      '0 4px 20px rgba(56,189,248,0.25)',
  },

  secondary: {
    background: 'rgba(255,255,255,0.05)',

    color: 'var(--text)',

    border: '1px solid var(--border)',

    boxShadow:
      '0 4px 20px rgba(0,0,0,0.12)',
  },

  danger: {
    background: 'rgba(244,63,94,0.15)',

    color: 'var(--expense)',

    border: '1px solid rgba(244,63,94,0.25)',

    boxShadow:
      '0 4px 20px rgba(244,63,94,0.15)',
  },

  ghost: {
    background: 'transparent',

    color: 'var(--text-muted)',

    border: '1px solid transparent',
  },

  sm: {
    padding: '6px 12px',
    fontSize: '0.8rem',
  },

  md: {
    padding: '9px 16px',
    fontSize: '0.875rem',
  },
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles[size],

        width: fullWidth ? '100%' : undefined,

        opacity: disabled || loading ? 0.6 : 1,

        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;

        const target = e.currentTarget;

        target.style.transform = 'translateY(-1px)';

        if (variant === 'primary') {
          target.style.boxShadow =
            '0 8px 24px rgba(56,189,248,0.35)';
        }

        if (variant === 'secondary') {
          target.style.background =
            'rgba(255,255,255,0.08)';
        }

        if (variant === 'danger') {
          target.style.background =
            'rgba(244,63,94,0.22)';
        }
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget;

        target.style.transform = 'translateY(0)';

        if (variant === 'primary') {
          target.style.boxShadow =
            '0 4px 20px rgba(56,189,248,0.25)';
        }

        if (variant === 'secondary') {
          target.style.background =
            'rgba(255,255,255,0.05)';
        }

        if (variant === 'danger') {
          target.style.background =
            'rgba(244,63,94,0.15)';
        }
      }}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}
