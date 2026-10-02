'use client';

import React from 'react';
import Link from 'next/link';
import { CloudOff, LogIn, Dumbbell } from 'lucide-react';

/* ------------------------------- primitives ------------------------------ */

export function Card({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass rounded-3xl p-5 sm:p-6 ${hover ? 'transition-all hover:border-emerald-500/30 hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rise">
      <div>
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">{eyebrow}</p>
        <h1 className="font-display mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-white">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-zinc-400 max-w-xl">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  icon,
  accent = 'text-white',
  sub,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  accent?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-5 rise">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</span>
        {icon && <span className="text-emerald-400">{icon}</span>}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className={`font-display text-3xl font-bold tracking-tight ${accent}`}>{value}</span>
        {unit && <span className="text-xs font-medium text-zinc-500">{unit}</span>}
      </div>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-3xl p-10 sm:p-14 text-center rise">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        {icon || <Dumbbell className="h-7 w-7" />}
      </div>
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {sub && <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-400">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------ guest banner ----------------------------- */

export function GuestBanner({ onImport, importing }: { onImport?: () => void; importing?: boolean }) {
  return (
    <div className="rise rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <CloudOff className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-200">Training as a guest — saved on this device only</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sign in to back up privately to your account, sync across devices, and keep history forever.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onImport && (
          <button
            onClick={onImport}
            disabled={importing}
            className="btn-ghost px-4 py-2 text-xs font-bold disabled:opacity-60"
          >
            {importing ? 'Importing…' : 'Import guest data'}
          </button>
        )}
        <Link href="/" className="btn-primary px-4 py-2 text-xs">
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign in</span>
        </Link>
      </div>
    </div>
  );
}

export function ModeBadge({ mode }: { mode: 'guest' | 'user' }) {
  if (mode === 'user') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
      <CloudOff className="h-3 w-3" />
      Guest
    </span>
  );
}
