// src/components/dashboard/MonthSelector.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { formatMonthLabel } from '@/lib/utils/date';

interface Props {
  options: string[];
  selected: string;
}

export default function MonthSelector({ options, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ minWidth: '180px', position: 'relative' }}>
      <select value={selected} onChange={handleChange} style={{ paddingRight: '36px', cursor: 'pointer' }}>
        {options.map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m)}
          </option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', fontSize: '0.8rem' }}>
        ▼
      </span>
    </div>
  );
}
