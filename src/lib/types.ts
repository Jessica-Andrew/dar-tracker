import type { Tables } from './database.types';

export type TaskSource = 'manual' | 'clockify' | 'merged';
export type TaskStatus = 'planned' | 'done';

// The DB stores source and status as plain text columns, so the generated
// types see them as string. We narrow them to the values actually allowed.
export type Task = Omit<Tables<'tasks'>, 'source' | 'status'> & {
  source: TaskSource;
  status: TaskStatus;
};

type OmittedOnCreate = 'id' | 'user_id' | 'created_at' | 'updated_at' | 'active_entry_id' | 'timer_started_at' | 'position' | 'outcome';

type NewTaskBase = Omit<Task, OmittedOnCreate>;

// Timer fields, position, and outcome are never required when creating a
// task. Position is computed by useDayTasks, and outcome is added later.
export type NewTask = NewTaskBase & {
  active_entry_id?: string | null;
  timer_started_at?: string | null;
  position?: number;
  outcome?: string | null;
};

export type ClockifyConfig = Tables<'clockify_config'>;

export type CompetencyKey =
  | 'delivery'
  | 'learning'
  | 'problem_solving'
  | 'focus'
  | 'alignment';

export const COMPETENCIES: { key: CompetencyKey; label: string }[] = [
  { key: 'delivery', label: 'Autonomous and Reliable Delivery' },
  { key: 'learning', label: 'Mastery and Continuous Learning' },
  { key: 'problem_solving', label: 'Problem Solving Instinct' },
  { key: 'focus', label: 'Focus and Time Leverage' },
  { key: 'alignment', label: 'Team Alignment' },
];

export type Note = Omit<Tables<'notes'>, 'competency'> & {
  competency: CompetencyKey | null;
};

export type ActionPlan = Tables<'action_plans'>;