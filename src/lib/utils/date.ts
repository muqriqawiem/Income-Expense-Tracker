// src/lib/utils/date.ts

export function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function generateMonthOptions(startYear = 2024): string[] {
  const options: string[] = [];
  const now = new Date();
  let year = startYear;
  let month = 1;
  while (
    year < now.getFullYear() ||
    (year === now.getFullYear() && month <= now.getMonth() + 1)
  ) {
    options.push(`${year}-${String(month).padStart(2, '0')}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return options.reverse();
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('ms-MY', { year: 'numeric', month: 'long' });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
