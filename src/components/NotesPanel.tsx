import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotes } from '@/lib/hooks/useNotes';
import { COMPETENCIES } from '@/lib/types';
import type { CompetencyKey } from '@/lib/types';
import { cn } from '@/lib/utils';

const SHORT_LABELS: Record<CompetencyKey, string> = {
  delivery: 'delivery',
  learning: 'learning',
  problem_solving: 'problem solving',
  focus: 'focus',
  alignment: 'alignment',
};

interface Props {
  dateKey: string;
}

export function NotesPanel({ dateKey }: Props) {
  const { notes, addNote, deleteNote } = useNotes(dateKey);
  const [text, setText] = useState('');
  const [competency, setCompetency] = useState<CompetencyKey | null>(null);
  const [isKeyResult, setIsKeyResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addNote({ text: text.trim(), competency, is_key_result: isKeyResult });
      setText('');
      setCompetency(null);
      setIsKeyResult(false);
    } catch {
      setError("Couldn't save that note. Try again?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Notes for your GPR
      </p>
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAdd();
              }}
              placeholder="something worth remembering from today"
            />
          </div>
          <Button
            onClick={() => void handleAdd()}
            disabled={saving || !text.trim()}
            size="sm"
          >
            add
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {COMPETENCIES.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              onClick={() => setCompetency(competency === c.key ? null : c.key)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-display text-xs italic transition-colors duration-quick',
                competency === c.key
                  ? 'border-clay-500 bg-clay-500 text-parchment-100'
                  : 'border-parchment-500 text-ink-700 hover:bg-parchment-300',
              )}
            >
              {SHORT_LABELS[c.key]}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 font-display text-xs italic text-ink-700">
            <input
              type="checkbox"
              checked={isKeyResult}
              onChange={(e) => setIsKeyResult(e.target.checked)}
              className="accent-clay-500"
            />
            key result
          </label>
        </div>

        {error && (
          <p className="mt-2 font-display text-sm italic text-danger-500">{error}</p>
        )}

        <div className="mt-4">
          {notes.length === 0 ? (
            <p className="font-display text-sm italic text-ink-500">
              no notes for this day yet
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="group flex items-start gap-2 border-t-[1.5px] border-parchment-400 py-2 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-ink-900">{n.text}</p>
                  {(n.competency || n.is_key_result) && (
                    <p className="mt-0.5 font-display text-xs italic text-ink-500">
                      {[n.competency ? SHORT_LABELS[n.competency] : null, n.is_key_result ? 'key result' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => void deleteNote(n.id)}
                  aria-label="Delete note"
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-300 opacity-0 transition-opacity duration-quick hover:bg-parchment-300 hover:text-clay-500 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}