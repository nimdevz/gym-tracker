'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Dumbbell, ShieldCheck, Zap, TrendingUp, Sparkles, ChevronRight, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);

      // Try Better Auth client first
      const res: any = await signIn.social({
        provider: 'google',
        callbackURL: 'http://localhost:3000/dashboard',
      });

      if (res?.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      // Direct REST API OAuth fetch fallback
      const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: 'http://localhost:3000/dashboard',
        }),
      });

      const data = await apiRes.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      try {
        const apiRes = await fetch('http://localhost:3001/api/auth/sign-in/social', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'google',
            callbackURL: 'http://localhost:3000/dashboard',
          }),
        });
        const data = await apiRes.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      } catch (fallbackErr) {}

      router.push('/dashboard');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoSignIn = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-zinc-100 overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-emerald-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/5">
            <Dumbbell className="h-6 w-6" />
          </div>
          <span>GYM<span className="text-zinc-100 font-light">TRACKER</span></span>
        </div>
        <button
          onClick={handleDemoSignIn}
          className="text-sm font-semibold text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          Demo Login
        </button>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto z-10 py-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Gym Tracker V1 • Personal Intelligence Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 leading-tight">
          Track Your Lifting. <br />
          <span className="text-shimmer-glow">
            Unlock Real Progress.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
          Log sets, weights, reps, and RIR instantly. Track 1RM progression, training volume, plateaus, and receive automated personal training insights based on your own data.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-bold px-8 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-70"
          >
            {isSigningIn ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-900" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          <button
            onClick={handleDemoSignIn}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-100 font-semibold px-8 py-3.5 rounded-2xl border border-zinc-800 transition-all cursor-pointer backdrop-blur-sm"
          >
            <span>Open Dashboard</span>
            <ChevronRight className="h-4 w-4 text-emerald-400" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Fast Gym Logger</h3>
            <p className="text-sm text-zinc-400">
              Set cloning, RIR tracking, previous performance lookup, and auto rest timer built for actual gym usage.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Automated PRs & 1RM</h3>
            <p className="text-sm text-zinc-400">
              Epley formula 1RM calculations, volume charts, and automatic personal record detection per set.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-zinc-100 mb-2">Personal Intelligence</h3>
            <p className="text-sm text-zinc-400">
              Deterministic statistics engine detecting plateaus, progressive overload opportunities, and weekly volume shifts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-zinc-600 border-t border-zinc-900 z-10">
        Gym Tracker V1 • Built with Next.js, Fastify, Better Auth, PostgreSQL & Drizzle ORM
      </footer>
    </div>
  );
}
