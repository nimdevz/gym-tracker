'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ExerciseHistorySummary } from '@gym-tracker/types';
import { ChevronLeft, Dumbbell, TrendingUp, Trophy, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;

  const { data, isLoading, isError } = useQuery<ExerciseHistorySummary>({
    queryKey: ['exerciseHistory', exerciseId],
    queryFn: () => apiFetch(`/api/exercises/${exerciseId}/history`),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading exercise analytics...</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <p>Exercise data unavailable.</p>
        <button
          onClick={() => router.push('/exercises')}
          className="mt-4 px-4 py-2 bg-zinc-800 text-xs font-bold rounded-xl text-zinc-200"
        >
          Back to Exercises
        </button>
      </div>
    );
  }

  const { exercise, currentBestWeight, currentBestReps, currentEstimated1RM, volumeThisMonth, sessions, prHistory } = data;

  const chartData = sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    maxWeight: s.maxWeight,
    estimated1RM: s.estimated1RM,
  })).reverse();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <button
        onClick={() => router.push('/exercises')}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Exercise Library</span>
      </button>

      {/* Header */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
            {exercise.muscleGroup}
          </span>
          <span className="rounded-lg bg-zinc-800 text-zinc-400 px-2.5 py-1 text-xs font-semibold capitalize">
            {exercise.equipment}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100 mt-2">{exercise.name}</h1>
        {exercise.instructions && (
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-2xl">{exercise.instructions}</p>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Best</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {currentBestWeight > 0 ? `${currentBestWeight} kg` : 'N/A'}
            </span>
            {currentBestReps > 0 && <span className="text-xs text-zinc-400">× {currentBestReps} reps</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estimated 1RM</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100">
              {currentEstimated1RM > 0 ? `${currentEstimated1RM} kg` : 'N/A'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Epley Formula</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Volume This Month</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-400">
              {volumeThisMonth.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-400">kg</span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-bold text-zinc-100 mb-4">Estimated 1RM & Weight Progress</h2>
        <div className="h-64 w-full">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">
              Complete a workout with this exercise to see your progress chart here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="estimated1RM" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                <Line type="monotone" dataKey="maxWeight" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-500">No session history yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.workoutId} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="font-bold text-zinc-200">{s.workoutName}</span>
                  <span>{new Date(s.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-zinc-300">
                  {s.sets.map((st, i) => (
                    <span key={st.id} className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                      Set {i + 1}: {st.weight} kg × {st.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
