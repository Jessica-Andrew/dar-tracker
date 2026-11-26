import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Section } from '@/lib/hooks/useSection';

const LINKS: { key: Section; label: string }[] = [
  { key: 'today', label: 'today' },
  { key: 'review', label: 'review' },
  { key: 'team', label: 'team' },
];

interface Props {
  section: Section;
  onNavigate: (section: Section) => void;
  onSignOut: () => void;
  // Shown before "sign out", for controls that belong to a section.
  trailing?: ReactNode;
}

export function SectionNav({ section, onNavigate, onSignOut, trailing }: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-5">
          <p className="font-display text-sm italic text-clay-500">tend</p>
          <nav className="hidden items-baseline gap-4 md:flex" aria-label="Sections">
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
        <div className="flex items-center gap-4 md:gap-6">
          {trailing}
          <button
            onClick={onSignOut}
            className="px-1 py-0.5 font-display text-xs italic text-ink-500 transition-colors duration-quick hover:text-clay-500"
          >
            sign out
          </button>
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-[1.5px] border-parchment-400 bg-parchment-200 px-3 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {LINKS.map((l) => (
          <button
            key={l.key}
            onClick={() => onNavigate(l.key)}
            aria-current={section === l.key ? 'page' : undefined}
            className={cn(
              'flex min-h-[56px] flex-1 items-center justify-center font-display text-base italic transition-colors duration-quick',
              section === l.key ? 'text-ink-900' : 'text-ink-700',
            )}
          >
            <span
              className={cn(
                'pb-1',
                section === l.key && 'border-b-2 border-clay-500',
              )}
            >
              {l.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}