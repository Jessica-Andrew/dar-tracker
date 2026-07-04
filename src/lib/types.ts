import type { Tables } from './database.types';

export type TaskSource = 'manual' | 'clockify' | 'merged';

// The DB stores `source` as a plain text column, so Supabase's generated
// type sees it as `string`. We know the actual constraint is one of three
// values, so we narrow it here rather than losing that safety.
export type Task = Omit<Tables<'tasks'>, 'source'> & { source: TaskSource };

export type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type ClockifyConfig = Tables<'clockify_config'>;