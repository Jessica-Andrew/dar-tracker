import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  // When true, the calendar renders through a portal into
  // document.body, positioned near the trigger — escapes any
  // ancestor with overflow-hidden (like GrainSurface's card, which
  // clips its own texture at rounded corners and would otherwise
  // clip the calendar too). Inline stays the default for contexts
  // like modals, which are already portaled and don't clip.
  floating?: boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const PANEL_WIDTH = 256; // matches w-64

export function DatePicker({ value, onChange, disabled, floating }: Props) {
  const selected = value ? parseISO(value) : new Date();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const gridStart = startOfWeek(startOfMonth(viewMonth));
  const gridEnd = endOfWeek(endOfMonth(viewMonth));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Position the floating panel just below the trigger, right-aligned
  // to it, in fixed viewport coordinates (not affected by scroll of
  // any ancestor since we're portaled to body).
  useLayoutEffect(() => {
    if (!floating || !open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, [floating, open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) setOpen(false);
    };
    // Close on scroll too, since a fixed-position portal won't track
    // the trigger's position as the page scrolls underneath it.
    const handleScroll = () => setOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) setViewMonth(startOfMonth(selected));
    setOpen((o) => !o);
  };

  const handlePick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const calendarBody = (
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
  );

  const monthHeader = (
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
  );

  return (
    <div ref={containerRef} className={floating ? undefined : 'relative'}>
      <button
        ref={triggerRef}
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

      {open && floating &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-50 rounded-lg border border-parchment-400 bg-parchment-100 p-3 shadow-lg"
            style={{ top: coords.top, right: coords.right, width: PANEL_WIDTH }}
          >
            {monthHeader}
            {calendarBody}
          </div>,
          document.body,
        )}

      {open && !floating && (
        <div className="mt-2 rounded-lg border border-parchment-400 bg-parchment-100 p-3 shadow-card">
          {monthHeader}
          {calendarBody}
        </div>
      )}
    </div>
  );
}