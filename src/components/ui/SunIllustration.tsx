import { cn } from '@/lib/utils';

interface Props {
  size?: number;
  className?: string;
}

export function SunIllustration({ size = 74, className }: Props) {
  return (
    <svg
      viewBox="0 0 74 74"
      width={size}
      height={size}
      role="img"
      aria-label="Sun"
      className={cn(className)}
    >
      <circle cx="37" cy="37" r="16" fill="var(--ochre-500, #D9A648)" />
      <g stroke="var(--clay-300, #C97F52)" strokeWidth="2.5" strokeLinecap="round">
        <line x1="37" y1="6" x2="37" y2="14" />
        <line x1="37" y1="60" x2="37" y2="68" />
        <line x1="6" y1="37" x2="14" y2="37" />
        <line x1="60" y1="37" x2="68" y2="37" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="53" y1="53" x2="59" y2="59" />
        <line x1="15" y1="59" x2="21" y2="53" />
        <line x1="53" y1="21" x2="59" y2="15" />
      </g>
    </svg>
  );
}
