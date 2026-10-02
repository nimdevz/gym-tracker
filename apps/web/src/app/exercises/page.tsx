'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLibraryExercises, useAuthMode } from '@/lib/use-data';
import { Search, ChevronRight } from 'lucide-react';
import { EmptyState, GuestBanner, PageHeader } from '@/components/ui';

const muscleGroups = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'legs', label: 'Legs' },
  { id: 'arms', label: 'Arms' },
];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const { mode } = useAuthMode();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: exercisesList = [], isLoading } = useLibraryExercises(debouncedSearch, selectedMuscle);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader
        eyebrow="Movement database"
        title="Exercises"
        sub={mode === 'guest' ? '35+ movements available offline.' : 'Browse the library or review your history per lift.'}
      />

      <div className="rise rise-1 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input type="text" placeholder="Search movements..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="field !rounded-2xl !py-3 pl-11" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5">
          {muscleGroups.map((m) => (
            <button key={m.id} onClick={() => setSelectedMuscle(m.id)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedMuscle === m.id ? 'bg-emerald-500 text-[#04120c]' : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading exercise library...</div>
      ) : exercisesList.length === 0 ? (
        <EmptyState title="No matches" sub="Try a different search or muscle group." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exercisesList.map((ex: any) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`}
              className="glass group flex items-start justify-between rounded-3xl p-5 transition-all hover:border-emerald-500/30 hover:-translate-y-0.5">
              <div>
                <h3 className="font-display font-bold text-white transition-colors group-hover:text-emerald-300">{ex.name}</h3>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">{ex.muscleGroup}</span>
                  <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-semibold capitalize text-zinc-400">{ex.equipment}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
