'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp, useSession } from '@/lib/auth-client';
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Timer,
  Trophy,
  ArrowRight,
  Loader2,
  Play,
  CloudOff,
  Lock,
  Smartphone,
} from 'lucide-react';

type Mode = 'signin' | 'signup';

const TICKER = ['BARBELL BENCH PRESS', 'DEADLIFT', 'BACK SQUAT', 'OVERHEAD PRESS', 'PULL-UP', 'BARBELL ROW', 'DIPS', 'ROMANIAN DEADLIFT'];

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isSessionPending && session?.user) router.push('/dashboard');
  }, [session, isSessionPending, router]);

  const handleGoogle = async () => {
    try {
      setIsBusy(true);
      setError(null);
      const callbackURL = `${window.location.origin}/dashboard`;
      const res: any = await signIn.social({ provider: 'google', callbackURL });
      if (res?.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error(res?.error?.message || 'Google sign-in failed');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Try email below.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsBusy(true);
      setError(null);
      if (!email || password.length < 8) throw new Error('Enter a valid email and a password of at least 8 characters.');
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name to create an account.');
        const res: any = await signUp.email({ name: name.trim(), email: email.trim(), password });
        if (res?.error) throw new Error(res.error.message || 'Sign-up failed');
      } else {
        const res: any = await signIn.email({ email: email.trim(), password });
        if (res?.error) throw new Error(res.error.message || 'Sign-in failed. Check your credentials.');
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <header className="z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="glow-ring flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04120c]">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Pulse<span className="text-glow-green">Fit</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="btn-ghost px-4 py-2 text-xs font-bold">
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Continue as guest</span>
            <span className="sm:hidden">Guest</span>
          </Link>
          <a href="#start" className="btn-primary px-4 py-2 text-xs">
            Get started
          </a>
        </div>
      </header>

      {/* Ticker */}
      <div className="relative z-10 overflow-hidden border-y border-white/[0.06] bg-black/30 py-2.5">
        <div className="flex w-max gap-8 whitespace-nowrap" style={{ animation: 'ticker 30s linear infinite' }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="font-display text-[11px] font-bold tracking-[0.25em] text-zinc-600">
              {t} <span className="ml-8 text-emerald-500">◆</span>
            </span>
          ))}
        </div>
      </div>

      <main className="z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Hero */}
        <div className="rise text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-bold text-emerald-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            No account needed to start training
          </div>
          <h1 className="font-display mt-6 text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-7xl">
            Train now.
            <br />
            <span className="text-glow-green">Save when ready.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
            Log sets, chase PRs, and watch your volume climb — instantly, on this device.
            Create an account only when you want your data backed up privately and synced everywhere.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
            <Link href="/dashboard" className="btn-primary w-full px-7 py-3.5 text-sm sm:w-auto">
              <Play className="h-4 w-4" />
              <span>Start training — free</span>
            </Link>
            <a href="#start" className="btn-ghost w-full px-7 py-3.5 text-sm sm:w-auto">
              <span>Create account</span>
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
            {[
              { icon: <Timer className="h-4 w-4" />, title: 'Rest timers', sub: 'Auto countdowns' },
              { icon: <Trophy className="h-4 w-4" />, title: 'Auto PRs', sub: 'Epley 1RM engine' },
              { icon: <TrendingUp className="h-4 w-4" />, title: 'Insights', sub: 'Plateau alerts' },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-3.5 text-left">
                <div className="text-emerald-400">{f.icon}</div>
                <p className="mt-2 text-[13px] font-bold text-white">{f.title}</p>
                <p className="text-[11px] text-zinc-500">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div id="start" className="rise rise-2">
          <div className="glass-bright rounded-[1.75rem] p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">
                {mode === 'signin' ? 'Welcome back' : 'Join PulseFit'}
              </h2>
              <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); }}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                      mode === m ? 'bg-emerald-500 text-[#04120c]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {m === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              {mode === 'signup' && (
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                  className="field" autoComplete="name" />
              )}
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                className="field" autoComplete="email" required />
              <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)}
                className="field" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required />
              <button type="submit" disabled={isBusy} className="btn-primary w-full px-4 py-3 text-sm disabled:opacity-60">
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{mode === 'signin' ? 'Sign in with email' : 'Create free account'}</span>
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] text-zinc-600">
              <span className="h-px flex-1 bg-white/10" /><span>or</span><span className="h-px flex-1 bg-white/10" />
            </div>

            <button onClick={handleGoogle} disabled={isBusy}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-zinc-900 transition-all hover:scale-[1.01] hover:bg-zinc-100 disabled:opacity-60">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <Link href="/dashboard"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-white">
              <CloudOff className="h-4 w-4 text-amber-400" />
              <span>Skip for now — train as guest</span>
            </Link>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
            )}

            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-500" /> Private by default</span>
              <span className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-emerald-500" /> Works on mobile</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="z-10 border-t border-white/[0.06] py-6 text-center text-xs text-zinc-600">
        PulseFit • Train as guest, save with an account
      </footer>
    </div>
  );
}
