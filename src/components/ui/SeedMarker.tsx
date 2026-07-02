import { cn } from '@/lib/utils';

interface Props {
  index: number;
  className?: string;
}

/**
 * Three seed variants cycle by index — each has its own shape and color
 * so a list of tasks has visual variety without any single one dominating.
 * The label (a, b, c…) comes from the index.
 */
const variants = [
  {
    // clay droplet — teardrop
    bg: 'bg-clay-500',
    text: 'text-clay-900',
    borderRadius: 'var(--radius-seed-a)',
    transform: '',
  },
  {
    // olive circle rotated
    bg: 'bg-olive-500',
    text: 'text-olive-700',
    borderRadius: 'var(--radius-seed-b)',
    transform: 'rotate(45deg)',
  },
  {
    // ochre reverse teardrop
    bg: 'bg-ochre-500',
    text: 'text-ochre-700',
    borderRadius: 'var(--radius-seed-c)',
    transform: '',
  },
];

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export function SeedMarker({ index, className }: Props) {
  const v = variants[index % variants.length];
  const letter = LETTERS[index % LETTERS.length];
  const rotated = v.transform !== '';

  return (
    <div
      className={cn(
        'flex h-7 w-7 flex-shrink-0 items-center justify-center font-display text-xs font-semibold italic transition-transform duration-medium ease-spring group-hover:scale-110',
        v.bg,
        v.text,
        className,
      )}
      style={{ borderRadius: v.borderRadius, transform: v.transform }}
      aria-hidden="true"
    >
      <span style={{ transform: rotated ? 'rotate(-45deg)' : undefined, display: 'block', lineHeight: 1 }}>
        {letter}
      </span>
    </div>
  );
}
