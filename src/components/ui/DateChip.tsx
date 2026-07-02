import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  date: Date;
  className?: string;
}

/**
 * The asymmetric day chip that appears on the header of every screen.
 * Radius is a signature — do not restyle.
 */
export function DateChip({ date, className }: Props) {
  return (
    <span
      className={cn(
        'inline-block bg-parchment-300 px-3.5 py-1.5 font-display text-sm italic text-ink-700',
        className,
      )}
      style={{ borderRadius: 'var(--radius-daychip)' }}
    >
      {format(date, 'EEE · d MMM')}
    </span>
  );
}
