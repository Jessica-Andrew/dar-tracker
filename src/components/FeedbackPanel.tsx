import { useState } from 'react';
import type { ReactNode } from 'react';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFeedback } from '@/lib/hooks/useFeedback';
import type { FeedbackArea, FeedbackSource } from '@/lib/types';
import { cn } from '@/lib/utils';

const SOURCES: { key: FeedbackSource; label: string }[] = [
  { key: 'ceo', label: 'CEO' },
  { key: 'hr', label: 'HR' },
  { key: 'other', label: 'other' },
];

const AREAS: { key: FeedbackArea; label: string }[] = [
  { key: 'overall', label: 'overall' },
  { key: 'work_product', label: 'work product' },
  { key: 'delivery', label: 'delivery' },
  { key: 'learning', label: 'learning' },
  { key: 'problem_solving', label: 'problem solving' },
  { key: 'focus', label: 'focus' },
  { key: 'alignment', label: 'alignment' },
];

const RATINGS = ['L1', 'L2', 'L3', 'L4', 'L5'];

// Work product feedback has no fixed row, so the trend table skips it.
const TREND_ROWS = AREAS.filter((a) => a.key !== 'work_product');

function labelFor(list: { key: string; label: string }[], key: string): string {
  return list.find((x) => x.key === key)?.label ?? key;
}

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
  defaultMonth: Date;
  onPlanCreated: () => void;
}

export function FeedbackPanel({ defaultMonth, onPlanCreated }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(defaultMonth));
  const { history, entries, addFeedback, deleteFeedback, createPlanFrom } =
    useFeedback(month);

  const [source, setSource] = useState<FeedbackSource>('ceo');
  const [area, setArea] = useState<FeedbackArea>('overall');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<string | null>(null);
  const [needsAction, setNeedsAction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!comment.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addFeedback({
        source,
        area,
        subject: area === 'work_product' ? subject.trim() || null : null,
        comment: comment.trim(),
        rating,
        needs_action: needsAction,
      });
      setComment('');
      setSubject('');
      setRating(null);
      setNeedsAction(false);
    } catch {
      setError("Couldn't save that feedback. Try again?");
    } finally {
      setSaving(false);
    }
  };

  const handleMakePlan = async (id: string) => {
    const entry = entries.find((f) => f.id === id);
    if (!entry) return;
    setError(null);
    try {
      await createPlanFrom(entry);
      onPlanCreated();
    } catch {
      setError("Couldn't create that action plan. Try again?");
    }
  };

  // Trend table: the six months ending at the selected one.
  const months = Array.from({ length: 6 }, (_, i) => subMonths(month, 5 - i));
  const hasRatings = history.some((f) => !!f.rating);
  const ratingFor = (areaKey: string, m: Date) => {
    const key = format(m, 'yyyy-MM-dd');
    const matches = history.filter(
      (f) => f.area === areaKey && f.review_month === key && !!f.rating,
    );
    return matches.slice(-1)[0]?.rating ?? '-';
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Review feedback
      </p>
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        <div className="mb-4 flex items-center gap-2">
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

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 font-display text-xs italic text-ink-500">from</span>
            {SOURCES.map((s) => (
              <Chip key={s.key} active={source === s.key} onClick={() => setSource(s.key)}>
                {s.label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 font-display text-xs italic text-ink-500">about</span>
            {AREAS.map((a) => (
              <Chip key={a.key} active={area === a.key} onClick={() => setArea(a.key)}>
                {a.label}
              </Chip>
            ))}
          </div>

          {area === 'work_product' && (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="which work product?"
            />
          )}

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="what was said"
            className="w-full resize-none border-0 border-b-[1.5px] border-parchment-500 bg-transparent pb-2 pt-1.5 text-base text-ink-900 outline-none transition-colors duration-quick placeholder:font-display placeholder:italic placeholder:text-ink-300 focus:border-clay-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 font-display text-xs italic text-ink-500">rating</span>
            {RATINGS.map((r) => (
              <Chip
                key={r}
                active={rating === r}
                onClick={() => setRating(rating === r ? null : r)}
              >
                {r}
              </Chip>
            ))}
            <label className="ml-auto flex cursor-pointer items-center gap-2 font-display text-xs italic text-ink-700">
              <input
                type="checkbox"
                checked={needsAction}
                onChange={(e) => setNeedsAction(e.target.checked)}
                className="accent-clay-500"
              />
              needs action
            </label>
          </div>

          <Button
            onClick={() => void handleAdd()}
            disabled={saving || !comment.trim()}
            size="sm"
          >
            add feedback
          </Button>
        </div>

        {error && (
          <p className="mt-2 font-display text-sm italic text-danger-500">{error}</p>
        )}

        <div className="mt-4">
          {entries.length === 0 ? (
            <p className="font-display text-sm italic text-ink-500">
              no feedback logged for this month
            </p>
          ) : (
            entries.map((f) => (
              <div
                key={f.id}
                className="group border-t-[1.5px] border-parchment-400 py-3 first:border-t-0"
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs italic text-ink-500">
                      {[
                        labelFor(SOURCES, f.source),
                        labelFor(AREAS, f.area) + (f.subject ? `: ${f.subject}` : ''),
                        f.rating,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-900">
                      {f.comment}
                    </p>
                    {f.needs_action &&
                      (f.action_plan_id ? (
                        <p className="mt-1 font-display text-xs italic text-olive-700">
                          linked to an action plan
                        </p>
                      ) : (
                        <button
                          onClick={() => void handleMakePlan(f.id)}
                          className="mt-1 font-display text-xs italic text-clay-500 hover:text-clay-600"
                        >
                          make action plan
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => void deleteFeedback(f.id)}
                    aria-label="Delete feedback"
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-300 opacity-0 transition-opacity duration-quick hover:bg-parchment-300 hover:text-clay-500 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {hasRatings && (
          <div className="mt-4 overflow-x-auto border-t-[1.5px] border-parchment-400 pt-4">
            <p className="mb-2 font-display text-xs italic text-ink-500">
              rating trend, last six months
            </p>
            <table className="w-full text-left text-xs text-ink-700">
              <thead>
                <tr>
                  <th className="pb-1 pr-3 font-normal" />
                  {months.map((m) => (
                    <th key={m.toISOString()} className="pb-1 pr-3 font-display font-normal italic text-ink-500">
                      {format(m, 'MMM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TREND_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="py-0.5 pr-3 font-display italic text-ink-500">{row.label}</td>
                    {months.map((m) => (
                      <td key={m.toISOString()} className="py-0.5 pr-3 font-mono tabular-nums">
                        {ratingFor(row.key, m)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}