import { useCallback, useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { DayView } from '@/components/DayView';
import { SlackPreview } from '@/components/SlackPreview';
import { useDayTasks } from '@/lib/hooks/useDayTasks';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSeedlingCarryOver } from '@/lib/hooks/useSeedlingCarryOver';

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function AppShell() {
  const [dateKey, setDateKey] = useState(todayKey());
  const date = new Date(dateKey + 'T00:00:00');

  const { tasks, loading, addTask, updateTask, deleteTask, reload } = useDayTasks(dateKey);
  const { signOut } = useAuth();

  const isViewingToday = dateKey === todayKey();

  const handleCarriedOver = useCallback(() => {
    if (isViewingToday) void reload();
  }, [isViewingToday, reload]);

  useSeedlingCarryOver(handleCarriedOver);

  const goPrev = () => setDateKey(format(subDays(date, 1), 'yyyy-MM-dd'));
  const goNext = () => setDateKey(format(addDays(date, 1), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <p className="font-display italic text-sm text-clay-500">tend</p>
          <button
            onClick={() => void signOut()}
            className="font-display italic text-xs text-ink-500 hover:text-clay-500 transition-colors duration-quick px-1 py-0.5"
          >
            sign out
          </button>
        </div>

        <DayView
          date={date}
          tasks={tasks}
          loading={loading}
          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
          onPrev={goPrev}
          onNext={goNext}
        />
        <SlackPreview tasks={tasks} />
      </div>
    </div>
  );
}