'use client';

import React, { useState, useEffect } from 'react';
import { useLibraryExercises } from '@/lib/use-data';
import { Exercise } from '@gym-tracker/types';
import { Search, X, Dumbbell, Plus } from 'lucide-react';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const muscleGroups = [
  { id: 'all', label: 'All Muscles' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'legs', label: 'Legs' },
  { id: 'arms', label: 'Arms' },
];

export function ExerciseSearchModal({ isOpen, onClose, onSelectExercise }: ExerciseSearchModalProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data: exercisesList = [], isLoading } = useLibraryExercises(debounced, selectedMuscle);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-bright flex h-[80vh] w-full max-w-2xl flex-col rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-white">Select exercise</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Muscle Filters */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search exercise by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {muscleGroups.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMuscle(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedMuscle === m.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading exercises...</div>
          ) : exercisesList.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No exercises found matching your search.
            </div>
          ) : (
            exercisesList.map(ex => (
              <div
                key={ex.id}
                onClick={() => {
                  onSelectExercise(ex);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {ex.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                      {ex.muscleGroup}
                    </span>
                    <span className="inline-block rounded-md bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400 capitalize">
                      {ex.equipment}
                    </span>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
