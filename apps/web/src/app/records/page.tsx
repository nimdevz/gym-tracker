'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { PersonalRecordData } from '@gym-tracker/types';
import { Trophy, Calendar, Dumbbell, Award } from 'lucide-react';

export default function PersonalRecordsPage() {
  const { data: recordsList = [], isLoading } = useQuery<PersonalRecordData[]>({
    queryKey: ['personalRecords'],
    queryFn: () => apiFetch('/api/records'),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
          <Trophy className="h-4 w-4" />
          <span>Hall of Fame</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100">Personal Records</h1>
        <p className="text-sm text-zinc-400">Automated PR timeline across all exercises and lifting milestones.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading personal records...</div>
      ) : recordsList.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <Trophy className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No personal records detected yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Log completed sets in your workouts to automatically trigger heaviest weight, rep, 1RM, and volume PRs!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordsList.map(pr => (
            <div
              key={pr.id}
              className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-zinc-100 text-base">{pr.exerciseName || 'Exercise'}</h3>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {pr.recordType.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-extrabold text-amber-400">{pr.weight} kg</span>
                <span className="text-sm font-semibold text-zinc-300">× {pr.reps} reps</span>
                <span className="text-xs text-zinc-500 font-mono">({pr.estimated1RM} kg 1RM)</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-2 border-t border-zinc-800/80">
                <Calendar className="h-3.5 w-3.5 text-amber-400/80" />
                <span>Achieved {new Date(pr.achievedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
