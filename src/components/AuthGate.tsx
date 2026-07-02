import { Github } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { GrainSurface } from '@/components/ui/GrainSurface';
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <GrainSurface className="rounded-2xl px-8 pt-14 pb-10 w-full max-w-md min-h-[500px] flex flex-col justify-between">
        {/* Ambient shapes */}
        <SunIllustration className="absolute top-8 right-9" />
        <div
          className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #C97F52 0%, transparent 70%)',
            opacity: 0.4,
          }}
        />

        <div className="relative">
          <p className="text-xs uppercase tracking-kicker text-ink-500">Daily record</p>
          <h1 className="mt-2 font-display text-3xl font-black leading-none text-ink-900">
            Tend to your
            <br />
            <em className="italic font-normal text-clay-500">day's work</em>
          </h1>
          <p className="mt-3.5 text-base leading-normal text-ink-700 max-w-[340px]">
            A small, quiet place to log what you did today — and hand it off to Slack in the shape your team expects.
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
            <p className="relative mt-3 font-display italic text-sm text-danger-500">
              {error}
            </p>
          )}
        </div>

        <p className="relative text-xs text-ink-500 mt-6 max-w-[340px] leading-normal">
          Signing in creates a private account tied to your GitHub identity. Only you can see the tasks you log here.
        </p>
      </GrainSurface>
    </div>
  );
}
