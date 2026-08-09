'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Exercise } from '@gym-tracker/types';
import { BookOpen, Search, Dumbbell, ChevronRight, Plus } from 'lucide-react';

const muscleGroups = [
  { id: 'all', label: 'All Muscles' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'legs', label: 'Legs' },
  { id: 'arms', label: 'Arms' },
];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const { data: exercisesList = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ['exercisesLibrary', search, selectedMuscle],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMuscle !== 'all') params.set('muscleGroup', selectedMuscle);
      return apiFetch(`/api/exercises?${params.toString()}`);
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Exercise Database</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100">Exercise Library</h1>
          <p className="text-sm text-zinc-400">Browse 35+ standard movements or track historical performance.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search exercises by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {muscleGroups.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMuscle(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedMuscle === m.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-zinc-500">Loading exercise library...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercisesList.map(ex => (
            <Link
              key={ex.id}
              href={`/exercises/${ex.id}`}
              className="flex items-start justify-between p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 hover:border-emerald-500/40 transition-all group"
            >
              <div>
                <h3 className="font-bold text-zinc-100 text-base group-hover:text-emerald-400 transition-colors">
                  {ex.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block rounded-lg bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {ex.muscleGroup}
                  </span>
                  <span className="inline-block rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 capitalize">
                    {ex.equipment}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
