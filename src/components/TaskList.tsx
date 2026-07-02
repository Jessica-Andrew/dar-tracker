import { SeedMarker } from '@/components/ui/SeedMarker';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/database.types';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onEdit, onDelete: _onDelete }: Props) {
  return (
    <div className="relative">
      {tasks.map((task, i) => (
        <TaskItem key={task.id} task={task} index={i} onClick={() => onEdit(task)} />
      ))}
    </div>
  );
}

interface ItemProps {
  task: Task;
  index: number;
  onClick: () => void;
}

function TaskItem({ task, index, onClick }: ItemProps) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b-[1.5px] border-parchment-400 py-3 text-left last:border-b-0 transition-colors duration-quick hover:bg-parchment-300/40 focus-visible:outline-none focus-visible:bg-parchment-300/40"
    >
      <SeedMarker index={index} />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-ink-900 truncate">
          {task.description}
        </p>
        {(task.blockers || task.next_steps) && (
          <p className="text-sm text-ink-500 mt-0.5 truncate">
            {task.blockers && task.blockers !== 'none' && `⚠ ${task.blockers}`}
            {task.blockers && task.blockers !== 'none' && task.next_steps ? ' · ' : ''}
            {task.next_steps && `next: ${task.next_steps}`}
          </p>
        )}
      </div>
      <span className="font-display italic text-md text-ink-700 flex-shrink-0">
        {formatDuration(hoursToSeconds(task.hours))}
      </span>
    </button>
  );
}
