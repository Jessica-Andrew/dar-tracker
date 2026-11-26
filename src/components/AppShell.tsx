import { useCallback, useEffect, useRef, useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ActionPlansPanel } from '@/components/ActionPlansPanel';
import { DayView } from '@/components/DayView';
import { FeedbackPanel } from '@/components/FeedbackPanel';
import { GprDigestPanel } from '@/components/GprDigestPanel';
import { NotesPanel } from '@/components/NotesPanel';
import { SectionNav } from '@/components/SectionNav';
import { SlackPreview } from '@/components/SlackPreview';
import { TeamLogPanel } from '@/components/TeamLogPanel';
import { WeekRollup } from '@/components/WeekRollup';
import { WeekSummaryCard } from '@/components/WeekSummaryCard';
import { useDayTasks } from '@/lib/hooks/useDayTasks';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSection } from '@/lib/hooks/useSection';
import { useSeedlingCarryOver } from '@/lib/hooks/useSeedlingCarryOver';

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function AppShell() {
  const [dateKey, setDateKey] = useState(todayKey());
  const date = new Date(dateKey + 'T00:00:00');
  const [plansVersion, setPlansVersion] = useState(0);

  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks, reload } = useDayTasks(dateKey);
  const { signOut } = useAuth();
  const { section, setSection } = useSection();

  const isViewingToday = dateKey === todayKey();

  const handleCarriedOver = useCallback(() => {
    if (isViewingToday) void reload();
  }, [isViewingToday, reload]);

  useSeedlingCarryOver(handleCarriedOver);

  // If the tab is left open across midnight, jump forward to the new
  // today, but only if you were actually looking at "today" when it
  // rolled over. If you had deliberately navigated to a past or future
  // day, coming back to the tab should not move you away from it.
  const lastKnownToday = useRef(todayKey());
  useEffect(() => {
    const checkForDayRollover = () => {
      if (document.visibilityState !== 'visible') return;
      const currentToday = todayKey();
      if (currentToday === lastKnownToday.current) return;

      const wasViewingToday = dateKey === lastKnownToday.current;
      lastKnownToday.current = currentToday;
      if (wasViewingToday) {
        setDateKey(currentToday);
      }
    };

    document.addEventListener('visibilitychange', checkForDayRollover);
    window.addEventListener('focus', checkForDayRollover);
    return () => {
      document.removeEventListener('visibilitychange', checkForDayRollover);
      window.removeEventListener('focus', checkForDayRollover);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const goPrev = () => setDateKey(format(subDays(date, 1), 'yyyy-MM-dd'));
  const goNext = () => setDateKey(format(addDays(date, 1), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen p-4 md:px-10 md:py-6">
      <div className="mx-auto max-w-[1160px] space-y-6">
        <SectionNav
          section={section}
          onNavigate={setSection}
          onSignOut={() => void signOut()}
        />

        {/* Today stays mounted (only hidden) on other sections, so a running
            timer keeps ticking and the tab title and favicon keep updating. */}
        <div className={section === 'today' ? 'flex flex-wrap items-start gap-8' : 'hidden'}>
          <div className="min-w-0 flex-[999_1_560px]">
            <DayView
              date={date}
              tasks={tasks}
              loading={loading}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              reorderTasks={reorderTasks}
              onPrev={goPrev}
              onNext={goNext}
              onDateSelect={setDateKey}
            />
          </div>
          <div className="min-w-0 max-w-[400px] flex-[1_1_340px] space-y-5 lg:sticky lg:top-6">
            <SlackPreview tasks={tasks} date={date} />
            <NotesPanel dateKey={dateKey} />
            <WeekSummaryCard
              date={date}
              dayTasks={tasks}
              onOpenReview={() => setSection('review')}
            />
          </div>
        </div>

        {section === 'review' && (
          <div className="max-w-3xl space-y-6">
            <WeekRollup date={date} />
            <FeedbackPanel
              defaultMonth={new Date()}
              onPlanCreated={() => setPlansVersion((v) => v + 1)}
            />
            <ActionPlansPanel key={plansVersion} dateKey={todayKey()} />
            <GprDigestPanel date={date} />
          </div>
        )}

        {section === 'team' && (
          <div className="max-w-3xl space-y-6">
            <TeamLogPanel defaultMonth={new Date()} />
          </div>
        )}
      </div>
    </div>
  );
}