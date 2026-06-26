const TZ = 'America/Argentina/Buenos_Aires';

/** YYYY-MM-DD in Argentina timezone, regardless of browser timezone */
export function getHoyArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** 0=Sun … 6=Sat, computed from Argentina local date */
export function getDiaSemanaArgentina(): number {
  const [y, m, d] = getHoyArgentina().split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Date object at midnight local time, but with year/month/day
 * derived from the Argentina timezone. Safe to use with getFullYear(),
 * getMonth(), getDate(), getDay() for arithmetic.
 */
export function getHoyArDate(): Date {
  const [y, m, d] = getHoyArgentina().split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date to YYYY-MM-DD using local (not UTC) date methods */
export function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
