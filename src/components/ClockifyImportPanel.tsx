import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalKicker } from '@/components/ui/Modal';
import { Input, FieldLabel } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DateChip } from '@/components/ui/DateChip';
import { formatDuration } from '@/lib/duration';
import { getCurrentUser, getEntriesForDate, ClockifyError } from '@/lib/clockify';
import { useClockifyConfig } from '@/lib/hooks/useClockifyConfig';
import type { ClockifyEntry } from '@/lib/clockify';

interface Props {
  open: boolean;
  onClose: () => void;
  date: Date;
  onImport: (entries: ClockifyEntry[], mergeName?: string) => Promise<void>;
}

export function ClockifyImportPanel({ open, onClose, date, onImport }: Props) {
  const { config, saveConfig } = useClockifyConfig();
  const [entries, setEntries] = useState<ClockifyEntry[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergePromptOpen, setMergePromptOpen] = useState(false);
  const [mergeName, setMergeName] = useState('Meetings');

  useEffect(() => {
    if (!open) return;
    void fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      let workspaceId = config?.workspace_id;
      let clockifyUserId = config?.clockify_user_id;

      if (!workspaceId || !clockifyUserId) {
        const user = await getCurrentUser();
        workspaceId = user.defaultWorkspace;
        clockifyUserId = user.id;
        await saveConfig({
          workspace_id: workspaceId,
          clockify_user_id: clockifyUserId,
        });
      }

      const result = await getEntriesForDate(workspaceId, clockifyUserId, date);
      setEntries(result);
      setChecked(Object.fromEntries(result.map((e) => [e.id, true])));
    } catch (e) {
      if (e instanceof ClockifyError) {
        setError(errorMessage(e));
      } else {
        setError('Something went wrong. Try again?');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedEntries = entries.filter((e) => checked[e.id]);
  const allChecked = entries.length > 0 && entries.every((e) => checked[e.id]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(entries.map((e) => [e.id, next])));
  };

  const handlePlant = async () => {
    if (selectedEntries.length === 0) return;
    await onImport(selectedEntries);
  };

  const openMergePrompt = () => {
    if (selectedEntries.length === 0) return;
    // Suggest a smart default based on what's selected
    const projects = new Set(selectedEntries.map((e) => e.project).filter(Boolean));
    if (projects.size === 1) {
      setMergeName([...projects][0]);
    } else if (selectedEntries.every((e) => /meeting|standup|sync/i.test(e.description))) {
      setMergeName('Meetings');
    } else {
      setMergeName('Meetings');
    }
    setMergePromptOpen(true);
  };

  const confirmMerge = async () => {
    const name = mergeName.trim() || 'Meetings';
    setMergePromptOpen(false);
    await onImport(selectedEntries, name);
  };

  return (
    <>
      <Modal open={open} onOpenChange={(o) => !o && onClose()}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <div className="flex items-start justify-between">
              <div>
                <ModalKicker>Import</ModalKicker>
                <ModalTitle>
                  Gather from <em className="italic font-normal text-clay-500">Clockify</em>
                </ModalTitle>
              </div>
              <DateChip date={date} />
            </div>
          </ModalHeader>

          {loading && (
            <p className="font-display italic text-sm text-ink-500 py-6 text-center">
              gathering entries…
            </p>
          )}

          {error && !loading && (
            <div className="py-4">
              <p className="text-sm text-danger-500 mb-3">{error}</p>
              <Button onClick={() => void fetchEntries()} size="sm">
                try again
              </Button>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <p className="font-display italic text-sm text-ink-500 py-6 text-center">
              nothing tracked in Clockify for this day
            </p>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              <div className="flex items-center justify-between border-b-[1.5px] border-parchment-400 pb-3 mb-1">
                <label className="flex items-center gap-2 font-display italic text-sm text-ink-700 cursor-pointer">
                  <Checkbox checked={allChecked} onChange={toggleAll} />
                  select all · {entries.length} entries
                </label>
                <div className="flex gap-1.5">
                  <Button onClick={openMergePrompt} variant="outline" size="sm">
                    merge as one
                  </Button>
                  <Button onClick={() => void handlePlant()} size="sm">
                    plant selected
                  </Button>
                </div>
              </div>

              <div className="space-y-0 relative">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2.5 py-2.5 border-b border-parchment-400 last:border-b-0"
                  >
                    <Checkbox
                      checked={!!checked[entry.id]}
                      onChange={() =>
                        setChecked({ ...checked, [entry.id]: !checked[entry.id] })
                      }
                    />
                    <div className="flex-1 min-w-0 text-sm text-ink-900 truncate">
                      {entry.project && (
                        <span className="font-display italic text-ink-500">
                          {entry.project} —{' '}
                        </span>
                      )}
                      {entry.description}
                    </div>
                    <span className="font-display italic text-sm text-ink-700 flex-shrink-0">
                      {formatDuration(entry.seconds)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Merge naming prompt */}
      <Modal open={mergePromptOpen} onOpenChange={setMergePromptOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalKicker>Merge</ModalKicker>
            <ModalTitle>
              Bundle into <em className="italic font-normal text-clay-500">one row</em>
            </ModalTitle>
          </ModalHeader>

          <p className="text-sm text-ink-700 mb-4 leading-normal">
            Combining {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} into a single task. What should we call it?
          </p>

          <FieldLabel>name for the combined task</FieldLabel>
          <Input
            value={mergeName}
            onChange={(e) => setMergeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void confirmMerge();
            }}
            autoFocus
            placeholder="Meetings"
          />

          <div className="flex items-center gap-2 mt-5">
            <Button onClick={() => void confirmMerge()} size="sm">
              plant it
            </Button>
            <Button onClick={() => setMergePromptOpen(false)} variant="ghost" size="sm">
              cancel
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-[15px] w-[15px] flex-shrink-0 rounded-sm border-[1.5px] transition-colors duration-quick focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 ${
        checked ? 'bg-clay-500 border-clay-500' : 'border-ink-500 bg-transparent'
      }`}
      role="checkbox"
      aria-checked={checked}
    >
      {checked && (
        <span
          className="absolute text-[color:var(--text-on-clay)] font-bold"
          style={{ top: '-3px', left: '1px', fontSize: '12px' }}
        >
          ✓
        </span>
      )}
    </button>
  );
}

function errorMessage(e: ClockifyError): string {
  switch (e.code) {
    case 'not_signed_in':
      return 'You need to be signed in to gather from Clockify.';
    case 'network':
      return "Couldn't reach the proxy. Check your connection and try again.";
    case 'unauthorized':
      return "The proxy rejected your session. Sign out and back in?";
    case 'proxy_misconfigured':
      return "The proxy isn't configured properly — check the val's environment variables.";
    case 'clockify_error':
      return `Clockify returned an error: ${e.detail ?? 'unknown'}.`;
  }
}