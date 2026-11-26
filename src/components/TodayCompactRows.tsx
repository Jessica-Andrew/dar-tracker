import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Copy, Plus } from 'lucide-react';
import { NotesPanel } from '@/components/NotesPanel';
import { SlackPreview } from '@/components/SlackPreview';
import { Sheet } from '@/components/ui/Sheet';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';

function Row({
  title,
  summary,
  icon,
  onClick,
  disabled,
}: {
  title: string;
  summary: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-[1.5px] border-parchment-400 bg-parchment-100 px-4 text-left transition-colors duration-quick hover:bg-parchment-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 disabled:opacity-60"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base italic text-ink-900">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-700">{summary}</span>
      </span>
      <span className="flex h-11 w-11 flex-none items-center justify-center text-clay-600">
        {icon}
      </span>
    </button>
  );
}

interface Props {
  tasks: Task[];
  date: Date;
  dateKey: string;
}

export function TodayCompactRows({ tasks, date, dateKey }: Props) {
  const [open, setOpen] = useState<'notes' | 'slack' | null>(null);

  const done = useMemo(() => tasks.filter((t) => t.status === 'done'), [tasks]);
  const totalSeconds = done.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0);

  const slackSummary =
    done.length === 0
      ? 'nothing to report yet'
      : `${done.length} ${done.length === 1 ? 'task' : 'tasks'} · ${formatDuration(totalSeconds)} · tap to copy`;

  return (
    <div className="space-y-2">
      <Row
        title="Notes for your GPR"
        summary="capture something worth remembering"
        icon={<Plus size={22} />}
        onClick={() => setOpen('notes')}
      />
      <Row
        title="Slack report"
        summary={slackSummary}
        icon={<Copy size={20} />}
        onClick={() => setOpen('slack')}
        disabled={done.length === 0}
      />

      <Sheet
        open={open === 'notes'}
        onOpenChange={(o) => {
          if (!o) setOpen(null);
        }}
        title="Notes for your GPR"
        subtitle={format(date, 'EEE d MMM')}
      >
        <div className="pt-4">
          <NotesPanel dateKey={dateKey} />
        </div>
      </Sheet>

      <Sheet
        open={open === 'slack'}
        onOpenChange={(o) => {
          if (!o) setOpen(null);
        }}
        title="Slack report"
        subtitle={format(date, 'EEE d MMM')}
      >
        <div className="pt-4">
          <SlackPreview tasks={tasks} date={date} />
        </div>
      </Sheet>
    </div>
  );
}