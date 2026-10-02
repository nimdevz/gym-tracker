'use client';

import React from 'react';
import { useProgressData, useAuthMode } from '@/lib/use-data';
import { Activity, Trophy, Dumbbell } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, EmptyState, GuestBanner, PageHeader, Stat } from '@/components/ui';

export default function OverallProgressPage() {
  const { data: progressData, isLoading } = useProgressData();
  const { mode } = useAuthMode();

  const summary = (progressData as any)?.summary || {
    workoutsCompleted: 0,
    trainingVolumeKg: 0,
    prsAchieved: 0,
    weeklyTrendPercentage: 0,
  };
  const weeklyVolumeChart = (progressData as any)?.weeklyVolumeChart || [];
  const volumeByMuscleGroup = (progressData as any)?.volumeByMuscleGroup || {};

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader eyebrow="Analytics & trends" title="Progress" sub="Volume, consistency and strength gains over time." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Workouts" value={summary.workoutsCompleted} unit="completed" icon={<Dumbbell className="h-4 w-4" />} />
        <Stat label="Weekly volume" value={Number(summary.trainingVolumeKg || 0).toLocaleString()} unit="kg"
          icon={<Activity className="h-4 w-4" />} accent="text-emerald-300" />
        <Stat label="All-time PRs" value={summary.prsAchieved} unit="records" icon={<Trophy className="h-4 w-4" />} accent="text-amber-300" />
      </div>

      <Card className="rise rise-1">
        <h2 className="font-display mb-4 text-base font-bold text-white">Volume over time</h2>
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading progress data...</div>
          ) : weeklyVolumeChart.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Complete at least two weeks of training to chart your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeChart}>
                <XAxis dataKey="week" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} width={48} />
                <Tooltip contentStyle={{ backgroundColor: '#13141b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff' }} />
                <Bar dataKey="volume" fill="url(#progGrad)" radius={[8, 8, 2, 2]} />
                <defs>
                  <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="rise rise-2">
        <h2 className="font-display mb-4 text-base font-bold text-white">Volume by muscle</h2>
        {Object.keys(volumeByMuscleGroup).length === 0 ? (
          <EmptyState title="No breakdown yet" sub="Train to see where your volume goes." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(volumeByMuscleGroup).map(([group, vol]) => (
              <div key={group} className="rounded-2xl border border-white/[0.06] bg-black/40 p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{group}</span>
                <p className="font-display mt-1 text-xl font-bold text-white">{(vol as number).toLocaleString()} <span className="text-xs font-medium text-zinc-500">kg</span></p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
