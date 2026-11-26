import { addMonths, format, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  // Always the first day of the month.
  month: Date;
  onChange: (month: Date) => void;
}

export function MonthPicker({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(subMonths(month, 1))}
        aria-label="Previous month"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
      >
        <ChevronLeft size={18} />
      </button>
      <span
        className="inline-block bg-parchment-300 px-4 py-2 font-display text-sm italic text-ink-900"
        style={{ borderRadius: 'var(--radius-daychip)' }}
      >
        {format(month, 'MMMM yyyy')}
      </span>
      <button
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Next month"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}