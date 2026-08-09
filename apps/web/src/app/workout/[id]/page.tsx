'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { WorkoutData, Exercise, SetData } from '@gym-tracker/types';
import { ExerciseSearchModal } from '@/components/ExerciseSearchModal';
import { RestTimer } from '@/components/RestTimer';
import {
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Clock,
  Dumbbell,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export default function ActiveWorkoutLoggerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workoutId = params.id as string;

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch Workout details
  const { data: workout, isLoading, isError } = useQuery<WorkoutData>({
    queryKey: ['workout', workoutId],
    queryFn: () => apiFetch(`/api/workouts/${workoutId}`),
    refetchInterval: 3000,
  });

  // Elapsed workout timer
  useEffect(() => {
    if (!workout?.startTime) return;
    const startMs = new Date(workout.startTime).getTime();

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startMs) / 1000);
      setElapsedSeconds(seconds > 0 ? seconds : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [workout?.startTime]);

  // Mutations
  const addExerciseMutation = useMutation({
    mutationFn: (exercise: Exercise) =>
      apiFetch(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        body: JSON.stringify({ exerciseId: exercise.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (weId: string) =>
      apiFetch(`/api/workouts/${workoutId}/exercises/${weId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: ({ weId, setNumber, weight, reps, rir }: { weId: string; setNumber: number; weight: number; reps: number; rir?: number }) =>
      apiFetch(`/api/workouts/${workoutId}/sets`, {
        method: 'POST',
        body: JSON.stringify({
          workoutExerciseId: weId,
          setNumber,
          weight,
          reps,
          rir,
          completed: false,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });

  const updateSetMutation = useMutation({
    mutationFn: ({ setId, data }: { setId: string; data: Partial<SetData> }) =>
      apiFetch(`/api/workouts/${workoutId}/sets/${setId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
      // If completing set, trigger rest timer
      if (variables.data.completed) {
        setActiveRestSeconds(90);
      }
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) =>
      apiFetch(`/api/workouts/${workoutId}/sets/${setId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });

  const finishWorkoutMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      router.push('/dashboard');
    },
  });

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-500">
        Loading active workout session...
      </div>
    );
  }

  if (isError || !workout) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="text-zinc-300 font-semibold">Workout not found or already completed.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6 pb-32">
      {/* Active Rest Timer Overlay */}
      {activeRestSeconds !== null && (
        <RestTimer
          initialSeconds={activeRestSeconds}
          onFinish={() => setActiveRestSeconds(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Live Workout Session
          </span>
          <h1 className="text-2xl font-extrabold text-zinc-100">{workout.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              {formatElapsed(elapsedSeconds)}
            </span>
            <span>•</span>
            <span>{workout.workoutExercises?.length || 0} exercises logged</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to finish this workout?')) {
                finishWorkoutMutation.mutate();
              }
            }}
            disabled={finishWorkoutMutation.isPending}
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Finish Workout</span>
          </button>
        </div>
      </div>

      {/* Workout Exercises Section */}
      <div className="space-y-6">
        {workout.workoutExercises?.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/20">
            <Dumbbell className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-200">No exercises added yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Tap "Add Exercise" below to pick from 35+ standard exercises in the library.
            </p>
          </div>
        ) : (
          workout.workoutExercises?.map((we, exIdx) => {
            const completedSets = we.sets.filter(s => s.completed);

            return (
              <div
                key={we.id}
                className="rounded-3xl border border-zinc-800/90 bg-zinc-900/50 p-5 sm:p-6 space-y-4 backdrop-blur-sm"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        #{exIdx + 1}
                      </span>
                      <h2 className="text-lg font-extrabold text-zinc-100">{we.exercise.name}</h2>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 capitalize">
                      {we.exercise.muscleGroup} • {we.exercise.equipment}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Remove ${we.exercise.name} from workout?`)) {
                        removeExerciseMutation.mutate(we.id);
                      }
                    }}
                    className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Previous Performance Reference Box */}
                <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/60 p-3 text-xs">
                  <span className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider">
                    Previous Reference
                  </span>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-zinc-300 font-mono">
                    <span>80 kg × 8</span>
                    <span>•</span>
                    <span>80 kg × 8</span>
                    <span>•</span>
                    <span>77.5 kg × 9</span>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        <th className="pb-2 text-center w-12">Set</th>
                        <th className="pb-2">Weight (kg)</th>
                        <th className="pb-2">Reps</th>
                        <th className="pb-2">RIR</th>
                        <th className="pb-2 text-center w-16">Done</th>
                        <th className="pb-2 text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {we.sets.map((setItem, setIdx) => (
                        <tr key={setItem.id} className={setItem.completed ? 'bg-emerald-500/5' : ''}>
                          <td className="py-2.5 text-center font-mono font-bold text-zinc-400">
                            {setIdx + 1}
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              step="0.5"
                              value={setItem.weight || ''}
                              onChange={e =>
                                updateSetMutation.mutate({
                                  setId: setItem.id,
                                  data: { weight: parseFloat(e.target.value) || 0 },
                                })
                              }
                              className="w-20 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              value={setItem.reps || ''}
                              onChange={e =>
                                updateSetMutation.mutate({
                                  setId: setItem.id,
                                  data: { reps: parseInt(e.target.value, 10) || 0 },
                                })
                              }
                              className="w-20 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="2"
                              value={setItem.rir ?? ''}
                              onChange={e =>
                                updateSetMutation.mutate({
                                  setId: setItem.id,
                                  data: { rir: parseFloat(e.target.value) },
                                })
                              }
                              className="w-16 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() =>
                                updateSetMutation.mutate({
                                  setId: setItem.id,
                                  data: { completed: !setItem.completed },
                                })
                              }
                              className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                setItem.completed
                                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                                  : 'border border-zinc-700 bg-zinc-950 text-zinc-600 hover:border-zinc-500'
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => deleteSetMutation.mutate(setItem.id)}
                              className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Set Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      const lastSet = we.sets[we.sets.length - 1];
                      addSetMutation.mutate({
                        weId: we.id,
                        setNumber: we.sets.length + 1,
                        weight: lastSet?.weight || 0,
                        reps: lastSet?.reps || 0,
                        rir: lastSet?.rir ?? 2,
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-zinc-900 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Set</span>
                  </button>

                  {we.sets.length > 0 && (
                    <button
                      onClick={() => {
                        const lastSet = we.sets[we.sets.length - 1];
                        addSetMutation.mutate({
                          weId: we.id,
                          setNumber: we.sets.length + 1,
                          weight: lastSet.weight,
                          reps: lastSet.reps,
                          rir: lastSet.rir ?? 2,
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-800/80 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Duplicate Set</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Exercise Trigger Button */}
      <button
        onClick={() => setIsExerciseModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-3xl border border-dashed border-emerald-500/40 bg-emerald-500/5 py-4 font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all"
      >
        <Plus className="h-5 w-5" />
        <span>Add Exercise</span>
      </button>

      {/* Exercise Modal */}
      <ExerciseSearchModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSelectExercise={ex => addExerciseMutation.mutate(ex)}
      />
    </div>
  );
}
