import { useMemo, useState } from 'react';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import { useWeekTasks } from '@/lib/hooks/useWeekTasks';
import { buildWeekRollup } from '@/lib/gpr';
import type { Task } from '@/lib/types';

interface Props {
  date: Date;
  // The viewed day's tasks. Used only to refresh the rollup when they change.
  dayTasks: Task[];
}

export function WeekRollup({ date, dayTasks }: Props) {
  const startKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endKey = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const weekTasks = useWeekTasks(startKey, endKey, dayTasks);
  const rollup = useMemo(() => buildWeekRollup(weekTasks), [weekTasks]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!rollup) return null;

  const rows = [
    { key: 'range', label: 'date range', value: rollup.range },
    { key: 'products', label: 'work products (hours)', value: rollup.workProducts },
    { key: 'total', label: 'total hours', value: rollup.total },
  ];

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Best effort; silently fail.
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Weekly rollup for your GPR
      </p>
      <div className="space-y-4 rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 font-display text-xs italic text-ink-500">{row.label}</p>
              <p className="break-words text-sm text-ink-900">{row.value}</p>
            </div>
            <button
              onClick={() => void handleCopy(row.key, row.value)}
              aria-label={`Copy ${row.label}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
            >
              {copiedKey === row.key ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}