import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useMonthData } from '@/lib/hooks/useMonthData';
import { buildDigest } from '@/lib/gprDigest';

interface Props {
  date: Date;
}

export function GprDigestPanel({ date }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(date));
  const [copied, setCopied] = useState(false);

  const startKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const endKey = format(endOfMonth(month), 'yyyy-MM-dd');
  const { tasks, notes, plans, feedback, loading } = useMonthData(startKey, endKey, open);

  const digest = useMemo(
    () => buildDigest({ month, tasks, notes, plans, feedback }),
    [month, tasks, notes, plans, feedback],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(digest);
    } catch {
      // Best effort; silently fail.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs uppercase tracking-kicker text-ink-500 transition-colors duration-quick hover:text-clay-500"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Month digest for your GPR
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth((m) => subMonths(m, 1))}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
              >
                ←
              </button>
              <p className="font-display text-sm font-black text-ink-900">
                {format(month, 'MMMM yyyy')}
              </p>
              <button
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
              >
                →
              </button>
            </div>
            <button
              onClick={() => void handleCopy()}
              disabled={loading}
              aria-label="Copy digest"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500 disabled:opacity-50"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>

          {loading ? (
            <p className="font-display text-sm italic text-ink-500">gathering the month…</p>
          ) : (
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink-900">
              {digest}
            </pre>
          )}

          <p className="mt-3 font-display text-xs italic text-ink-500">
            Paste this with your GPR template and ask for the justifications.
          </p>
        </div>
      )}
    </div>
  );
}