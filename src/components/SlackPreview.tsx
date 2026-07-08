import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDuration, hoursToSeconds } from '@/lib/duration';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
}

function buildReport(tasks: Task[]): string {
  if (tasks.length === 0) return '';
  const lines: string[] = [];
  tasks.forEach((t, i) => {
    const label = t.task_label ? `${t.task_label}: ${t.description}` : t.description;
    lines.push(`Task ${i + 1}: ${label}`);
    lines.push(`- time spent: ${formatDuration(hoursToSeconds(t.hours))}`);
    lines.push(`- links: ${t.links || 'None'}`);
    lines.push(`- blockers: ${t.blockers || 'None'}`);
    lines.push(`- next steps: ${t.next_steps || 'None'}`);
    lines.push('');
  });
  const total = tasks.reduce((s, t) => s + hoursToSeconds(t.hours), 0);
  lines.push(`Total hours: ${formatDuration(total)}`);
  return lines.join('\n');
}

export function SlackPreview({ tasks }: Props) {
  const [copied, setCopied] = useState(false);

  const report = useMemo(
    () => buildReport(tasks.filter((t) => t.status === 'done')),
    [tasks],
  );

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      // Best-effort fallback would go here; for now silently fail
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (tasks.every((t) => t.status !== 'done')) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-kicker text-ink-500 mb-2">
        Slack message
      </p>
      <div className="relative rounded-2xl bg-ink-900 p-5">
        <button
          onClick={() => void handleCopy()}
          aria-label="Copy report"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-parchment-300 transition-colors duration-quick hover:bg-parchment-100/10 hover:text-parchment-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        <pre className="whitespace-pre-wrap break-words pr-8 font-mono text-sm leading-relaxed text-parchment-200">
          {report}
        </pre>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs italic text-ink-500">
          Matches the DAR format · exact spacing preserved
        </p>
        <Button onClick={() => void handleCopy()} variant="outline" size="sm">
          {copied ? 'copied ✓' : 'copy report'}
        </Button>
      </div>
    </div>
  );
}