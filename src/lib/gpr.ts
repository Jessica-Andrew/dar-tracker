import { format, parseISO } from 'date-fns';
import { hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';

export function formatGprDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export interface WeekRollupData {
  range: string;
  workProducts: string;
  total: string;
}

export function buildWeekRollup(tasks: Task[]): WeekRollupData | null {
  const done = tasks.filter((t) => t.status === 'done');
  if (done.length === 0) return null;

  const groups = new Map<string, { name: string; seconds: number }>();
  for (const t of done) {
    const name = t.description.trim();
    const key = name.toLowerCase();
    const seconds = hoursToSeconds(t.hours);
    const existing = groups.get(key);
    if (existing) existing.seconds += seconds;
    else groups.set(key, { name, seconds });
  }

  const products = [...groups.values()].sort(
    (a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name),
  );

  const dates = done.map((t) => t.date).sort();
  const first = format(parseISO(dates[0]), 'MMM dd');
  const last = format(parseISO(dates[dates.length - 1]), 'MMM dd');
  const range = first === last ? first : `${first} - ${last}`;

  const totalSeconds = products.reduce((sum, p) => sum + p.seconds, 0);

  return {
    range,
    workProducts: products
      .map((p) => `${p.name} (${formatGprDuration(p.seconds)})`)
      .join(', '),
    total: formatGprDuration(totalSeconds),
  };
}