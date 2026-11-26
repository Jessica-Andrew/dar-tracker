import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarDays, Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  task: Task | null;
  onClose: () => void;
  // Shown for seedlings.
  onFinish?: () => void;
  // Shown for harvested tasks.
  onReopen?: () => void;
  onEdit: () => void;
  onUproot: () => void;
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  disabled,
  danger,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex min-h-[56px] w-full items-center gap-4 border-b-[1.5px] border-parchment-400 text-left transition-colors duration-quick last:border-b-0 disabled:opacity-50',
        danger ? 'text-clay-700' : 'text-ink-900',
      )}
    >
      <span className="flex-none">{icon}</span>
      <span className="flex-1">
        <span className="block text-base font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-700">{hint}</span>}
      </span>
    </button>
  );
}

export function TaskMenuSheet({ task, onClose, onFinish, onReopen, onEdit, onUproot }: Props) {
  const [confirming, setConfirming] = useState(false);

  // Start every opening on the plain menu, never on the confirmation.
  useEffect(() => {
    setConfirming(false);
  }, [task?.id]);

  const isRunning = !!task?.active_entry_id;
  const subtitle = task
    ? isRunning
      ? 'running'
      : task.status === 'done'
        ? `done · ${formatDuration(hoursToSeconds(task.hours))}`
        : task.hours > 0
          ? `paused · ${formatDuration(hoursToSeconds(task.hours))}`
          : 'not started'
    : undefined;

  return (
    <Sheet
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={task?.description ?? ''}
      subtitle={subtitle}
    >
      {task &&
        (confirming ? (
          <div className="pt-4">
            <p className="font-display text-base italic text-ink-900">
              Uproot this task? It can't be undone.
            </p>
            <div className="mt-3 flex gap-3">
              <Button variant="danger" size="sm" onClick={onUproot}>
                yes, uproot
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {onFinish && (
              <MenuItem
                icon={<Check size={22} className="text-olive-700" />}
                label="Finish task"
                hint="keeps your hours and asks where it landed"
                onClick={onFinish}
              />
            )}
            {onReopen && (
              <MenuItem
                icon={<RotateCcw size={22} className="text-ink-700" />}
                label="Reopen as seedling"
                hint="keeps the hours you logged"
                onClick={onReopen}
              />
            )}
            <MenuItem
              icon={<Pencil size={22} className="text-ink-700" />}
              label="Edit details"
              onClick={onEdit}
            />
            <MenuItem
              icon={<CalendarDays size={22} className="text-ink-700" />}
              label="Move to another day"
              hint="opens the form so you can change the date"
              onClick={onEdit}
              disabled={isRunning}
            />
            <MenuItem
              icon={<Trash2 size={22} />}
              label="Uproot"
              hint={isRunning ? 'pause the timer first' : undefined}
              onClick={() => setConfirming(true)}
              disabled={isRunning}
              danger
            />
          </div>
        ))}
    </Sheet>
  );
}