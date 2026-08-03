import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pause, Check, GripVertical } from 'lucide-react';
import { GrainSurface } from '@/components/ui/GrainSurface';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { SunIllustration } from '@/components/ui/SunIllustration';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { ClockifyImportPanel } from '@/components/ClockifyImportPanel';
import { EmptyDay } from '@/components/EmptyDay';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import { useClockifyConfig } from '@/lib/hooks/useClockifyConfig';
import { useTaskTimer } from '@/lib/hooks/useTaskTimer';
import type { NewTask, Task } from '@/lib/types';

interface Props {
  date: Date;
  tasks: Task[];
  loading: boolean;
  addTask: (partial: NewTask) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  onPrev: () => void;
  onNext: () => void;
  onDateSelect: (dateKey: string) => void;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface SeedlingRowProps {
  task: Task;
  isRunning: boolean;
  elapsedSeconds: number;
  pending: boolean;
  onOpen: () => void;
  onToggleTimer: () => void;
  onFinish: () => void;
}

function SeedlingRow({
  task,
  isRunning,
  elapsedSeconds,
  pending,
  onOpen,
  onToggleTimer,
  onFinish,
}: SeedlingRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex w-full items-center gap-2 border-b-[1.5px] border-parchment-400 py-2.5 last:border-b-0 animate-task-in ${
        isDragging ? 'opacity-60 bg-parchment-200 rounded-md' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab touch-none text-ink-300 opacity-0 transition-opacity duration-quick hover:text-ink-500 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <span
        aria-hidden
        className={`h-3 w-3 flex-shrink-0 rounded-full border-2 transition-colors duration-base ${
          isRunning
            ? 'border-clay-500 bg-clay-500 animate-pulse'
            : task.hours > 0
              ? 'border-clay-500 bg-transparent'
              : 'border-olive-500 bg-transparent'
        }`}
      />
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className="text-base text-ink-700 truncate">{task.description}</p>
      </button>
      {isRunning ? (
        <span className="font-mono text-sm text-clay-500 flex-shrink-0 tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </span>
      ) : task.hours > 0 ? (
        <span className="font-mono text-sm text-ink-500 flex-shrink-0 tabular-nums">
          {formatDuration(hoursToSeconds(task.hours))}
        </span>
      ) : null}
      <button
        onClick={onToggleTimer}
        disabled={pending}
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 disabled:opacity-50 ${
          isRunning
            ? 'bg-clay-500 text-parchment-100 hover:bg-clay-600'
            : 'text-ink-500 hover:bg-parchment-300 hover:text-clay-500'
        }`}
      >
        {isRunning ? <Pause size={12} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
      </button>
      <button
        onClick={onFinish}
        disabled={pending}
        aria-label="Finish task"
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-olive-300/40 hover:text-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 disabled:opacity-50"
      >
        <Check size={15} />
      </button>
    </div>
  );
}

export function DayView({
  date,
  tasks,
  loading,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  onPrev,
  onNext,
  onDateSelect,
}: Props) {
  const [formTask, setFormTask] = useState<Task | 'new' | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { config } = useClockifyConfig();
  const timer = useTaskTimer({
    tasks,
    updateTask,
    workspaceId: config?.workspace_id ?? null,
    clockifyUserId: config?.clockify_user_id ?? null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const dateKey = format(date, 'yyyy-MM-dd');
  const isToday = new Date().toDateString() === date.toDateString();

  const seedlings = useMemo(() => tasks.filter((t) => t.status === 'planned'), [tasks]);
  const harvested = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks]);

  const handleSeedlingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = seedlings.findIndex((t) => t.id === active.id);
    const newIndex = seedlings.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(seedlings, oldIndex, newIndex);
    void reorderTasks(reordered.map((t) => t.id));
  };

  // The harvest total only counts work that actually happened.
  const totalSeconds = useMemo(
    () => harvested.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0),
    [harvested],
  );

  // Re-trigger the tickle animation whenever the total changes.
  // A CSS animation class alone won't replay on its own when the
  // element re-renders in place, so we force a remount via `key`.
  const [tickleKey, setTickleKey] = useState(0);
  const prevTotal = useRef(totalSeconds);

  useEffect(() => {
    if (totalSeconds !== prevTotal.current) {
      setTickleKey((k) => k + 1);
      prevTotal.current = totalSeconds;
    }
  }, [totalSeconds]);

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
      <div className="relative flex items-start justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-kicker text-ink-500">Daily record</p>
            <h1 className="mt-1.5 font-display text-2xl font-black leading-tight text-ink-900">
              {isToday ? "Today's" : "The day's"}
              <br />
              <em className="italic font-normal text-clay-500">harvest</em>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
              aria-label="Previous day"
            >
              ←
            </button>
            <DatePicker value={dateKey} onChange={onDateSelect} floating />
            <button
              onClick={onNext}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
              aria-label="Next day"
            >
              →
            </button>
          </div>
        </div>

        {showEmpty ? (
          <EmptyDay
            onPlantFirst={() => setFormTask('new')}
            onImport={() => setShowImport(true)}
          />
        ) : (
          <>
            {seedlings.length > 0 && (
              <div className="mt-4 mb-5">
                <p className="text-xs uppercase tracking-kicker text-ink-500 mb-1">
                  Seedlings
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSeedlingDragEnd}
                >
                  <SortableContext
                    items={seedlings.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {seedlings.map((task) => (
                        <SeedlingRow
                          key={task.id}
                          task={task}
                          isRunning={timer.runningTaskId === task.id}
                          elapsedSeconds={timer.elapsedSeconds}
                          pending={timer.pending}
                          onOpen={() => setFormTask(task)}
                          onToggleTimer={() => timer.toggle(task)}
                          onFinish={() => void timer.finish(task)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {timer.error && (
                  <p className="mt-2 font-display italic text-sm text-danger-500">
                    {timer.error === 'clockify_not_configured'
                      ? "Clockify isn't connected yet — import once from Clockify to set it up."
                      : "Something went wrong with the timer. Try again?"}
                  </p>
                )}
              </div>
            )}

            {harvested.length > 0 && (
              <>
                <div className="relative flex items-end gap-4 my-5">
                  <SunIllustration size={64} className="absolute right-0 -top-4" />
                  <div
                    key={tickleKey}
                    className="font-display text-4xl font-black leading-none text-clay-500 animate-tickle"
                  >
                    {formatDuration(totalSeconds)}
                  </div>
                  <p className="text-sm text-ink-700 leading-normal pb-1.5 max-w-[220px]">
                    gathered so far
                  </p>
                </div>

                <TaskList
                  tasks={harvested}
                  onEdit={setFormTask}
                  onDelete={(id) => void deleteTask(id)}
                  onReorder={(ids) => void reorderTasks(ids)}
                  onReopen={(id) => {
                    const nextPosition =
                      seedlings.length > 0
                        ? Math.max(...seedlings.map((t) => t.position)) + 1
                        : 0;
                    void updateTask(id, { status: 'planned', position: nextPosition });
                  }}
                />
              </>
            )}

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
        currentDate={dateKey}
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
            const totalHours = Math.round(entries.reduce((s, e) => s + e.hours, 0) * 100) / 100;
            await addTask({
              description: mergeName,
              date: dateKey,
              hours: totalHours,
              task_label: null,
              links: null,
              blockers: null,
              next_steps: null,
              source: 'merged',
              status: 'done',
            });
          } else {
            for (const e of entries) {
              await addTask({
                description: e.project ? `${e.project} — ${e.description}` : e.description,
                date: dateKey,
                hours: Math.round(e.hours * 100) / 100,
                task_label: null,
                links: null,
                blockers: null,
                next_steps: null,
                source: 'clockify',
                status: 'done',
              });
            }
          }
          setShowImport(false);
        }}
      />
    </>
  );
}
