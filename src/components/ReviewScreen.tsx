import { useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ActionPlansPanel } from '@/components/ActionPlansPanel';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { GprDigestPanel } from '@/components/GprDigestPanel';
import { WeekRollup } from '@/components/WeekRollup';
import { hoursToSeconds } from '@/lib/duration';
import { formatGprDuration } from '@/lib/gpr';
import { useMonthData } from '@/lib/hooks/useMonthData';
import { cn } from '@/lib/utils';

type PanelKey = 'rollup' | 'feedback' | 'plans' | 'digest';

interface Props {
  // Always the first day of the month, set by the shared month picker.
  month: Date;
}

export function ReviewScreen({ month }: Props) {
  const [active, setActive] = useState<PanelKey>('rollup');

  const startKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const endKey = format(endOfMonth(month), 'yyyy-MM-dd');
  const monthName = format(month, 'MMMM');

  // Summaries refetch whenever you switch panels, so counts catch up with
  // anything you just added.
  const { tasks, notes, plans, feedback } = useMonthData(startKey, endKey, true, active);

  const totalSeconds = tasks.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0);
  const trackedDays = new Set(tasks.map((t) => t.date)).size;
  const feedbackCount = feedback.filter((f) => f.review_month === startKey).length;
  const activePlans = plans.filter((p) => !p.archived).length;
  const planUpdates = notes.filter((n) => !!n.action_plan_id).length;

  const items: { key: PanelKey; title: string; summary: string }[] = [
    { key: 'rollup', title: 'Weekly rollup', summary: 'week by week, ready to paste' },
    {
      key: 'feedback',
      title: 'Review feedback',
      summary:
        feedbackCount === 0
          ? `no entries for ${monthName} yet`
          : `${feedbackCount} ${feedbackCount === 1 ? 'entry' : 'entries'} for ${monthName}`,
    },
    {
      key: 'plans',
      title: 'Action plans',
      summary: `${activePlans} active · ${
        planUpdates === 0
          ? 'no updates'
          : `${planUpdates} ${planUpdates === 1 ? 'update' : 'updates'}`
      } this month`,
    },
    { key: 'digest', title: 'Month digest', summary: `${monthName} · ready to copy` },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-kicker text-ink-500">Review</p>
        <h1 className="mt-1 font-display text-2xl font-black leading-tight text-ink-900">
          {monthName} <em className="font-normal italic text-clay-500">in review</em>
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          {trackedDays > 0
            ? `${formatGprDuration(totalSeconds)} tracked across ${trackedDays} days`
            : 'nothing tracked yet this month'}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <nav
          aria-label="Review panels"
          className="flex w-full flex-col gap-1.5 md:w-[260px] md:flex-none"
        >
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              aria-current={active === item.key ? 'true' : undefined}
              className={cn(
                'w-full rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500',
                active === item.key
                  ? 'border-parchment-400 bg-parchment-100'
                  : 'border-transparent hover:bg-parchment-300/40',
              )}
            >
              <span
                className={cn(
                  'block font-display text-base italic text-ink-900',
                  active === item.key && 'font-semibold',
                )}
              >
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs text-ink-700">{item.summary}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {active === 'rollup' && <WeekRollup month={month} />}
          {active === 'feedback' && (
            <FeedbackPanel month={month} onPlanCreated={() => setActive('plans')} />
          )}
          {active === 'plans' && (
            <ActionPlansPanel dateKey={format(new Date(), 'yyyy-MM-dd')} />
          )}
          {active === 'digest' && <GprDigestPanel month={month} />}
        </div>
      </div>
    </div>
  );
}