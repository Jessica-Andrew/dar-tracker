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
      | 'forbidden'
      | 'proxy_misconfigured'
      | 'clockify_error',
    public detail?: string,
  ) {
    super(code);
    this.name = 'ClockifyError';
  }
}

async function fetchProxy<T>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown },
): Promise<T> {
  const headers = await authedHeaders();
  let resp: Response;
  try {
    resp = await fetch(base + path, {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    throw new ClockifyError('network', (e as Error).message);
  }

  if (resp.status === 401) {
    throw new ClockifyError('unauthorized');
  }
  if (resp.status === 403) {
    throw new ClockifyError('forbidden');
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
  // Local-time boundaries for the target day.
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

  // Fetch a wider window (1 day before → 1 day after) so we catch cross-midnight
  // entries. Clockify's API filters on end-time, but its UI groups by start-time —
  // we do the same grouping ourselves below.
  const fetchStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000);
  const fetchEnd = new Date(dayEnd.getTime() + 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    start: fetchStart.toISOString(),
    end: fetchEnd.toISOString(),
    hydrated: 'true',
    'page-size': '200',
  });
  const path = `/workspaces/${workspaceId}/user/${userId}/time-entries?${params.toString()}`;
  const raw = await fetchProxy<ClockifyTimeEntry[]>(path);

  return raw
    .filter((e) => {
      if (!e.timeInterval?.duration || !e.timeInterval?.start) return false;
      // Group by start time — matches Clockify's own daily grouping.
      const entryStart = new Date(e.timeInterval.start);
      return entryStart >= dayStart && entryStart <= dayEnd;
    })
    .map((e) => {
      const seconds = isoDurationToSeconds(e.timeInterval.duration!);
      return {
        id: e.id,
        description: e.description || '(no description)',
        project: e.project?.name ?? '',
        seconds,
        hours: seconds / 3600,
      };
    });
}

/**
 * Start a running timer in Clockify for the given description.
 * Returns the new time entry's id, which we store locally so we can
 * stop it later without having to ask Clockify "what's running?".
 */
export async function startTimer(
  workspaceId: string,
  description: string,
): Promise<{ id: string }> {
  const entry = await fetchProxy<{ id: string }>(
    `/workspaces/${workspaceId}/time-entries`,
    {
      method: 'POST',
      body: {
        start: new Date().toISOString(),
        description,
      },
    },
  );
  return { id: entry.id };
}

/**
 * Stop whatever timer is currently running for this user, and return
 * the duration that was recorded, in hours.
 */
export async function stopTimer(
  workspaceId: string,
  userId: string,
): Promise<{ hours: number }> {
  const entry = await fetchProxy<ClockifyTimeEntry>(
    `/workspaces/${workspaceId}/user/${userId}/time-entries`,
    {
      method: 'PATCH',
      body: { end: new Date().toISOString() },
    },
  );
  const seconds = entry.timeInterval.duration
    ? isoDurationToSeconds(entry.timeInterval.duration)
    : 0;
  return { hours: seconds / 3600 };
}