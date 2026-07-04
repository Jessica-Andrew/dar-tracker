import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/hooks/useAuth';

type Screen = 'loading' | 'auth' | 'app';

export default function App() {
  const { user, loading } = useAuth();
  const targetScreen: Screen = loading ? 'loading' : user ? 'app' : 'auth';

  const [renderedScreen, setRenderedScreen] = useState<Screen>(targetScreen);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (targetScreen === renderedScreen) return;

    // Fade the current screen out, then swap content and fade the new one in.
    setVisible(false);
    const timeout = setTimeout(() => {
      setRenderedScreen(targetScreen);
      setVisible(true);
    }, 250); // matches duration-base below

    return () => clearTimeout(timeout);
  }, [targetScreen, renderedScreen]);

  const content =
    renderedScreen === 'loading' ? (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-500 font-display italic">a moment…</p>
      </div>
    ) : renderedScreen === 'auth' ? (
      <AuthGate />
    ) : (
      <AppShell />
    );

  return (
    <div
      className={`transition-opacity duration-base ease-standard ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {content}
    </div>
  );
}