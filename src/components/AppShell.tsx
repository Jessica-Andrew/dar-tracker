import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { DayView } from '@/components/DayView';
import { SlackPreview } from '@/components/SlackPreview';
import { useDayTasks } from '@/lib/hooks/useDayTasks';

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function AppShell() {
  const [dateKey, setDateKey] = useState(todayKey());
  const date = new Date(dateKey + 'T00:00:00');

  const { tasks, loading, addTask, updateTask, deleteTask } = useDayTasks(dateKey);

  const goPrev = () => setDateKey(format(subDays(date, 1), 'yyyy-MM-dd'));
  const goNext = () => setDateKey(format(addDays(date, 1), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
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