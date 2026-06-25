// src/components/transactions/TransactionFilters.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { formatMonthLabel } from '@/lib/utils/date';

interface Props {
  monthOptions: string[];
  selectedMonth: string;
  selectedType?: string;
  searchQuery: string;
}

export default function TransactionFilters({
  monthOptions,
  selectedMonth,
  selectedType,
  searchQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    if (key !== 'month') params.set('month', selectedMonth);
    if (key !== 'type' && selectedType) params.set('type', selectedType);
    if (key !== 'q' && searchQuery) params.set('q', searchQuery);
    if (value) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="filters-bar">
      {/* Month */}
      <div className="form-group">
        <label className="form-label">Month</label>
        <select value={selectedMonth} onChange={(e) => update('month', e.target.value)}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <select value={selectedType ?? ''} onChange={(e) => update('type', e.target.value)}>
          <option value="">All</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      {/* Search */}
      <div className="form-group" style={{ flex: 1 }}>
        <label className="form-label">Search</label>
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Category, description…"
            defaultValue={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              clearTimeout((window as any).__searchTimer);
              (window as any).__searchTimer = setTimeout(() => update('q', v), 300);
            }}
          />
        </div>
      </div>
    </div>
  );
}
