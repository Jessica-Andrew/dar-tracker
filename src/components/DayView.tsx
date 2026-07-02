import { useMemo, useState } from 'react';
import { GrainSurface } from '@/components/ui/GrainSurface';
import { DateChip } from '@/components/ui/DateChip';
import { Button } from '@/components/ui/Button';
import { SunIllustration } from '@/components/ui/SunIllustration';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { ClockifyImportPanel } from '@/components/ClockifyImportPanel';
import { EmptyDay } from '@/components/EmptyDay';
import { useDayTasks } from '@/lib/hooks/useDayTasks';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/database.types';

interface Props {
  date: Date;
  dateKey: string;
  onPrev: () => void;
  onNext: () => void;
}

export function DayView({ date, dateKey, onPrev: _onPrev, onNext: _onNext }: Props) {
  const { tasks, loading, addTask, updateTask, deleteTask } = useDayTasks(dateKey);
  const [formTask, setFormTask] = useState<Task | 'new' | null>(null);
  const [showImport, setShowImport] = useState(false);

  const totalSeconds = useMemo(
    () => tasks.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0),
    [tasks],
  );

  if (loading) {
    return (
      <GrainSurface className="rounded-2xl p-6 min-h-[300px] flex items-center justify-center">
        <p className="font-display italic text-ink-500">gathering the day…</p>
      </GrainSurface>
    );
  }

  const showEmpty = tasks.length === 0;

  return (
    <>
      <GrainSurface className="rounded-2xl px-7 py-6">
        {/* Header */}
        <div className="relative flex items-start justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-kicker text-ink-500">Daily record</p>
            <h1 className="mt-1.5 font-display text-2xl font-black leading-tight text-ink-900">
              Today's
              <br />
              <em className="italic font-normal text-clay-500">harvest</em>
            </h1>
          </div>
          <DateChip date={date} />
        </div>

        {showEmpty ? (
          <EmptyDay
            onPlantFirst={() => setFormTask('new')}
            onImport={() => setShowImport(true)}
          />
        ) : (
          <>
            {/* Hero numeral */}
            <div className="relative flex items-end gap-4 my-5">
              <SunIllustration size={64} className="absolute right-0 -top-4" />
              <div className="font-display text-4xl font-black leading-none text-clay-500">
                {formatDuration(totalSeconds)}
              </div>
              <p className="text-sm text-ink-700 leading-normal pb-1.5 max-w-[220px]">
                gathered so far
              </p>
            </div>

            <TaskList
              tasks={tasks}
              onEdit={setFormTask}
              onDelete={(id) => void deleteTask(id)}
            />

            <div className="mt-4 flex gap-3">
              <Button onClick={() => setFormTask('new')} size="sm">
                + plant a task
              </Button>
              <Button
                onClick={() => setShowImport(true)}
                variant="ghost"
                size="sm"
              >
                gather from Clockify
              </Button>
            </div>
          </>
        )}
      </GrainSurface>

      <TaskForm
        task={formTask}
        onClose={() => setFormTask(null)}
        onSave={async (data) => {
          if (formTask === 'new') {
            await addTask({ ...data, source: 'manual' });
          } else if (formTask) {
            await updateTask(formTask.id, data);
          }
          setFormTask(null);
        }}
        onDelete={async () => {
          if (formTask && formTask !== 'new') {
            await deleteTask(formTask.id);
            setFormTask(null);
          }
        }}
      />

      <ClockifyImportPanel
        open={showImport}
        onClose={() => setShowImport(false)}
        date={date}
        onImport={async (entries, mergeName) => {
          if (mergeName) {
            const totalHours = entries.reduce((s, e) => s + e.hours, 0);
            await addTask({
              description: mergeName,
              hours: totalHours,
              task_label: null,
              links: null,
              blockers: null,
              next_steps: null,
              source: 'merged',
            });
          } else {
            for (const e of entries) {
              await addTask({
                description: e.project ? `${e.project} — ${e.description}` : e.description,
                hours: e.hours,
                task_label: null,
                links: null,
                blockers: null,
                next_steps: null,
                source: 'clockify',
              });
            }
          }
          setShowImport(false);
        }}
      />
    </>
  );
}
