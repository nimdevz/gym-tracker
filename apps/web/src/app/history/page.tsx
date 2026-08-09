'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { WorkoutData } from '@gym-tracker/types';
import { History, Clock, Dumbbell, ChevronRight, Calendar } from 'lucide-react';

export default function WorkoutHistoryPage() {
  const { data: workouts = [], isLoading } = useQuery<WorkoutData[]>({
    queryKey: ['workoutHistory'],
    queryFn: () => apiFetch('/api/workouts'),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <History className="h-4 w-4" />
          <span>Training History</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100">Workout History</h1>
        <p className="text-sm text-zinc-400">Review past completed training sessions and exercise details.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading workout history...</div>
      ) : workouts.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Dumbbell className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No workout history yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Complete your first workout session to see historical records listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map(w => (
            <Link
              key={w.id}
              href={`/history/${w.id}`}
              className="block rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {w.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      {new Date(w.startTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {w.durationSeconds && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        {Math.round(w.durationSeconds / 60)} mins
                      </span>
                    )}
                    <span>{w.workoutExercises?.length || 0} exercises</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <span>Inspect Details</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Exercises Summary Chips */}
              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-800/60">
                {w.workoutExercises?.map(we => (
                  <span
                    key={we.id}
                    className="inline-block rounded-xl bg-zinc-950 px-3 py-1 text-xs text-zinc-300 border border-zinc-800"
                  >
                    {we.exercise.name} ({we.sets?.filter(s => s.completed).length || 0} sets)
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
