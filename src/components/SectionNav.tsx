import { cn } from '@/lib/utils';
import type { Section } from '@/lib/hooks/useSection';

const LINKS: { key: Section; label: string }[] = [
  { key: 'today', label: 'today' },
  { key: 'review', label: 'review' },
];

interface Props {
  section: Section;
  onNavigate: (section: Section) => void;
  onSignOut: () => void;
}

export function SectionNav({ section, onNavigate, onSignOut }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-5">
        <p className="font-display text-sm italic text-clay-500">tend</p>
        <nav className="flex items-baseline gap-4" aria-label="Sections">
          {LINKS.map((l) => (
            <button
              key={l.key}
              onClick={() => onNavigate(l.key)}
              aria-current={section === l.key ? 'page' : undefined}
              className={cn(
                'font-display text-sm italic transition-colors duration-quick',
                section === l.key
                  ? 'text-ink-900 underline decoration-clay-500 decoration-[1.5px] underline-offset-4'
                  : 'text-ink-500 hover:text-clay-500',
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
      <button
        onClick={onSignOut}
        className="font-display italic text-xs text-ink-500 hover:text-clay-500 transition-colors duration-quick px-1 py-0.5"
      >
        sign out
      </button>
    </div>
  );
}