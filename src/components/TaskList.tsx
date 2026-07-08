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
import { GripVertical } from 'lucide-react';
import { SeedMarker } from '@/components/ui/SeedMarker';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onReorder }: Props) {
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
      {/* Select / cancel affordance — small editorial link, top-right */}
      <div className="flex justify-end -mb-1">
        <button
          onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
          className="font-display italic text-xs text-ink-500 hover:text-clay-500 transition-colors duration-quick px-1 py-0.5"
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
              onActivate={() =>
                selectMode ? toggleSelect(task.id) : onEdit(task)
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Bulk action bar — shows only when items are selected */}
      {selectMode && count > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-parchment-300 px-4 py-2.5 border border-parchment-400">
          {confirming ? (
            <>
              <span className="font-display italic text-sm text-ink-900">
                uproot {count} task{count === 1 ? '' : 's'}?
              </span>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs text-ink-500 hover:text-ink-700 transition-colors duration-quick"
                >
                  cancel
                </button>
                <button
                  onClick={handleUproot}
                  className="text-xs font-medium uppercase tracking-wider text-clay-700 hover:text-clay-900 transition-colors duration-quick"
                >
                  yes, uproot
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm text-ink-700">
                {count} selected
              </span>
              <button
                onClick={() => setConfirming(true)}
                className="font-display italic text-sm text-clay-700 hover:text-clay-900 transition-colors duration-quick"
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
}

function TaskItem({ task, index, selectMode, selected, onActivate }: ItemProps) {
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
      className={`group flex w-full items-center gap-2 border-b-[1.5px] border-parchment-400 py-3 last:border-b-0 animate-task-in ${
        isDragging ? 'opacity-60 bg-parchment-200 rounded-md' : ''
      }`}
    >
      {!selectMode && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab touch-none text-ink-300 opacity-0 transition-opacity duration-quick hover:text-ink-500 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      )}
      <button onClick={onActivate} className="flex flex-1 min-w-0 items-center gap-3 text-left">
        {selectMode ? (
          <Checkbox checked={selected} />
        ) : (
          <SeedMarker index={index} />
        )}
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
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-quick ${
        checked
          ? 'border-clay-500 bg-clay-500'
          : 'border-ink-500 bg-transparent'
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