import { useState } from 'react';
import type { ReactNode } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { useTeamLog } from '@/lib/hooks/useTeamLog';
import { TEAM_LOG_KINDS } from '@/lib/types';
import type { TeamLogKind } from '@/lib/types';
import { cn } from '@/lib/utils';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 font-display text-xs italic transition-colors duration-quick',
        active
          ? 'border-clay-500 bg-clay-500 text-parchment-100'
          : 'border-parchment-500 text-ink-700 hover:bg-parchment-300',
      )}
    >
      {children}
    </button>
  );
}

interface Props {
  // Always the first day of the month, set by the shared month picker.
  month: Date;
  onMonthChange: (month: Date) => void;
}

export function TeamLogPanel({ month, onMonthChange }: Props) {
  const { entries, addEntry, deleteEntry } = useTeamLog(month);

  const [kind, setKind] = useState<TeamLogKind>('initiative');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addEntry({
        date,
        kind,
        title: title.trim(),
        detail: detail.trim() || null,
      });
      setTitle('');
      setDetail('');
      // Jump to the month the entry landed in, so you can see it.
      onMonthChange(startOfMonth(parseISO(date)));
    } catch {
      setError("Couldn't save that entry. Try again?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Design team contributions
      </p>
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {TEAM_LOG_KINDS.map((k) => (
              <Chip key={k.key} active={kind === k.key} onClick={() => setKind(k.key)}>
                {k.label}
              </Chip>
            ))}
          </div>

          <div>
            <p className="mb-1 font-display text-xs italic text-ink-700">date</p>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd();
            }}
            placeholder="what did you start, decide, or ship?"
          />

          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            placeholder="detail or reasoning (optional)"
            className="w-full resize-none border-0 border-b-[1.5px] border-parchment-500 bg-transparent pb-2 pt-1.5 text-base text-ink-900 outline-none transition-colors duration-quick placeholder:font-display placeholder:italic placeholder:text-ink-300 focus:border-clay-500"
          />

          <Button
            onClick={() => void handleAdd()}
            disabled={saving || !title.trim()}
            size="sm"
          >
            add entry
          </Button>
        </div>

        {error && (
          <p className="mt-2 font-display text-sm italic text-danger-500">{error}</p>
        )}

        <div className="mt-5 border-t-[1.5px] border-parchment-400 pt-4">
          <p className="mb-3 font-display text-sm font-black text-ink-900">
            {format(month, 'MMMM yyyy')}
          </p>

          {entries.length === 0 ? (
            <p className="font-display text-sm italic text-ink-500">
              nothing logged for this month
            </p>
          ) : (
            entries.map((e) => (
              <div
                key={e.id}
                className="group flex items-start gap-2 border-t-[1.5px] border-parchment-400 py-3 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs italic text-ink-500">
                    {format(parseISO(e.date), 'd MMM')} · {e.kind}
                  </p>
                  <p className="mt-0.5 break-words text-sm font-medium text-ink-900">
                    {e.title}
                  </p>
                  {e.detail && (
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-700">
                      {e.detail}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => void deleteEntry(e.id)}
                  aria-label="Delete entry"
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-300 opacity-0 transition-opacity duration-quick hover:bg-parchment-300 hover:text-clay-500 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}