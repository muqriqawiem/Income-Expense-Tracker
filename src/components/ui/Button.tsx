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
    borderRadius: '8px',
    fontWeight: 600,
    transition: 'opacity 0.15s, background 0.15s',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  primary: { background: '#5b8dee', color: '#fff' },
  secondary: { background: '#22263a', color: '#e8eaf6', border: '1px solid #2e3347' },
  danger: { background: '#f05252', color: '#fff' },
  ghost: { background: 'transparent', color: '#7c82a0' },
  sm: { padding: '5px 12px', fontSize: '0.8rem' },
  md: { padding: '8px 16px', fontSize: '0.875rem' },
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
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}
