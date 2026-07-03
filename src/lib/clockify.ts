import { supabase } from './supabase';
import { isoDurationToSeconds } from './duration';

const PROXY_URL = import.meta.env.VITE_CLOCKIFY_PROXY_URL;

if (!PROXY_URL) {
  throw new Error(
    'Missing VITE_CLOCKIFY_PROXY_URL. Copy .env.example to .env.local and fill it in.',
  );
}

const base = PROXY_URL.replace(/\/$/, '') + '/v1';

/**
 * Attach the current Supabase session JWT so the proxy can verify us.
 * If there's no active session we can't call Clockify at all — the
 * caller should have gated on auth first.
 */
async function authedHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ClockifyError('not_signed_in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export class ClockifyError extends Error {
  constructor(
    public code:
      | 'not_signed_in'
      | 'network'
      | 'unauthorized'
      | 'proxy_misconfigured'
      | 'clockify_error',
    public detail?: string,
  ) {
    super(code);
    this.name = 'ClockifyError';
  }
}

async function fetchProxy<T>(path: string): Promise<T> {
  const headers = await authedHeaders();
  let resp: Response;
  try {
    resp = await fetch(base + path, { headers });
  } catch (e) {
    throw new ClockifyError('network', (e as Error).message);
  }

  if (resp.status === 401) {
    throw new ClockifyError('unauthorized');
  }
  if (resp.status === 500) {
    const body = await resp.text().catch(() => '');
    throw new ClockifyError('proxy_misconfigured', body);
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new ClockifyError('clockify_error', `${resp.status}: ${body.slice(0, 200)}`);
  }
  return resp.json() as Promise<T>;
}

// ---------- Types ----------

interface ClockifyUser {
  id: string;
  defaultWorkspace: string;
}

interface ClockifyTimeEntry {
  id: string;
  description: string;
  project: { name: string } | null;
  timeInterval: {
    start: string;
    end: string | null;
    duration: string | null;
  };
}

export interface ClockifyEntry {
  id: string;
  description: string;
  project: string;
  seconds: number;
  hours: number;
}

// ---------- Public API ----------

export async function getCurrentUser(): Promise<ClockifyUser> {
  return fetchProxy<ClockifyUser>('/user');
}

export async function getEntriesForDate(
  workspaceId: string,
  userId: string,
  date: Date,
): Promise<ClockifyEntry[]> {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    hydrated: 'true',
    'page-size': '200',
  });
  const path = `/workspaces/${workspaceId}/user/${userId}/time-entries?${params.toString()}`;
  const raw = await fetchProxy<ClockifyTimeEntry[]>(path);

  return raw
    .filter((e) => e.timeInterval?.duration)
    .map((e) => {
      const seconds = isoDurationToSeconds(e.timeInterval.duration);
      return {
        id: e.id,
        description: e.description || '(no description)',
        project: e.project?.name ?? '',
        seconds,
        hours: seconds / 3600,
      };
    });
}
