import { useMemo, useState } from 'react';
import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import { useWeekTasks } from '@/lib/hooks/useWeekTasks';
import { buildWeekRollup } from '@/lib/gpr';

interface Props {
  // Which week to open on. After that, the arrows take over.
  date: Date;
}

export function WeekRollup({ date }: Props) {
  const [anchor, setAnchor] = useState(date);
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchor, { weekStartsOn: 1 });
  const startKey = format(weekStart, 'yyyy-MM-dd');
  const endKey = format(weekEnd, 'yyyy-MM-dd');

  const weekTasks = useWeekTasks(startKey, endKey, null);
  const rollup = useMemo(() => buildWeekRollup(weekTasks), [weekTasks]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rows = rollup
    ? [
        { key: 'range', label: 'date range', value: rollup.range },
        { key: 'products', label: 'work products (hours)', value: rollup.workProducts },
        { key: 'total', label: 'total hours', value: rollup.total },
      ]
    : [];

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
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setAnchor((a) => subWeeks(a, 1))}
            aria-label="Previous week"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
          >
            ←
          </button>
          <p className="font-display text-sm font-black text-ink-900">
            {format(weekStart, 'MMM d')} to {format(weekEnd, 'MMM d')}
          </p>
          <button
            onClick={() => setAnchor((a) => addWeeks(a, 1))}
            aria-label="Next week"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
          >
            →
          </button>
        </div>

        {rollup ? (
          <div className="space-y-4">
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
        ) : (
          <p className="font-display text-sm italic text-ink-500">
            no finished tasks this week
          </p>
        )}
      </div>
    </div>
  );
}