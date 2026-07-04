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