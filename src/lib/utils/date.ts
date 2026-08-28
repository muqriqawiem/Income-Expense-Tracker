// src/lib/utils/date.ts
const APP_TIMEZONE = 'Asia/Kuala_Lumpur';

function nowParts(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function currentYearMonth(): string {
  const { year, month } = nowParts();
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isValidYearMonth(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  return Number(value.slice(0, 4)) >= 1000;
}

export function resolveYearMonth(value: string | null | undefined): string {
  return isValidYearMonth(value) ? value : currentYearMonth();
}

export function previousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  return `${previousYear}-${String(previousMonth).padStart(2, '0')}`;
}

export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('ms-MY', { year: 'numeric', month: 'long' });
}

export function todayISO(): string {
  const { year, month, day } = nowParts();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function defaultDateForMonth(yearMonth: string): string {
  const selectedMonth = resolveYearMonth(yearMonth);
  const [year, month] = selectedMonth.split('-').map(Number);
  const { day } = nowParts();
  const lastDay = new Date(year, month, 0).getDate();

  return `${selectedMonth}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
