'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { WorkoutData } from '@gym-tracker/types';
import { PlayCircle, Plus, Dumbbell, Sparkles } from 'lucide-react';

export default function WorkoutLaunchPage() {
  const router = useRouter();

  const { data: activeWorkout, isLoading } = useQuery<WorkoutData | null>({
    queryKey: ['activeWorkout'],
    queryFn: () => apiFetch('/api/workouts/active'),
  });

  useEffect(() => {
    if (activeWorkout) {
      router.push(`/workout/${activeWorkout.id}`);
    }
  }, [activeWorkout, router]);

  const startMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch('/api/workouts', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (newWorkout) => {
      router.push(`/workout/${newWorkout.id}`);
    },
  });

  const handleStartNew = (templateName: string) => {
    startMutation.mutate(templateName);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-500">
        Checking active workout status...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <span>Gym Logger V1</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100">Start Workout</h1>
        <p className="text-sm text-zinc-400">Select a template or begin a blank workout session.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleStartNew('Gym Workout')}
          disabled={startMutation.isPending}
          className="flex flex-col items-start justify-between p-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 hover:border-emerald-500/60 transition-all text-left group shadow-xl"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors mb-4">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              Empty Workout
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Start with a blank workout log and add exercises on the fly.
            </p>
          </div>
        </button>

        <button
          onClick={() => handleStartNew('Chest & Triceps')}
          disabled={startMutation.isPending}
          className="flex flex-col items-start justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all text-left group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors mb-4">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              Chest & Upper Body
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Bench Press, Incline Press, Cable Flys & Pushdowns.
            </p>
          </div>
        </button>

        <button
          onClick={() => handleStartNew('Back & Biceps')}
          disabled={startMutation.isPending}
          className="flex flex-col items-start justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all text-left group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors mb-4">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              Back & Pull Focus
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Deadlifts, Barbell Rows, Lat Pulldowns & Curls.
            </p>
          </div>
        </button>

        <button
          onClick={() => handleStartNew('Legs & Core')}
          disabled={startMutation.isPending}
          className="flex flex-col items-start justify-between p-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all text-left group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors mb-4">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              Legs & Lower Body
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Squats, Leg Press, Romanian Deadlifts & Calf Raises.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
