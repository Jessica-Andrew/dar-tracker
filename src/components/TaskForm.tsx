import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalKicker } from '@/components/ui/Modal';
import { Input, FieldLabel } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { NewTask, Task } from '@/lib/database.types';

interface Props {
  task: Task | 'new' | null;
  onClose: () => void;
  onSave: (data: Omit<NewTask, 'source'>) => Promise<void>;
  onDelete: () => Promise<void>;
}

const emptyForm = {
  description: '',
  hours: '',
  task_label: '',
  links: '',
  blockers: '',
  next_steps: '',
};

export function TaskForm({ task, onClose, onSave, onDelete }: Props) {
  const isEdit = task !== null && task !== 'new';
  const isOpen = task !== null;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        description: task.description,
        hours: String(task.hours),
        task_label: task.task_label ?? '',
        links: task.links ?? '',
        blockers: task.blockers ?? '',
        next_steps: task.next_steps ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [task, isEdit]);

  const handleSave = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await onSave({
        description: form.description.trim(),
        hours: parseFloat(form.hours) || 0,
        task_label: form.task_label.trim() || null,
        links: form.links.trim() || null,
        blockers: form.blockers.trim() || null,
        next_steps: form.next_steps.trim() || null,
      });
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
            <FieldLabel>what did you work on?</FieldLabel>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="a short description"
              autoFocus
            />
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
              <FieldLabel>hours</FieldLabel>
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
            {isEdit ? 'save' : 'plant it'}
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
