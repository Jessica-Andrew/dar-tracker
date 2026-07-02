import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { DayView } from '@/components/DayView';
import { SlackPreview } from '@/components/SlackPreview';

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function AppShell() {
  const [dateKey, setDateKey] = useState(todayKey());
  const date = new Date(dateKey + 'T00:00:00');

  const goPrev = () => setDateKey(format(subDays(date, 1), 'yyyy-MM-dd'));
  const goNext = () => setDateKey(format(addDays(date, 1), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <DayView date={date} dateKey={dateKey} onPrev={goPrev} onNext={goNext} />
        <SlackPreview dateKey={dateKey} />
      </div>
    </div>
  );
}
