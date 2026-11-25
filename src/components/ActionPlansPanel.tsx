import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Archive, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useActionPlans } from '@/lib/hooks/useActionPlans';
import type { ActionPlan, Note } from '@/lib/types';

const VISIBLE_UPDATES = 2;

interface PlanCardProps {
  plan: ActionPlan;
  updates: Note[];
  dateKey: string;
  onAddProgress: (planId: string, date: string, text: string) => Promise<void>;
  onDeleteProgress: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

function PlanCard({
  plan,
  updates,
  dateKey,
  onAddProgress,
  onDeleteProgress,
  onArchive,
}: PlanCardProps) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const visible = expanded ? updates : updates.slice(0, VISIBLE_UPDATES);

  const handleAdd = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await onAddProgress(plan.id, dateKey, text.trim());
      setText('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t-[1.5px] border-parchment-400 py-3 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 break-words text-sm font-medium text-ink-900">
          {plan.title}
        </p>
        <button
          onClick={() => void onArchive(plan.id)}
          aria-label="Archive action plan"
          title="Archive"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors duration-quick hover:bg-parchment-300 hover:text-clay-500"
        >
          <Archive size={14} />
        </button>
      </div>

      {visible.map((n) => (
        <div key={n.id} className="group mt-2 flex items-start gap-2 pl-3">
          <p className="w-12 flex-shrink-0 font-display text-xs italic text-ink-500">
            {format(parseISO(n.date), 'd MMM')}
          </p>
          <p className="min-w-0 flex-1 break-words text-sm text-ink-700">{n.text}</p>
          <button
            onClick={() => void onDeleteProgress(n.id)}
            aria-label="Delete update"
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-ink-300 opacity-0 transition-opacity duration-quick hover:text-clay-500 group-hover:opacity-100"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      {updates.length > VISIBLE_UPDATES && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 pl-3 font-display text-xs italic text-clay-500 hover:text-clay-600"
        >
          {expanded ? 'show fewer' : `show all ${updates.length} updates`}
        </button>
      )}

      <div className="mt-2 flex items-end gap-2 pl-3">
        <div className="flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd();
            }}
            placeholder="progress update"
          />
        </div>
        <Button
          onClick={() => void handleAdd()}
          disabled={saving || !text.trim()}
          variant="ghost"
          size="sm"
        >
          add
        </Button>
      </div>
    </div>
  );
}

interface Props {
  dateKey: string;
}

export function ActionPlansPanel({ dateKey }: Props) {
  const { plans, progress, addPlan, archivePlan, addProgress, deleteProgress } =
    useActionPlans();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlan = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addPlan(title.trim());
      setTitle('');
    } catch {
      setError("Couldn't save that plan. Try again?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Action plans
      </p>
      <div className="rounded-2xl border border-parchment-400 bg-parchment-200 p-5">
        {plans.length === 0 ? (
          <p className="mb-4 font-display text-sm italic text-ink-500">
            no action plans yet
          </p>
        ) : (
          <div className="mb-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                updates={progress.filter((n) => n.action_plan_id === plan.id)}
                dateKey={dateKey}
                onAddProgress={addProgress}
                onDeleteProgress={deleteProgress}
                onArchive={archivePlan}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAddPlan();
              }}
              placeholder="new action plan"
            />
          </div>
          <Button
            onClick={() => void handleAddPlan()}
            disabled={saving || !title.trim()}
            size="sm"
          >
            add plan
          </Button>
        </div>
        {error && (
          <p className="mt-2 font-display text-sm italic text-danger-500">{error}</p>
        )}
      </div>
    </div>
  );
}