'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { UserSettingsData } from '@gym-tracker/types';
import { signOut } from '@/lib/auth-client';
import { Settings, User, Sliders, LogOut, Check } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ user: any; settings: UserSettingsData }>({
    queryKey: ['userSettings'],
    queryFn: () => apiFetch('/api/users/me'),
  });

  const updateMutation = useMutation({
    mutationFn: (settingsData: Partial<UserSettingsData>) =>
      apiFetch('/api/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    window.location.href = '/';
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading account preferences...</div>;
  }

  const user = data?.user || { name: 'Gym Athlete', email: 'user@gymtracker.local' };
  const settings = data?.settings || { weightUnit: 'kg', defaultRestTimerSeconds: 90 };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <Settings className="h-4 w-4" />
          <span>Preferences & Profile</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100">Account Settings</h1>
        <p className="text-sm text-zinc-400">Configure weight units, default rest timer duration, and account details.</p>
      </div>

      {/* Account Info */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold text-lg border border-emerald-500/20">
            {user.name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">{user.name}</h3>
            <p className="text-xs text-zinc-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Unit Settings */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <span>Preferences</span>
        </h2>

        <div className="space-y-4 divide-y divide-zinc-800/60">
          {/* Weight Unit */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Weight Unit</p>
              <p className="text-xs text-zinc-500">Choose between Kilograms (kg) and Pounds (lbs)</p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => updateMutation.mutate({ weightUnit: 'kg' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.weightUnit === 'kg'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                KG
              </button>
              <button
                onClick={() => updateMutation.mutate({ weightUnit: 'lbs' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.weightUnit === 'lbs'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                LBS
              </button>
            </div>
          </div>

          {/* Default Rest Timer */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Default Rest Timer</p>
              <p className="text-xs text-zinc-500">Duration triggered automatically when set is completed</p>
            </div>
            <select
              value={settings.defaultRestTimerSeconds}
              onChange={e => updateMutation.mutate({ defaultRestTimerSeconds: parseInt(e.target.value, 10) })}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value={60}>60 seconds (1 min)</option>
              <option value={90}>90 seconds (1.5 mins)</option>
              <option value={120}>120 seconds (2 mins)</option>
              <option value={180}>180 seconds (3 mins)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
