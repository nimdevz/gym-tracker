'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkoutDetail, useAuthMode } from '@/lib/use-data';
import { Clock, Calendar, ChevronLeft } from 'lucide-react';
import { Card, GuestBanner } from '@/components/ui';

export default function WorkoutDetailHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;
  const { mode } = useAuthMode();

  const { data: workout, isLoading, isError } = useWorkoutDetail(workoutId);

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading workout details...</div>;
  }

  if (isError || !workout) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-lg font-bold text-white">Workout not found.</p>
        <button onClick={() => router.push('/history')} className="btn-ghost mt-4 px-4 py-2 text-xs font-bold">
          Back to history
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-5">
      {mode === 'guest' && <GuestBanner />}
      <button onClick={() => router.push('/history')}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 transition-colors hover:text-emerald-300">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to history</span>
      </button>

      <div className="rise relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-r from-emerald-950/40 via-[#0c0e14] to-[#0c0e14] p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">{workout.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 font-mono text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            {new Date(workout.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          {workout.durationSeconds ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              {Math.round(workout.durationSeconds / 60)} min
            </span>
          ) : null}
          <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
            {workout.status}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {(workout.workoutExercises || []).map((we: any, idx: number) => (
          <Card key={we.id}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
              <span className="font-display rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display font-bold text-white">{we.exercise.name}</h3>
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] uppercase tracking-[0.14em] text-zinc-500">
                    <th className="pb-2 text-center text-[10px]">Set</th>
                    <th className="pb-2 text-[10px]">Weight</th>
                    <th className="pb-2 text-[10px]">Reps</th>
                    <th className="pb-2 text-[10px]">RIR</th>
                    <th className="pb-2 text-right text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(we.sets || []).map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-2 text-center text-zinc-500">{s.setNumber}</td>
                      <td className="py-2 font-bold text-white">{s.weight} kg</td>
                      <td className="py-2 text-zinc-300">{s.reps} reps</td>
                      <td className="py-2 text-zinc-500">{s.rir ?? '-'}</td>
                      <td className="py-2 text-right">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.completed
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-white/[0.05] text-zinc-500'
                        }`}>
                          {s.completed ? 'Done' : 'Skipped'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
