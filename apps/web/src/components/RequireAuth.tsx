'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { LogIn } from 'lucide-react';

export interface MeData {
  user: { id: string; name: string; email: string; image?: string | null };
  settings: { weightUnit: string; distanceUnit: string; defaultRestTimerSeconds: number };
}

/** Shared profile query — one key app-wide so all pages stay in sync. */
export function useMe() {
  const query = useQuery<MeData>({
    queryKey: [...qk.me],
    queryFn: () => apiFetch('/api/users/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isUnauthorized =
    !query.isLoading &&
    (query.isError || !query.data?.user) &&
    String((query.error as Error | undefined)?.message || '').includes('Unauthorized');

  return { ...query, isUnauthorized };
}

/** Shown instead of page content when there is no signed-in user. No demo data. */
export function AuthPrompt({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 space-y-4">
        <h2 className="text-xl font-extrabold text-zinc-100">Please sign in</h2>
        <p className="text-sm text-zinc-400">
          {message || 'Your training data is private to your account. Sign in to continue.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          <span>Go to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
