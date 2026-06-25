// src/lib/utils/currency.ts

export function formatRM(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function parseAmount(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}
