import { addDays, endOfMonth, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { hoursToSeconds } from '@/lib/duration';
import { buildWeekRollup, formatGprDuration } from '@/lib/gpr';
import { COMPETENCIES } from '@/lib/types';
import type { ActionPlan, Feedback, Note, Task } from '@/lib/types';

interface DigestInput {
  month: Date;
  tasks: Task[];
  notes: Note[];
  plans: ActionPlan[];
  feedback: Feedback[];
}

const SOURCE_LABELS: Record<string, string> = { ceo: 'CEO', hr: 'HR', other: 'Other' };

function short(dateKey: string): string {
  return format(parseISO(dateKey), 'MMM dd');
}

function areaLabel(f: Feedback): string {
  if (f.area === 'overall') return 'Overall';
  if (f.area === 'work_product') {
    return f.subject ? `Work product (${f.subject})` : 'Work product';
  }
  return COMPETENCIES.find((c) => c.key === f.area)?.label ?? f.area;
}

export function buildDigest({ month, tasks, notes, plans, feedback }: DigestInput): string {
  const lines: string[] = [];
  const monthStartKey = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEndKey = format(endOfMonth(month), 'yyyy-MM-dd');

  lines.push(`GPR DIGEST: ${format(month, 'MMMM yyyy')}`);
  lines.push('');

  // Month summary
  const totalSeconds = tasks.reduce((sum, t) => sum + hoursToSeconds(t.hours), 0);
  const trackedDays = new Set(tasks.map((t) => t.date)).size;
  lines.push('MONTH SUMMARY');
  lines.push(`Total tracked: ${formatGprDuration(totalSeconds)}`);
  if (trackedDays > 0) {
    lines.push(`Days with tracked work: ${trackedDays}`);
    lines.push(`Average per tracked day: ${formatGprDuration(totalSeconds / trackedDays)}`);
  }
  lines.push('');

  // Section 2: weekly work products and outcomes
  lines.push('SECTION 2: WORK PRODUCTS BY WEEK');
  let weekNumber = 0;
  let cursor = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const monthEnd = endOfMonth(month);
  while (cursor <= monthEnd) {
    const rawStart = format(cursor, 'yyyy-MM-dd');
    const rawEnd = format(addDays(cursor, 6), 'yyyy-MM-dd');
    const weekStartKey = rawStart < monthStartKey ? monthStartKey : rawStart;
    const weekEndKey = rawEnd > monthEndKey ? monthEndKey : rawEnd;

    const weekTasks = tasks.filter((t) => t.date >= weekStartKey && t.date <= weekEndKey);
    const rollup = buildWeekRollup(weekTasks);
    if (rollup) {
      weekNumber += 1;
      lines.push('');
      lines.push(`Week ${weekNumber} (${rollup.range}), total ${rollup.total}`);
      lines.push(`Work products: ${rollup.workProducts}`);
      const withOutcomes = weekTasks
        .filter((t) => !!t.outcome)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (withOutcomes.length > 0) {
        lines.push('Outcomes:');
        for (const t of withOutcomes) {
          lines.push(`- ${t.description} (${short(t.date)}): ${t.outcome}`);
        }
      }
    }
    cursor = addDays(cursor, 7);
  }
  if (weekNumber === 0) lines.push('No finished tasks this month.');
  lines.push('');

  // Key results
  lines.push('SECTION 2.5: KEY RESULTS (notes flagged as key result)');
  const keyResults = notes.filter((n) => n.is_key_result);
  if (keyResults.length === 0) lines.push('(none logged)');
  for (const n of keyResults) lines.push(`- (${short(n.date)}) ${n.text}`);
  lines.push('');

  // Competency evidence
  lines.push('SECTION 3: COMPETENCY EVIDENCE');
  for (const c of COMPETENCIES) {
    lines.push('');
    lines.push(c.label);
    const evidence = notes.filter((n) => n.competency === c.key);
    if (evidence.length === 0) lines.push('(none logged)');
    for (const n of evidence) lines.push(`- (${short(n.date)}) ${n.text}`);
  }
  const otherNotes = notes.filter(
    (n) => !n.competency && !n.is_key_result && !n.action_plan_id,
  );
  if (otherNotes.length > 0) {
    lines.push('');
    lines.push('Other notes (untagged)');
    for (const n of otherNotes) lines.push(`- (${short(n.date)}) ${n.text}`);
  }
  lines.push('');

  // Blockers
  lines.push('BLOCKERS LOGGED ON FINISHED TASKS');
  const blocked = tasks
    .filter((t) => {
      const b = t.blockers?.trim().toLowerCase();
      return !!b && b !== 'none' && b !== 'n/a';
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (blocked.length === 0) lines.push('(none logged)');
  for (const t of blocked) {
    lines.push(`- (${short(t.date)}) ${t.description}: ${t.blockers}`);
  }
  lines.push('');

  // Action plans
  lines.push('SECTION 4: ACTION PLANS AND PROGRESS');
  const planUpdates = (planId: string) =>
    notes.filter((n) => n.action_plan_id === planId);
  const relevantPlans = plans.filter(
    (p) => !p.archived || planUpdates(p.id).length > 0,
  );
  if (relevantPlans.length === 0) lines.push('(no action plans)');
  for (const p of relevantPlans) {
    lines.push('');
    lines.push(p.title);
    const updates = planUpdates(p.id);
    if (updates.length === 0) lines.push('(no updates this month)');
    for (const n of updates) lines.push(`- (${short(n.date)}) ${n.text}`);
  }
  lines.push('');

  // Review feedback (this month and the one before)
  lines.push('FEEDBACK FROM PERFORMANCE REVIEWS');
  if (feedback.length === 0) lines.push('(none logged)');
  const reviewMonths = Array.from(new Set(feedback.map((f) => f.review_month))).sort();
  for (const m of reviewMonths) {
    lines.push('');
    lines.push(`${format(parseISO(m), 'MMMM yyyy')} review`);
    for (const f of feedback.filter((x) => x.review_month === m)) {
      const parts = [SOURCE_LABELS[f.source] ?? f.source, areaLabel(f)];
      if (f.rating) parts.push(f.rating);
      lines.push(
        `- ${parts.join(' | ')}: ${f.comment}${f.needs_action ? ' (needs action)' : ''}`,
      );
    }
  }

  return lines.join('\n');
}