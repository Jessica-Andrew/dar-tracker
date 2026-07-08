import { useState } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  disabled?: boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DatePicker({ value, onChange, disabled }: Props) {
  const selected = value ? parseISO(value) : new Date();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));

  const gridStart = startOfWeek(startOfMonth(viewMonth));
  const gridEnd = endOfWeek(endOfMonth(viewMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handleToggle = () => {
    if (disabled) return;
    if (!open) setViewMonth(startOfMonth(selected));
    setOpen((o) => !o);
  };

  const handlePick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 bg-parchment-300 px-3.5 py-1.5 font-display text-sm italic text-ink-700 transition-colors duration-quick',
          !disabled && 'hover:bg-parchment-400',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{ borderRadius: 'var(--radius-daychip)' }}
      >
        {format(selected, 'EEE · d MMM yyyy')}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-parchment-400 bg-parchment-100 p-3 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
              aria-label="Previous month"
            >
              ←
            </button>
            <p className="font-display text-sm font-black text-ink-900">
              {format(viewMonth, 'MMMM yyyy')}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-500 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((d, i) => (
              <span key={i} className="text-[10px] uppercase tracking-kicker text-ink-500">
                {d}
              </span>
            ))}
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSelected = isSameDay(day, selected);
              const isCurrentDay = isToday(day);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => handlePick(day)}
                  className={cn(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors duration-quick',
                    !inMonth && 'text-ink-300',
                    inMonth && !isSelected && 'text-ink-700 hover:bg-parchment-300',
                    isSelected && 'bg-clay-500 text-parchment-100 font-medium',
                    isCurrentDay && !isSelected && 'ring-1 ring-olive-500',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}