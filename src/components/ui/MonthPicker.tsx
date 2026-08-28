'use client';

import { useId } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Props {
  selectedMonth: string;
  label?: string;
}

export default function MonthPicker({ selectedMonth, label }: Props) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const month = event.target.value;
    if (!month) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={label ? 'form-group' : undefined} style={{ minWidth: '180px' }}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="month"
        value={selectedMonth}
        onChange={handleChange}
        aria-label={label ?? 'Select month'}
        title="Select any past or future month"
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}
