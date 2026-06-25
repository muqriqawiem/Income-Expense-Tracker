// src/app/(app)/transactions/page.tsx
import { getTransactions } from '@/data/transactions';
import { getCategories } from '@/data/categories';
import { generateMonthOptions, currentYearMonth } from '@/lib/utils/date';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionTableClient from '@/components/transactions/TransactionTableClient';
import type { TransactionType } from '@/types';

interface Props {
  searchParams: Promise<{ month?: string; type?: string; q?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedMonth = params.month ?? currentYearMonth();
  const selectedType = params.type as TransactionType | undefined;

  const [transactions, categories] = await Promise.all([
    getTransactions({
      year_month: selectedMonth,
      type: selectedType,
    }),
    getCategories(true),
  ]);

  const monthOptions = generateMonthOptions();

  const q = (params.q ?? '').toLowerCase();
  const filtered = q
    ? transactions.filter(
        (t) =>
          t.category?.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      )
    : transactions;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
      </div>

      <TransactionFilters
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        selectedType={selectedType}
        searchQuery={params.q ?? ''}
      />

      <TransactionTableClient
        transactions={filtered}
        categories={categories}
        selectedMonth={selectedMonth}
      />
    </>
  );
}
