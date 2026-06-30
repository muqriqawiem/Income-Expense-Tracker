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

export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function generateMonthOptions(startYear = 2026): string[] {
  const { year: nowYear, month: nowMonth } = nowParts();
  const options: string[] = [];
  let year = startYear;
  let month = 1;
  while (year < nowYear || (year === nowYear && month <= nowMonth)) {
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
  const { year, month, day } = nowParts();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
