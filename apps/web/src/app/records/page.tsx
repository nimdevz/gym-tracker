'use client';

import React from 'react';
import { useRecordsData, useAuthMode } from '@/lib/use-data';
import { Trophy, Calendar, Award } from 'lucide-react';
import { EmptyState, GuestBanner, PageHeader } from '@/components/ui';

export default function PersonalRecordsPage() {
  const { data: recordsList = [], isLoading } = useRecordsData();
  const { mode } = useAuthMode();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader eyebrow="Hall of fame" title="Personal records"
        sub={mode === 'guest' ? 'Bests detected automatically from this device.' : 'Every milestone, detected automatically per set.'} />

      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading personal records...</div>
      ) : recordsList.length === 0 ? (
        <EmptyState icon={<Trophy className="h-7 w-7" />} title="No records yet"
          sub="Log completed sets to trigger heaviest weight, 1RM and volume PRs automatically." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recordsList.map((pr: any, i: number) => (
            <div key={pr.id}
              className={`rise relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-[#0c0e14] to-[#0c0e14] p-5 ${i < 4 ? `rise-${Math.min(i + 1, 4)}` : ''}`}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/15 blur-[50px]" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                    <Award className="h-4 w-4" />
                  </div>
                  <h3 className="font-display font-bold text-white">{pr.exerciseName || 'Exercise'}</h3>
                </div>
                <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {(pr.recordType || 'record').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="font-display text-3xl font-bold text-amber-300">{pr.weight ?? '–'} <span className="text-sm">kg</span></span>
                <span className="text-sm font-semibold text-zinc-300">× {pr.reps ?? '–'}</span>
                <span className="font-mono text-[11px] text-zinc-500">({pr.estimated1RM ?? '–'} 1RM)</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-xs text-zinc-500">
                <Calendar className="h-3.5 w-3.5 text-amber-400/70" />
                <span>{new Date(pr.achievedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
