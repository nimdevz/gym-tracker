'use client';

import React from 'react';
import Link from 'next/link';
import { useHistoryWorkouts, useAuthMode } from '@/lib/use-data';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { EmptyState, GuestBanner, PageHeader } from '@/components/ui';

export default function WorkoutHistoryPage() {
  const { data: workouts = [], isLoading } = useHistoryWorkouts();
  const { mode } = useAuthMode();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader
        eyebrow="Training history"
        title="Workouts"
        sub={mode === 'guest' ? 'Sessions stored on this device.' : 'Every completed session, newest first.'}
      />

      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading workout history...</div>
      ) : workouts.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          sub="Complete your first session to start building history."
          action={<Link href="/workout" className="btn-primary px-5 py-2.5 text-xs"><span>Start workout</span></Link>}
        />
      ) : (
        <div className="space-y-3">
          {workouts.map((w: any, i: number) => (
            <Link key={w.id} href={`/history/${w.id}`}
              className={`rise glass group block rounded-3xl p-5 sm:p-6 transition-all hover:border-emerald-500/30 hover:-translate-y-0.5 ${i < 4 ? `rise-${Math.min(i + 1, 4)}` : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-emerald-300">{w.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      {new Date(w.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {w.durationSeconds ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.round(w.durationSeconds / 60)} min
                      </span>
                    ) : null}
                    <span>{w.workoutExercises?.length || 0} exercises</span>
                    {w.status && w.status !== 'completed' && (
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        {String(w.status).replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span>Details</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                {(w.workoutExercises || []).map((we: any) => (
                  <span key={we.id} className="rounded-lg border border-white/[0.06] bg-black/40 px-2.5 py-1 text-[11px] text-zinc-300">
                    {we.exercise.name} <span className="text-zinc-500">({(we.sets || []).filter((s: any) => s.completed).length}/{we.sets?.length || 0})</span>
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
