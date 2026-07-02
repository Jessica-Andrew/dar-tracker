import { AuthGate } from '@/components/AuthGate';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/hooks/useAuth';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-500 font-display italic">a moment…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  return <AppShell />;
}
