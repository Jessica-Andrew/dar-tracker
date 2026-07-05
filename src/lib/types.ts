import type { Tables } from './database.types';

export type TaskSource = 'manual' | 'clockify' | 'merged';
export type TaskStatus = 'planned' | 'done';

// The DB stores `source` and `status` as plain text columns (with check
// constraints), so Supabase's generated types see them as `string`. We
// narrow them here to the values the constraints actually allow.
export type Task = Omit<Tables<'tasks'>, 'source' | 'status'> & {
  source: TaskSource;
  status: TaskStatus;
};

type NewTaskBase = Omit <
  Task,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'active_entry_id' | 'timer_started_at'
>;

// New tasks never start with a timer already running, so these two
// fields are optional on creation and default to null.
export type NewTask = NewTaskBase & {
  active_entry_id?: string | null;
  timer_started_at?: string | null;
};

export type ClockifyConfig = Tables<'clockify_config'>;