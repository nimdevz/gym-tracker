'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { TrendingUp, Activity, Trophy, Dumbbell } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function OverallProgressPage() {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['overallProgress'],
    queryFn: () => apiFetch('/api/progress'),
  });

  const summary = progressData?.summary || {
    workoutsCompleted: 0,
    trainingVolumeKg: 0,
    prsAchieved: 0,
    weeklyTrendPercentage: 0,
  };

  const weeklyVolumeChart = progressData?.weeklyVolumeChart || [];
  const volumeByMuscleGroup = progressData?.volumeByMuscleGroup || {};

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <TrendingUp className="h-4 w-4" />
          <span>Analytics & Trends</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100">Overall Progress</h1>
        <p className="text-sm text-zinc-400">Deep dive into training volume, weekly consistency, and strength gains.</p>
      </div>

      {/* High level metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Workouts Completed</span>
          <div className="mt-2 text-3xl font-extrabold text-zinc-100">{summary.workoutsCompleted}</div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Weekly Volume</span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            {summary.trainingVolumeKg.toLocaleString()} kg
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">All-Time PRs</span>
          <div className="mt-2 text-3xl font-extrabold text-amber-400">{summary.prsAchieved}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-bold text-zinc-100 mb-4">Volume Over Time (kg)</h2>
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-500">Loading progress data...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeChart}>
                <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="volume" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Muscle Volume Breakdown */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100">Volume by Muscle Group (kg)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(volumeByMuscleGroup).map(([group, vol]) => (
            <div key={group} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{group}</span>
              <p className="text-xl font-extrabold text-zinc-100 mt-1">{(vol as number).toLocaleString()} kg</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
