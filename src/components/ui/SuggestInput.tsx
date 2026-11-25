import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_VISIBLE = 6;

function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-medium text-clay-600">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  autoFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Suggestions that contain what you typed, excluding an exact match
  // (nothing to suggest when you've already typed the full name).
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    return suggestions
      .filter((s) => {
        const key = s.toLowerCase();
        return key !== q && (q === '' || key.includes(q));
      })
      .slice(0, MAX_VISIBLE);
  }, [suggestions, value]);

  const showList = open && matches.length > 0;

  const pick = (s: string) => {
    onChange(s);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showList) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp' && showList) {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter' && showList) {
      e.preventDefault();
      pick(matches[active] ?? matches[0]);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
      />
      {showList && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-parchment-400 bg-parchment-100 py-1 shadow-lg"
        >
          {matches.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input keeps focus and the
              // blur handler doesn't close the list before the pick lands.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'cursor-pointer px-3 py-2 text-sm text-ink-700 transition-colors duration-quick',
                i === active && 'bg-parchment-300 text-ink-900',
              )}
            >
              <Highlighted text={s} query={value} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}