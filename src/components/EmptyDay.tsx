import { Button } from '@/components/ui/Button';

interface Props {
  onPlantFirst: () => void;
  onImport: () => void;
}

function greetingForTimeOfDay(hour: number): string {
  if (hour < 12) return 'a quiet morning';
  if (hour < 17) return 'a quiet afternoon';
  return 'a quiet evening';
}

export function EmptyDay({ onPlantFirst, onImport }: Props) {
  const greeting = greetingForTimeOfDay(new Date().getHours());

  return (
    <div className="relative py-8">
      {/* Field illustration */}
      <svg
        viewBox="0 0 180 120"
        className="mx-auto mb-6 h-28 w-44"
        role="img"
        aria-label="An empty field with three furrows waiting to be planted"
      >
        <ellipse cx="90" cy="105" rx="80" ry="7" fill="var(--parchment-300)" />
        <path
          d="M20 88 Q90 78 160 88"
          stroke="var(--parchment-500)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M15 98 Q90 88 165 98"
          stroke="var(--parchment-500)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M10 108 Q90 98 170 108"
          stroke="var(--parchment-500)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Seeds resting on furrows */}
        <circle cx="40" cy="72" r="2" fill="var(--ink-500)" opacity="0.6" />
        <circle cx="65" cy="80" r="2" fill="var(--ink-500)" opacity="0.6" />
        <circle cx="120" cy="76" r="2" fill="var(--ink-500)" opacity="0.6" />
        <circle cx="55" cy="92" r="2" fill="var(--ink-500)" opacity="0.6" />
        <circle cx="105" cy="88" r="2" fill="var(--ink-500)" opacity="0.6" />
        <circle cx="135" cy="94" r="2" fill="var(--ink-500)" opacity="0.6" />
      </svg>

      <div className="text-center max-w-[320px] mx-auto">
        <p className="font-display italic text-lg text-ink-900 mb-1.5">{greeting}</p>
        <p className="text-sm text-ink-700 leading-normal mb-6">
          The field is fresh — nothing planted yet. Add your first task, or pull what you've already tracked in Clockify.
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <Button onClick={onPlantFirst}>
            <span className="text-lg leading-none">+</span>
            plant your first task
          </Button>
          <Button onClick={onImport} variant="ghost" size="sm">
            or import from Clockify
          </Button>
        </div>
      </div>
    </div>
  );
}
