import { endOfWeek, format, startOfWeek } from 'date-fns';
import { hoursToSeconds } from '@/lib/duration';
import { formatGprDuration } from '@/lib/gpr';
import { useWeekTasks } from '@/lib/hooks/useWeekTasks';
import type { Task } from '@/lib/types';

interface Props {
  date: Date;
  // The viewed day's tasks. Used only to refresh the total when they change.
  dayTasks: Task[];
  onOpenReview: () => void;
}

export function WeekSummaryCard({ date, dayTasks, onOpenReview }: Props) {
  const startKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const endKey = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekTasks = useWeekTasks(startKey, endKey, dayTasks);
  const totalSeconds = weekTasks.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0);

  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-parchment-400 bg-parchment-200 px-5 py-4">
      <div>
        <p className="text-xs uppercase tracking-kicker text-ink-500">This week</p>
        <p className="mt-1 font-display text-2xl font-black leading-none text-ink-900">
          {formatGprDuration(totalSeconds)}
        </p>
      </div>
      <button
        onClick={onOpenReview}
        className="font-display text-sm italic text-clay-600 transition-colors duration-quick hover:text-clay-700"
      >
        open weekly rollup
      </button>
    </section>
  );
}