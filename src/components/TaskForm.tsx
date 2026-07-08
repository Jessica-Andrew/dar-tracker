import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalKicker } from '@/components/ui/Modal';
import { Input, FieldLabel } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import type { NewTask, Task } from '@/lib/types';

interface Props {
  task: Task | 'new' | null;
  // The day currently being viewed — used as the default date when
  // planting a brand new task.
  currentDate: string;
  onClose: () => void;
  onSave: (data: Omit<NewTask, 'source'>) => Promise<void>;
  onDelete: () => Promise<void>;
}

const emptyForm = {
  description: '',
  date: '',
  hours: '',
  task_label: '',
  links: '',
  blockers: '',
  next_steps: '',
};

export function TaskForm({ task, currentDate, onClose, onSave, onDelete }: Props) {
  const isEdit = task !== null && task !== 'new';
  const isOpen = task !== null;
  // A running timer is mid-session against a specific day — changing
  // the date out from under it would blur what actually happened.
  const isRunning = isEdit && !!task.active_entry_id;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        description: task.description,
        date: task.date,
        hours: task.hours > 0 ? String(task.hours) : '',
        task_label: task.task_label ?? '',
        links: task.links ?? '',
        blockers: task.blockers ?? '',
        next_steps: task.next_steps ?? '',
      });
    } else if (task === 'new') {
      setForm({ ...emptyForm, date: currentDate });
    } else {
      setForm(emptyForm);
    }
  }, [task, isEdit, currentDate]);

  // Hours are only the planned/done signal when creating a brand new
  // task. Editing never changes status through this form — pausing a
  // timed task can leave it with real hours while still a seedling,
  // and opening the form to tweak a field shouldn't silently finish
  // it. Status only changes via the explicit finish action.
  const isPlanning = !isEdit && !form.hours.trim();

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      const base = {
        description: form.description.trim(),
        date: form.date,
        hours: parseFloat(form.hours) || 0,
        task_label: form.task_label.trim() || null,
        links: form.links.trim() || null,
        blockers: form.blockers.trim() || null,
        next_steps: form.next_steps.trim() || null,
      };
      await onSave(
        isEdit
          ? { ...base, status: task.status }
          : { ...base, status: isPlanning ? 'planned' : 'done' },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalKicker>{isEdit ? 'Editing' : 'New'}</ModalKicker>
          <ModalTitle>
            {isEdit ? (
              <>Tend to <em className="italic font-normal text-clay-500">this row</em></>
            ) : (
              <>Plant a <em className="italic font-normal text-clay-500">task</em></>
            )}
          </ModalTitle>
        </ModalHeader>

        <div className="space-y-3">
          <div>
            <FieldLabel>what are you working on?</FieldLabel>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="a short description"
              autoFocus
            />
          </div>

          <div>
            <FieldLabel>date</FieldLabel>
            <DatePicker
              value={form.date}
              onChange={(date) => setForm({ ...form, date })}
              disabled={isRunning}
            />
            {isRunning && (
              <p className="mt-1 text-xs italic text-ink-500">
                pause the timer to change the date
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_74px_74px] gap-3">
            <div>
              <FieldLabel optional>links</FieldLabel>
              <Input
                value={form.links}
                onChange={(e) => setForm({ ...form, links: e.target.value })}
                placeholder="figma, PR, doc…"
              />
            </div>
            <div>
              <FieldLabel optional="later">hours</FieldLabel>
              <Input
                mono
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="1.5"
                inputMode="decimal"
              />
            </div>
            <div>
              <FieldLabel optional="opt">tag</FieldLabel>
              <Input
                mono
                value={form.task_label}
                onChange={(e) => setForm({ ...form, task_label: e.target.value })}
                placeholder="DS-014"
              />
            </div>
          </div>

          <div>
            <FieldLabel optional="if any">blockers</FieldLabel>
            <Input
              value={form.blockers}
              onChange={(e) => setForm({ ...form, blockers: e.target.value })}
              placeholder="none"
            />
          </div>

          <div>
            <FieldLabel optional>next steps</FieldLabel>
            <Input
              value={form.next_steps}
              onChange={(e) => setForm({ ...form, next_steps: e.target.value })}
              placeholder="share with Jessica for review"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <Button onClick={handleSave} disabled={saving || !form.description.trim()} size="sm">
            {isEdit ? 'save' : isPlanning ? 'sow it' : 'plant it'}
          </Button>
          <Button onClick={onClose} variant="ghost" size="sm">
            cancel
          </Button>
          {isEdit && (
            <Button
              onClick={() => void onDelete()}
              variant="danger"
              size="sm"
              className="ml-auto"
            >
              uproot
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}