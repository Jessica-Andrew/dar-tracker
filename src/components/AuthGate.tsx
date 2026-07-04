import { Github } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SunIllustration } from '@/components/ui/SunIllustration';
import { useAuth } from '@/lib/hooks/useAuth';

export function AuthGate() {
  const { signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGitHub();
      // Redirects — no further state change needed here
    } catch (e) {
      setError((e as Error).message || 'Something went wrong. Try again?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6">
      <div className="relative w-full max-w-[560px]">
        <SunIllustration size={72} className="absolute -top-4 right-2" />

        <p className="relative text-xs uppercase tracking-kicker text-ink-500">
          Daily record
        </p>
        <h1 className="relative mt-2 font-display text-4xl font-black leading-[0.95] text-ink-900">
          Tend to your
          <br />
          <em className="italic font-normal text-clay-500">day's work</em>
        </h1>
        <p className="mt-6 text-base leading-normal text-ink-700 max-w-[420px]">
          A small, quiet place to log what you did today. Hand it off to Slack in the shape your team expects.
        </p>

        <Button
          onClick={handleSignIn}
          disabled={loading}
          size="lg"
          className="mt-8"
        >
          <Github size={20} aria-hidden="true" />
          {loading ? 'taking you to GitHub…' : 'continue with GitHub'}
        </Button>

        {error && (
          <p className="mt-3 font-display italic text-sm text-danger-500">
            {error}
          </p>
        )}

        <p className="mt-16 text-xs text-ink-500 leading-normal max-w-[380px]">
          Signing in creates a private account tied to your GitHub identity. Only you can see the tasks you log here.
        </p>
      </div>
    </div>
  );
}