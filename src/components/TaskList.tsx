import { useState } from 'react';
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
import { GripVertical, MoreHorizontal, RotateCcw } from 'lucide-react';
import { SeedMarker } from '@/components/ui/SeedMarker';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onReopen: (id: string) => void;
  // Opens the task menu sheet. Shown as a "more" button on phones.
  onMore: (task: Task) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onReorder, onReopen, onMore }: Props) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a small drag distance before activating, so a plain
      // tap (to open the edit form) doesn't get swallowed as a drag.
      activationConstraint: { distance: 6 },
    }),
  );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirming(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUproot = () => {
    for (const id of selectedIds) onDelete(id);
    exitSelectMode();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  };

  const count = selectedIds.size;

  return (
    <div className="relative">
      {/* Select / cancel affordance, a small editorial link at the top right */}
      <div className="-mb-1 flex justify-end">
        <button
          onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
          className="min-h-[44px] px-2 font-display text-sm italic text-ink-700 transition-colors duration-quick hover:text-clay-600 md:min-h-0 md:px-1 md:py-0.5 md:text-xs"
        >
          {selectMode ? 'cancel' : 'select'}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, i) => (
            <TaskItem
              key={task.id}
              task={task}
              index={i}
              selectMode={selectMode}
              selected={selectedIds.has(task.id)}
              onActivate={() => (selectMode ? toggleSelect(task.id) : onEdit(task))}
              onReopen={() => onReopen(task.id)}
              onMore={() => onMore(task)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Bulk action bar, shown only when items are selected */}
      {selectMode && count > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-parchment-400 bg-parchment-300 px-4 py-2.5">
          {confirming ? (
            <>
              <span className="font-display text-sm italic text-ink-900">
                uproot {count} task{count === 1 ? '' : 's'}?
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setConfirming(false)}
                  className="min-h-[44px] text-xs text-ink-700 transition-colors duration-quick hover:text-ink-900 md:min-h-0"
                >
                  cancel
                </button>
                <button
                  onClick={handleUproot}
                  className="min-h-[44px] text-xs font-medium uppercase tracking-wider text-clay-700 transition-colors duration-quick hover:text-clay-900 md:min-h-0"
                >
                  yes, uproot
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm text-ink-700">{count} selected</span>
              <button
                onClick={() => setConfirming(true)}
                className="min-h-[44px] font-display text-sm italic text-clay-700 transition-colors duration-quick hover:text-clay-900 md:min-h-0"
              >
                uproot
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  task: Task;
  index: number;
  selectMode: boolean;
  selected: boolean;
  onActivate: () => void;
  onReopen: () => void;
  onMore: () => void;
}

function TaskItem({
  task,
  index,
  selectMode,
  selected,
  onActivate,
  onReopen,
  onMore,
}: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: selectMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex w-full animate-task-in items-center gap-2 border-b-[1.5px] border-parchment-400 py-3 last:border-b-0 ${
        isDragging ? 'rounded-md bg-parchment-200 opacity-60' : ''
      }`}
    >
      {!selectMode && (
        <button
          {...attributes}
          {...listeners}
          className="hidden flex-shrink-0 cursor-grab touch-none text-ink-500 opacity-0 transition-opacity duration-quick hover:text-ink-700 group-hover:opacity-100 active:cursor-grabbing md:block"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      )}
      <button onClick={onActivate} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {selectMode ? <Checkbox checked={selected} /> : <SeedMarker index={index} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-ink-900">{task.description}</p>
          {(task.blockers || task.next_steps) && (
            <p className="mt-0.5 truncate text-sm text-ink-700">
              {task.blockers && task.blockers !== 'none' && `⚠ ${task.blockers}`}
              {task.blockers && task.blockers !== 'none' && task.next_steps ? ' · ' : ''}
              {task.next_steps && `next: ${task.next_steps}`}
            </p>
          )}
        </div>
        <span className="text-md flex-shrink-0 font-display italic text-ink-700">
          {formatDuration(hoursToSeconds(task.hours))}
        </span>
      </button>
      {!selectMode && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReopen();
            }}
            aria-label="Reopen as seedling"
            title="Reopen as seedling"
            className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-ink-500 opacity-0 transition-opacity duration-quick hover:bg-parchment-300 hover:text-clay-500 group-hover:opacity-100 md:flex"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onMore}
            aria-label="More actions"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 md:hidden"
          >
            <MoreHorizontal size={20} />
          </button>
        </>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-quick ${
        checked ? 'border-clay-500 bg-clay-500' : 'border-ink-500 bg-transparent'
      }`}
    >
      {checked && (
        <svg
          viewBox="0 0 10 10"
          fill="none"
          className="h-2 w-2"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 5.5 L4 7.5 L8 3" />
        </svg>
      )}
    </span>
  );
}