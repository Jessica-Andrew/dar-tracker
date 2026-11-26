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
import {
  Play,
  Pause,
  Check,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { GrainSurface } from '@/components/ui/GrainSurface';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SunIllustration } from '@/components/ui/SunIllustration';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { TaskMenuSheet } from '@/components/TaskMenuSheet';
import { ClockifyImportPanel } from '@/components/ClockifyImportPanel';
import { EmptyDay } from '@/components/EmptyDay';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import { useClockifyConfig } from '@/lib/hooks/useClockifyConfig';
import { useTaskTimer } from '@/lib/hooks/useTaskTimer';
import type { NewTask, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  finishing: boolean;
  onOpen: () => void;
  onToggleTimer: () => void;
  onStartFinish: () => void;
  onCancelFinish: () => void;
  onConfirmFinish: (outcome: string) => void;
  onMore: () => void;
}

function SeedlingRow({
  task,
  isRunning,
  elapsedSeconds,
  pending,
  finishing,
  onOpen,
  onToggleTimer,
  onStartFinish,
  onCancelFinish,
  onConfirmFinish,
  onMore,
}: SeedlingRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const [outcome, setOutcome] = useState('');

  // Start the outcome line from any outcome already saved on the task.
  useEffect(() => {
    if (finishing) setOutcome(task.outcome ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishing]);

  const statusText = isRunning
    ? `running · ${formatElapsed(elapsedSeconds)}`
    : task.hours > 0
      ? `paused · ${formatDuration(hoursToSeconds(task.hours))}`
      : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'animate-task-in border-b-[1.5px] border-parchment-400',
        isDragging && 'rounded-md bg-parchment-200 opacity-60',
        finishing && 'rounded-t-xl bg-parchment-300/40',
      )}
    >
      <div className="group flex min-h-[60px] w-full items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="hidden w-4 flex-shrink-0 cursor-grab touch-none text-ink-500 opacity-0 transition-opacity duration-quick hover:text-ink-700 group-hover:opacity-100 active:cursor-grabbing md:block"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <span
          aria-hidden
          className={cn(
            'h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 transition-colors duration-base',
            isRunning
              ? 'animate-pulse border-clay-500 bg-clay-500'
              : task.hours > 0
                ? 'border-clay-500 bg-transparent'
                : 'border-olive-500 bg-transparent',
          )}
        />
        <button onClick={onOpen} className="min-w-0 flex-1 py-2 text-left">
          <p className="truncate text-base text-ink-900">{task.description}</p>
          {statusText && (
            <p
              className={cn(
                'mt-0.5 font-mono text-xs tabular-nums md:hidden',
                isRunning ? 'text-clay-600' : 'text-ink-700',
              )}
            >
              {statusText}
            </p>
          )}
        </button>
        {statusText && (
          <span
            className={cn(
              'hidden flex-shrink-0 font-mono text-sm tabular-nums md:inline',
              isRunning ? 'text-clay-600' : 'text-ink-700',
            )}
          >
            {statusText}
          </span>
        )}
        <button
          onClick={onToggleTimer}
          disabled={pending}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 disabled:opacity-50 md:h-9 md:w-9',
            isRunning
              ? 'bg-clay-500 text-parchment-100 hover:bg-clay-600'
              : 'border-[1.5px] border-parchment-500 text-ink-700 hover:bg-parchment-300 hover:text-clay-600',
          )}
        >
          {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        <button
          onClick={onStartFinish}
          disabled={pending}
          aria-label="Finish task"
          className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-olive-300/40 hover:text-olive-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 disabled:opacity-50 md:flex"
        >
          <Check size={18} />
        </button>
        <button
          onClick={onMore}
          aria-label="More actions"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 md:hidden"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {finishing && (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-3.5 pl-4 pr-3 md:pl-[44px]">
          <div className="min-w-[200px] flex-1">
            <Input
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirmFinish(outcome.trim());
                if (e.key === 'Escape') onCancelFinish();
              }}
              placeholder="where did it land? (optional)"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => onConfirmFinish(outcome.trim())} size="sm">
              finish
            </Button>
            <Button onClick={onCancelFinish} variant="ghost" size="sm">
              cancel
            </Button>
          </div>
        </div>
      )}
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
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [menuTask, setMenuTask] = useState<Task | null>(null);

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

  // Save the outcome first (if one was typed), then run the normal
  // finish flow, which pauses a running timer and marks the task done.
  const finishWithOutcome = async (task: Task, outcome: string) => {
    setFinishingId(null);
    if (outcome && outcome !== (task.outcome ?? '')) {
      await updateTask(task.id, { outcome });
    }
    await timer.finish(task);
  };

  const reopenTask = (id: string) => {
    const nextPosition =
      seedlings.length > 0 ? Math.max(...seedlings.map((t) => t.position)) + 1 : 0;
    void updateTask(id, { status: 'planned', position: nextPosition });
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
      <GrainSurface className="flex min-h-[300px] items-center justify-center rounded-3xl p-6">
        <p className="font-display italic text-ink-500">gathering the day…</p>
      </GrainSurface>
    );
  }

  const showEmpty = tasks.length === 0;

  return (
    <>
      <GrainSurface className="rounded-3xl px-5 py-6 md:px-8 md:py-7">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <p className="text-xs uppercase tracking-kicker text-ink-500">Daily record</p>
            <h1 className="mt-1 font-display text-2xl font-black leading-tight text-ink-900">
              {isToday ? "Today's" : "The day's"}{' '}
              <em className="font-normal italic text-clay-500">harvest</em>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 md:h-9 md:w-9"
              aria-label="Previous day"
            >
              <ChevronLeft size={18} />
            </button>
            <DatePicker value={dateKey} onChange={onDateSelect} floating />
            <button
              onClick={onNext}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 md:h-9 md:w-9"
              aria-label="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-end gap-3.5">
            <div
              key={tickleKey}
              className="animate-tickle font-display text-4xl font-black leading-none text-clay-500"
            >
              {formatDuration(totalSeconds)}
            </div>
            <p className="max-w-[220px] pb-2 text-sm leading-normal text-ink-700">
              gathered so far
            </p>
          </div>
          <SunIllustration size={72} />
        </div>

        {showEmpty && (
          <EmptyDay
            onPlantFirst={() => setFormTask('new')}
            onImport={() => setShowImport(true)}
          />
        )}
      </GrainSurface>

      {!showEmpty && (
        <>
          <section className="mt-8">
            <div className="flex min-h-[44px] flex-wrap items-center justify-between gap-x-5 gap-y-1">
              <p className="text-xs uppercase tracking-kicker text-ink-500">
                Seedlings · {seedlings.length}
              </p>
              <div className="flex items-center gap-5">
                <Button onClick={() => setShowImport(true)} variant="ghost" size="sm">
                  gather from Clockify
                </Button>
                <Button onClick={() => setFormTask('new')} size="sm">
                  + plant a task
                </Button>
              </div>
            </div>

            {seedlings.length > 0 ? (
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
                        finishing={finishingId === task.id}
                        onOpen={() => setFormTask(task)}
                        onToggleTimer={() => timer.toggle(task)}
                        onStartFinish={() => setFinishingId(task.id)}
                        onCancelFinish={() => setFinishingId(null)}
                        onConfirmFinish={(outcome) => void finishWithOutcome(task, outcome)}
                        onMore={() => setMenuTask(task)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="py-3 font-display text-sm italic text-ink-500">
                no seedlings yet, plant what you plan to work on
              </p>
            )}

            {timer.error && (
              <p className="mt-2 font-display text-sm italic text-danger-500">
                {timer.error === 'clockify_not_configured'
                  ? "Clockify isn't connected yet — import once from Clockify to set it up."
                  : 'Something went wrong with the timer. Try again?'}
              </p>
            )}
          </section>

          {harvested.length > 0 && (
            <section className="mt-8">
              <p className="mb-1 text-xs uppercase tracking-kicker text-ink-500">
                Harvested · {harvested.length}
              </p>
              <TaskList
                tasks={harvested}
                onEdit={setFormTask}
                onDelete={(id) => void deleteTask(id)}
                onReorder={(ids) => void reorderTasks(ids)}
                onReopen={reopenTask}
                onMore={setMenuTask}
              />
            </section>
          )}
        </>
      )}

      <TaskMenuSheet
        task={menuTask}
        onClose={() => setMenuTask(null)}
        onFinish={
          menuTask
            ? () => {
                setFinishingId(menuTask.id);
                setMenuTask(null);
              }
            : undefined
        }
        onEdit={() => {
          if (menuTask) setFormTask(menuTask);
          setMenuTask(null);
        }}
        onUproot={() => {
          if (menuTask) void deleteTask(menuTask.id);
          setMenuTask(null);
        }}
      />

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