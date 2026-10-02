'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useMeData, useWorkoutDetail, useWorkoutMutations } from '@/lib/use-data';
import { ExerciseSearchModal } from '@/components/ExerciseSearchModal';
import { RestTimer } from '@/components/RestTimer';
import { GuestBanner } from '@/components/ui';
import {
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Clock,
  Dumbbell,
  AlertCircle,
  X,
  Flag,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ActiveWorkoutLoggerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workoutId = params.id as string;

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [busy, setBusy] = useState(false);

  const { data: workout, isLoading, isError } = useWorkoutDetail(workoutId);
  const { data: meData } = useMeData();
  const mutations = useWorkoutMutations(workoutId);
  const isGuest = mutations.mode === 'guest';
  const defaultRest = meData?.settings?.defaultRestTimerSeconds ?? 90;

  useEffect(() => {
    if (!workout?.startTime) return;
    const startMs = new Date(workout.startTime).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [workout?.startTime]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: qk.workoutDetail(workoutId) });
    queryClient.invalidateQueries({ queryKey: [...qk.activeWorkout] });
    queryClient.invalidateQueries({ queryKey: [...qk.workoutHistory] });
    queryClient.invalidateQueries({ queryKey: [...qk.progress] });
    queryClient.invalidateQueries({ queryKey: [...qk.insights] });
    queryClient.invalidateQueries({ queryKey: [...qk.records] });
  };

  const run = async (fn: () => Promise<any>, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      refresh();
      after?.();
    } finally {
      setBusy(false);
    }
  };

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    const p = (n: number) => n.toString().padStart(2, '0');
    return hrs > 0 ? `${p(hrs)}:${p(mins)}:${p(secs)}` : `${p(mins)}:${p(secs)}`;
  };

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-500">Loading workout session...</div>;
  }

  if (isError || !workout) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-amber-500" />
        <p className="font-display text-lg font-bold text-white">Workout not found</p>
        <p className="mt-1 text-sm text-zinc-400">It may have been deleted or already finished.</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary mt-5 px-5 py-2.5 text-xs">
          Return to dashboard
        </button>
      </div>
    );
  }

  const doneCount = workout.workoutExercises?.reduce((n: number, we: any) => n + we.sets.filter((s: any) => s.completed).length, 0) || 0;
  const totalCount = workout.workoutExercises?.reduce((n: number, we: any) => n + we.sets.length, 0) || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6 py-8 pb-32">
      {isGuest && <GuestBanner />}

      {activeRestSeconds !== null && (
        <RestTimer initialSeconds={activeRestSeconds} onFinish={() => setActiveRestSeconds(null)} />
      )}

      {/* Session header */}
      <div className="rise relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#0c0e14] to-[#0c0e14] p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-[70px]" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live session
            </span>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-white">{workout.name}</h1>
            <div className="mt-2 flex items-center gap-3 font-mono text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Clock className="h-3.5 w-3.5" />
                {formatElapsed(elapsedSeconds)}
              </span>
              <span>•</span>
              <span>{workout.workoutExercises?.length || 0} exercises</span>
              <span>•</span>
              <span>{doneCount}/{totalCount} sets</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Finish this workout?')) {
                void run(() => mutations.finishWorkout(workoutId), () => router.push('/dashboard'));
              }
            }}
            disabled={busy}
            className="btn-primary px-6 py-3 text-sm disabled:opacity-60"
          >
            <Flag className="h-4 w-4" />
            <span>Finish</span>
          </button>
        </div>
        {/* progress bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all"
            style={{ width: `${totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)}%` }}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {(workout.workoutExercises?.length || 0) === 0 ? (
          <div className="glass rounded-3xl border-dashed p-12 text-center">
            <Dumbbell className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <h3 className="font-display font-bold text-white">No exercises yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">Add your first movement from the 35+ exercise library.</p>
          </div>
        ) : (
          workout.workoutExercises?.map((we: any, exIdx: number) => (
            <div key={we.id} className="glass rise rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-display rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">
                    {String(exIdx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-white">{we.exercise.name}</h2>
                    <p className="text-[11px] capitalize text-zinc-500">{we.exercise.muscleGroup} • {we.exercise.equipment}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${we.exercise.name}?`)) void run(() => mutations.removeExercise(workoutId, we.id));
                  }}
                  className="rounded-xl p-2 text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {we.sets.length === 0 ? (
                  <span className="text-xs text-zinc-500">No sets yet.</span>
                ) : (
                  we.sets.slice(-3).map((s: any) => (
                    <span key={s.id} className="rounded-lg bg-black/40 border border-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-zinc-300">
                      {s.weight} kg × {s.reps}{s.completed ? ' ✓' : ''}
                    </span>
                  ))
                )}
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      <th className="w-12 pb-2 text-center">Set</th>
                      <th className="pb-2">Weight</th>
                      <th className="pb-2">Reps</th>
                      <th className="pb-2">RIR</th>
                      <th className="w-16 pb-2 text-center">Done</th>
                      <th className="w-10 pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {we.sets.map((setItem: any, setIdx: number) => (
                      <tr key={setItem.id} className={setItem.completed ? 'bg-emerald-500/[0.05]' : ''}>
                        <td className="py-2 text-center font-mono font-bold text-zinc-500">{setIdx + 1}</td>
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1">
                            <input type="number" step="0.5" min="0" defaultValue={setItem.weight ?? ''} key={`w-${setItem.id}-${setItem.weight}`}
                              onBlur={(e) => {
                                const next = parseFloat(e.target.value);
                                if (!Number.isNaN(next) && next !== setItem.weight) {
                                  void run(() => mutations.updateSet(workoutId, setItem.id, { weight: next }));
                                }
                              }}
                              className="field w-20 !py-1.5 font-mono" />
                            <span className="text-[10px] text-zinc-600">kg</span>
                          </div>
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" min="0" defaultValue={setItem.reps ?? ''} key={`r-${setItem.id}-${setItem.reps}`}
                            onBlur={(e) => {
                              const next = parseInt(e.target.value, 10);
                              if (!Number.isNaN(next) && next !== setItem.reps) {
                                void run(() => mutations.updateSet(workoutId, setItem.id, { reps: next }));
                              }
                            }}
                            className="field w-20 !py-1.5 font-mono" />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" step="0.5" min="0" max="10" placeholder="2" defaultValue={setItem.rir ?? ''} key={`rir-${setItem.id}-${setItem.rir}`}
                            onBlur={(e) => {
                              if (e.target.value === '') return;
                              const next = parseFloat(e.target.value);
                              if (!Number.isNaN(next) && next !== setItem.rir) {
                                void run(() => mutations.updateSet(workoutId, setItem.id, { rir: next }));
                              }
                            }}
                            className="field w-16 !py-1.5 font-mono" />
                        </td>
                        <td className="py-2 text-center">
                          <button
                            onClick={() =>
                              run(
                                () => mutations.updateSet(workoutId, setItem.id, { completed: !setItem.completed }),
                                () => {
                                  if (!setItem.completed) setActiveRestSeconds(defaultRest);
                                },
                              )
                            }
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                              setItem.completed
                                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04120c] shadow-lg shadow-emerald-500/30'
                                : 'border border-white/15 bg-black/40 text-zinc-600 hover:border-emerald-500/40 hover:text-emerald-400'
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => void run(() => mutations.deleteSet(workoutId, setItem.id))}
                            className="p-1.5 text-zinc-700 transition-colors hover:text-rose-400">
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => {
                    const last = we.sets[we.sets.length - 1];
                    void run(() =>
                      mutations.addSet(workoutId, {
                        weId: we.id,
                        setNumber: we.sets.length + 1,
                        weight: last?.weight ?? 0,
                        reps: last?.reps ?? 0,
                        rir: last?.rir ?? 2,
                      }),
                    );
                  }}
                  className="btn-ghost px-4 py-2 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Add set</span>
                </button>
                {we.sets.length > 0 && (
                  <button
                    onClick={() => {
                      const last = we.sets[we.sets.length - 1];
                      if (!last) return;
                      void run(() =>
                        mutations.addSet(workoutId, {
                          weId: we.id,
                          setNumber: we.sets.length + 1,
                          weight: last.weight ?? 0,
                          reps: last.reps ?? 0,
                          rir: last.rir ?? 2,
                        }),
                      );
                    }}
                    className="btn-ghost px-3 py-2 text-xs font-semibold !text-zinc-400"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Duplicate</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setIsExerciseModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.06] py-4 font-bold text-emerald-300 transition-all hover:bg-emerald-500/[0.12]"
      >
        <Plus className="h-5 w-5" />
        <span>Add exercise</span>
      </button>

      <ExerciseSearchModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelectExercise={(ex) => {
          void run(() => mutations.addExercise(workoutId, ex.id));
        }}
      />
    </div>
  );
}
