import { useState } from 'react';
import type { ReactNode } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { GrainSurface } from '@/components/ui/GrainSurface';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { SunIllustration } from '@/components/ui/SunIllustration';
import { useTeamLog } from '@/lib/hooks/useTeamLog';
import { TEAM_LOG_KINDS } from '@/lib/types';
import type { TeamLogKind } from '@/lib/types';
import { cn } from '@/lib/utils';

const KIND_HINTS: Record<TeamLogKind, string> = {
  initiative: 'Something you started for the team, like a review process or a framework.',
  decision: 'A call you made, with the reasoning in the detail.',
  deliverable: 'Something the team shipped under your lead.',
  milestone: 'A sprint scoped or a plan completed.',
};

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
        'inline-flex min-h-[44px] items-center rounded-full border px-3.5 font-display text-sm italic transition-colors duration-quick md:min-h-0 md:px-3 md:py-1.5',
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [kind, setKind] = useState<TeamLogKind>('initiative');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthName = format(month, 'MMMM');

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
      setSheetOpen(false);
      // Jump to the month the entry landed in, so you can see it.
      onMonthChange(startOfMonth(parseISO(date)));
    } catch {
      setError("Couldn't save that entry. Try again?");
    } finally {
      setSaving(false);
    }
  };

  // The same form shows in the right column on desktop and inside a sheet on phones.
  const formBody = (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 font-display text-xs italic text-ink-700">kind</p>
        <div className="flex flex-wrap gap-2">
          {TEAM_LOG_KINDS.map((k) => (
            <Chip key={k.key} active={kind === k.key} onClick={() => setKind(k.key)}>
              {k.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-display text-xs italic text-ink-700">date</p>
        <DatePicker value={date} onChange={setDate} />
      </div>

      <div>
        <p className="mb-1 font-display text-xs italic text-ink-700">
          what did you start, decide, or ship?
        </p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          placeholder="a short title"
        />
      </div>

      <div>
        <p className="mb-1 font-display text-xs italic text-ink-700">
          detail or reasoning (optional)
        </p>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder="why it mattered"
          className="w-full resize-none border-0 border-b-[1.5px] border-parchment-500 bg-transparent pb-2 pt-1.5 text-base text-ink-900 outline-none transition-colors duration-quick placeholder:font-display placeholder:italic placeholder:text-ink-300 focus:border-clay-500"
        />
      </div>

      <Button onClick={() => void handleAdd()} disabled={saving || !title.trim()} size="sm">
        add entry
      </Button>

      {error && <p className="font-display text-sm italic text-danger-500">{error}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-kicker text-ink-500">Team</p>
        <h1 className="mt-1 font-display text-2xl font-black leading-tight text-ink-900">
          Design team <em className="font-normal italic text-clay-500">contributions</em>
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Your own work as design lead. It feeds your month digest.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_480px]">
          <div className="mb-4 md:hidden">
            <Button onClick={() => setSheetOpen(true)} size="sm">
              + log a contribution
            </Button>
          </div>

          {entries.length === 0 ? (
            <GrainSurface className="rounded-3xl px-7 py-8">
              <SunIllustration size={56} />
              <h2 className="mt-3 font-display text-xl font-black text-ink-900">
                Nothing planted for {monthName}{' '}
                <em className="font-normal italic text-clay-500">yet</em>
              </h2>
              <p className="mt-2 max-w-md text-base leading-relaxed text-ink-700">
                Log what you started, decided, or shipped as design lead. A line or two is
                enough, and you can add the reasoning when it matters.
              </p>
            </GrainSurface>
          ) : (
            <section>
              <p className="mb-1 text-xs uppercase tracking-kicker text-ink-500">
                Logged · {entries.length}
              </p>
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-start gap-2 border-b-[1.5px] border-parchment-400 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs italic text-ink-700">
                      {format(parseISO(e.date), 'd MMM')} · {e.kind}
                    </p>
                    <p className="mt-0.5 break-words text-base font-medium text-ink-900">
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
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500 focus-visible:opacity-100 md:h-7 md:w-7 md:text-ink-500 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </section>
          )}

          <p className="mb-2 mt-8 text-xs uppercase tracking-kicker text-ink-500">
            What counts
          </p>
          {TEAM_LOG_KINDS.map((k) => (
            <div
              key={k.key}
              className="flex items-baseline gap-4 border-b-[1.5px] border-parchment-400 py-3"
            >
              <span className="w-24 flex-none font-display text-base italic text-clay-600">
                {k.label}
              </span>
              <span className="text-sm text-ink-900">{KIND_HINTS[k.key]}</span>
            </div>
          ))}
        </div>

        <section className="hidden min-w-0 max-w-[420px] flex-[1_1_360px] rounded-2xl border border-parchment-400 bg-parchment-100 p-6 md:block">
          <h2 className="font-display text-lg font-black text-ink-900">
            Log a <em className="font-normal italic text-clay-500">contribution</em>
          </h2>
          <div className="mt-4">{formBody}</div>
        </section>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Log a contribution"
        subtitle={format(month, 'MMMM yyyy')}
      >
        <div className="pt-4">{formBody}</div>
      </Sheet>
    </div>
  );
}