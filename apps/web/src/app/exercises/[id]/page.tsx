'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useExerciseHistoryData, useAuthMode } from '@/lib/use-data';
import { ChevronLeft, Trophy } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, GuestBanner, PageHeader, Stat } from '@/components/ui';

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;
  const { mode } = useAuthMode();

  const { data, isLoading, isError } = useExerciseHistoryData(exerciseId);

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading exercise analytics...</div>;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-lg font-bold text-white">Exercise data unavailable.</p>
        <button onClick={() => router.push('/exercises')} className="btn-ghost mt-4 px-4 py-2 text-xs font-bold">
          Back to exercises
        </button>
      </div>
    );
  }

  const { exercise, currentBestWeight, currentBestReps, currentEstimated1RM, volumeThisMonth, sessions, prHistory } = data as any;

  const chartData = [...sessions]
    .sort((a: any, b: any) => (a.date < b.date ? -1 : 1))
    .map((s: any) => ({
      date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      maxWeight: s.maxWeight,
      estimated1RM: Math.round(s.estimated1RM * 10) / 10,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-5">
      {mode === 'guest' && <GuestBanner />}
      <button onClick={() => router.push('/exercises')}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 transition-colors hover:text-emerald-300">
        <ChevronLeft className="h-4 w-4" />
        <span>Back to library</span>
      </button>

      <PageHeader
        eyebrow={`${exercise.muscleGroup} • ${exercise.equipment}`}
        title={exercise.name}
        sub={exercise.instructions}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Current best" accent="text-emerald-300"
          value={currentBestWeight > 0 ? `${currentBestWeight}` : '—'} unit={currentBestWeight > 0 ? `kg × ${currentBestReps}` : 'no sets yet'} />
        <Stat label="Estimated 1RM" value={currentEstimated1RM > 0 ? `${Math.round(currentEstimated1RM * 10) / 10}` : '—'}
          unit={currentEstimated1RM > 0 ? 'kg (Epley)' : 'no sets yet'} />
        <Stat label="Volume / 30d" value={Number(volumeThisMonth || 0).toLocaleString()} unit="kg" accent="text-teal-300" />
      </div>

      <Card>
        <h2 className="font-display mb-4 text-base font-bold text-white">Strength curve</h2>
        <div className="h-64 w-full">
          {chartData.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Log this lift in two or more sessions to chart your curve.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={{ backgroundColor: '#13141b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff' }} />
                <Line type="monotone" dataKey="estimated1RM" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 3 }} />
                <Line type="monotone" dataKey="maxWeight" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {(prHistory || []).length > 0 && (
        <Card>
          <h2 className="font-display mb-3 flex items-center gap-2 text-base font-bold text-white">
            <Trophy className="h-4 w-4 text-amber-300" /> Record timeline
          </h2>
          <div className="flex flex-wrap gap-2">
            {(prHistory || []).map((pr: any) => (
              <span key={pr.id} className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-1.5 text-[11px] font-bold text-amber-200">
                {String(pr.recordType).replace(/_/g, ' ')} — {pr.weight} kg × {pr.reps}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-display mb-4 text-base font-bold text-white">Recent sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-500">No session history yet.</p>
        ) : (
          <div className="space-y-2.5">
            {sessions.slice(0, 8).map((s: any) => (
              <div key={s.workoutId} className="rounded-2xl border border-white/[0.06] bg-black/40 p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{s.workoutName}</span>
                  <span className="text-zinc-500">{new Date(s.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-zinc-300">
                  {s.sets.map((st: any, i: number) => (
                    <span key={st.id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">
                      {st.weight} × {st.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
