'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { WorkoutData } from '@gym-tracker/types';
import { Clock, Calendar, ChevronLeft, Dumbbell, Trophy } from 'lucide-react';

export default function WorkoutDetailHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const workoutId = params.id as string;

  const { data: workout, isLoading, isError } = useQuery<WorkoutData>({
    queryKey: ['workoutDetail', workoutId],
    queryFn: () => apiFetch(`/api/workouts/${workoutId}`),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading workout details...</div>;
  }

  if (isError || !workout) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <p>Workout not found.</p>
        <button
          onClick={() => router.push('/history')}
          className="mt-4 px-4 py-2 bg-zinc-800 text-xs font-bold rounded-xl text-zinc-200"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <button
        onClick={() => router.push('/history')}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to History</span>
      </button>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
        <h1 className="text-2xl font-extrabold text-zinc-100">{workout.name}</h1>
        <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            {new Date(workout.startTime).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          {workout.durationSeconds && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              {Math.round(workout.durationSeconds / 60)} minutes
            </span>
          )}
        </div>
      </div>

      {/* Exercises Logged */}
      <div className="space-y-4">
        {workout.workoutExercises?.map((we, idx) => (
          <div key={we.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                #{idx + 1}
              </span>
              <h3 className="text-lg font-bold text-zinc-100">{we.exercise.name}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 uppercase tracking-wider text-zinc-500">
                    <th className="pb-2 text-center">Set</th>
                    <th className="pb-2">Weight</th>
                    <th className="pb-2">Reps</th>
                    <th className="pb-2">RIR</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {we.sets?.map(s => (
                    <tr key={s.id}>
                      <td className="py-2 text-center text-zinc-400">{s.setNumber}</td>
                      <td className="py-2 font-bold text-zinc-100">{s.weight} kg</td>
                      <td className="py-2 text-zinc-300">{s.reps} reps</td>
                      <td className="py-2 text-zinc-500">{s.rir ?? '-'}</td>
                      <td className="py-2 text-right font-sans">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-md">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
