import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalKicker } from '@/components/ui/Modal';
import { Input, FieldLabel } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import type { NewTask, Task } from '@/lib/types';

interface Props {
  task: Task | 'new' | null;
  currentDate: string;
  onClose: () => void;
  onSave: (data: Omit<NewTask, 'source'>) => Promise<void>;
  onDelete: () => Promise<void>;
}

const emptyForm = {
  description: '',
  date: '',
  hoursH: '',
  hoursM: '',
  task_label: '',
  links: '',
  blockers: '',
  next_steps: '',
};

export function TaskForm({ task, currentDate, onClose, onSave, onDelete }: Props) {
  const isEdit = task !== null && task !== 'new';
  const isOpen = task !== null;
  const isRunning = isEdit && !!task.active_entry_id;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const totalMinutes = Math.round(task.hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      setForm({
        description: task.description,
        date: task.date,
        hoursH: task.hours > 0 ? String(h) : '',
        hoursM: task.hours > 0 ? String(m) : '',
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
  // task. Editing never changes status through this form.
  const isPlanning = !isEdit && !form.hoursH.trim() && !form.hoursM.trim();

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      const h = parseInt(form.hoursH, 10) || 0;
      const m = parseInt(form.hoursM, 10) || 0;
      const totalHours = Math.round((h + m / 60) * 100) / 100;

      const base = {
        description: form.description.trim(),
        date: form.date,
        hours: totalHours,
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

          <div className="grid grid-cols-[1fr_100px_74px] gap-3">
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
              <div className="flex items-center gap-1">
                <div className="w-9">
                  <Input
                    mono
                    value={form.hoursH}
                    onChange={(e) => setForm({ ...form, hoursH: e.target.value })}
                    placeholder="1"
                    inputMode="numeric"
                    className="text-center"
                  />
                </div>
                <span className="text-xs text-ink-500 flex-shrink-0">h</span>
                <div className="w-9">
                  <Input
                    mono
                    value={form.hoursM}
                    onChange={(e) => setForm({ ...form, hoursM: e.target.value })}
                    placeholder="30"
                    inputMode="numeric"
                    className="text-center"
                  />
                </div>
                <span className="text-xs text-ink-500 flex-shrink-0">m</span>
              </div>
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
