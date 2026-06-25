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
    <div style={{ minWidth: '180px' }}>
      <select value={selected} onChange={handleChange}>
        {options.map((m) => (
          <option key={m} value={m}>
            {formatMonthLabel(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
