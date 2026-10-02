'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useActiveWorkout, useWorkoutMutations, useAuthMode } from '@/lib/use-data';
import { PlayCircle, Plus, Dumbbell, Sparkles, ArrowRight } from 'lucide-react';
import { Card, GuestBanner, PageHeader } from '@/components/ui';

const TEMPLATES = [
  { name: 'Gym Workout', title: 'Empty workout', desc: 'Blank log — add exercises on the fly.', featured: true },
  { name: 'Chest & Upper Body', title: 'Chest & upper body', desc: 'Bench, incline press, flys & pushdowns.', featured: false },
  { name: 'Back & Pull Focus', title: 'Back & pull focus', desc: 'Deadlifts, rows, pulldowns & curls.', featured: false },
  { name: 'Legs & Lower Body', title: 'Legs & lower body', desc: 'Squats, leg press, RDLs & calves.', featured: false },
];

export default function WorkoutLaunchPage() {
  const router = useRouter();
  const { mode } = useAuthMode();
  const { data: activeWorkout, isLoading } = useActiveWorkout();
  const mutations = useWorkoutMutations();
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeWorkout) router.push(`/workout/${activeWorkout.id}`);
  }, [activeWorkout, router]);

  const handleStart = async (templateName: string) => {
    try {
      setStarting(true);
      setStartError(null);
      const w: any = await mutations.startWorkout(templateName);
      router.push(`/workout/${w.id}`);
    } catch {
      setStartError('Could not start workout. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-500">Checking active session...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader
        eyebrow="Gym logger"
        title="Start workout"
        sub={mode === 'guest' ? 'Training locally — sign in anytime to save to your account.' : 'Pick a template or start blank. Your session saves automatically.'}
      />

      {startError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{startError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.name}
            onClick={() => handleStart(t.name)}
            disabled={starting}
            className={`rise text-left rounded-3xl border p-6 transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
              t.featured
                ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-[#0c0e14] to-[#0c0e14] hover:border-emerald-500/50'
                : 'glass hover:border-white/20'
            } ${i === 0 ? 'rise-1' : i === 1 ? 'rise-2' : i === 2 ? 'rise-3' : 'rise-4'}`}
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
              t.featured ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04120c]' : 'bg-white/[0.06] text-zinc-300'
            }`}>
              {t.featured ? <Plus className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
            </div>
            <h3 className="font-display text-lg font-bold text-white">{t.title}</h3>
            <p className="mt-1 text-xs text-zinc-400">{t.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
              Begin <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      <Card className="flex items-center gap-3 !p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-emerald-400" />
        <p className="text-xs leading-relaxed text-zinc-400">
          Sets, rest timers and PRs track live during your session. Finish the workout to lock it into history and update progress everywhere.
        </p>
      </Card>

      <div className="hidden">
        <PlayCircle className="h-4 w-4" />
      </div>
    </div>
  );
}
