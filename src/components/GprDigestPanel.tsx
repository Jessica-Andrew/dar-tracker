import { useMemo, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Copy, Check } from 'lucide-react';
import { useMonthData } from '@/lib/hooks/useMonthData';
import { buildDigest } from '@/lib/gprDigest';

interface Props {
  // Always the first day of the month, set by the shared month picker.
  month: Date;
}

export function GprDigestPanel({ month }: Props) {
  const [copied, setCopied] = useState(false);

  const startKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const endKey = format(endOfMonth(month), 'yyyy-MM-dd');
  const { tasks, notes, plans, feedback, teamLog, loading } = useMonthData(
    startKey,
    endKey,
    true,
  );

  const digest = useMemo(
    () => buildDigest({ month, tasks, notes, plans, feedback, teamLog }),
    [month, tasks, notes, plans, feedback, teamLog],
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
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Month digest for your GPR
      </p>
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-black text-ink-900">
            {format(month, 'MMMM yyyy')}
          </p>
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
    </div>
  );
}