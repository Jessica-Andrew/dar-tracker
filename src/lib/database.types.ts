/**
 * Hand-written for now, matching the schema in ARCHITECTURE.md.
 * Once the Supabase project is provisioned, regenerate with:
 *   supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type TaskSource = 'manual' | 'clockify' | 'merged';

export interface Task {
  id: string;
  user_id: string;
  date: string; // ISO date YYYY-MM-DD
  description: string;
  hours: number;
  task_label: string | null;
  links: string | null;
  blockers: string | null;
  next_steps: string | null;
  source: TaskSource;
  created_at: string;
  updated_at: string;
}

export type NewTask = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface ClockifyConfig {
  user_id: string;
  workspace_id: string | null;
  clockify_user_id: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>;
      };
      clockify_config: {
        Row: ClockifyConfig;
        Insert: ClockifyConfig;
        Update: Partial<Omit<ClockifyConfig, 'user_id'>>;
      };
    };
  };
}
