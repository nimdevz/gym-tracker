'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/auth-client';
import { Settings, Sliders, LogOut, Check, Download, Trash2 } from 'lucide-react';
import { useMeData, useWorkoutMutations, useAuthMode, importGuestDataToAccount } from '@/lib/use-data';
import { qk } from '@/lib/query-keys';
import { Card, GuestBanner, PageHeader } from '@/components/ui';
import { clearGuestData } from '@/lib/guest-store';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { mode } = useAuthMode();
  const { data, isLoading } = useMeData();
  const mutations = useWorkoutMutations();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const save = async (patch: any) => {
    try {
      setSaving(true);
      setSaveError(null);
      await mutations.saveSettings(patch);
      queryClient.invalidateQueries({ queryKey: [...qk.me] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError('Save failed — try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
    queryClient.clear();
    window.location.href = '/';
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setImportMsg(null);
      const counts = await importGuestDataToAccount();
      queryClient.invalidateQueries({ queryKey: [...qk.workoutHistory] });
      queryClient.invalidateQueries({ queryKey: [...qk.bodyMeasurements] });
      setImportMsg(`Imported ${counts.workouts} workouts and ${counts.body} measurements.`);
    } catch {
      setImportMsg('Import failed — please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading account preferences...</div>;
  }

  const user = data?.user;
  const settings = data?.settings || { weightUnit: 'kg', defaultRestTimerSeconds: 90 };
  const isGuest = mode === 'guest';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {isGuest && <GuestBanner />}
      <PageHeader eyebrow="Preferences & profile" title="Settings" sub={isGuest ? 'Local preferences stored on this device.' : 'Units, rest timer and your account.'} />

      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="font-display flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-teal-500/20 text-lg font-bold text-emerald-300">
            {user?.name?.[0]?.toUpperCase() || 'G'}
          </div>
          <div>
            <h3 className="font-display font-bold text-white">{user?.name || 'Athlete'}</h3>
            <p className="font-mono text-xs text-zinc-500">{user?.email || ''}</p>
            {isGuest && (
              <p className="mt-1 text-[11px] text-amber-300/80">Guest — data stays on this device until you sign in.</p>
            )}
          </div>
        </div>
        {!isGuest ? (
          <button onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/20">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        ) : (
          <a href="/" className="btn-primary px-4 py-2 text-xs">
            <span>Sign in / create account</span>
          </a>
        )}
      </Card>

      {mode === 'user' && (
        <Card>
          <h2 className="font-display text-base font-bold text-white">Move guest data here</h2>
          <p className="mt-1 text-xs text-zinc-400">Copy workouts and measurements saved on this device into your private account.</p>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={handleImport} disabled={importing} className="btn-ghost px-4 py-2.5 text-xs font-bold disabled:opacity-60">
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{importing ? 'Importing…' : 'Import guest data'}</span>
            </button>
            {importMsg && <span className="text-xs text-zinc-400">{importMsg}</span>}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-display flex items-center gap-2 text-base font-bold text-white">
          <Sliders className="h-4 w-4 text-emerald-400" />
          <span>Preferences</span>
          {saving && <span className="text-[11px] font-medium text-zinc-500">Saving…</span>}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {saveError && <span className="text-[11px] font-medium text-rose-400">{saveError}</span>}
        </h2>

        <div className="mt-4 space-y-4 divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Weight unit</p>
              <p className="text-xs text-zinc-500">Kilograms or pounds across the app</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
              {(['kg', 'lbs'] as const).map((u) => (
                <button key={u} onClick={() => save({ weightUnit: u })}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    settings.weightUnit === u ? 'bg-emerald-500 text-[#04120c]' : 'text-zinc-400 hover:text-white'
                  }`}>
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Default rest timer</p>
              <p className="text-xs text-zinc-500">Triggered when you complete a set</p>
            </div>
            <select value={settings.defaultRestTimerSeconds ?? 90} disabled={saving}
              onChange={(e) => save({ defaultRestTimerSeconds: parseInt(e.target.value, 10) })}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none">
              <option value={60}>60s (1 min)</option>
              <option value={90}>90s (1.5 min)</option>
              <option value={120}>120s (2 min)</option>
              <option value={180}>180s (3 min)</option>
            </select>
          </div>
        </div>
      </Card>

      {isGuest && (
        <Card className="!border-rose-500/20">
          <h2 className="font-display text-base font-bold text-white">Danger zone</h2>
          <p className="mt-1 text-xs text-zinc-400">Delete everything stored on this device.</p>
          <button
            onClick={() => {
              if (confirm('Delete all guest data on this device?')) {
                clearGuestData();
                window.location.href = '/dashboard';
              }
            }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20">
            <Trash2 className="h-4 w-4" />
            <span>Clear local data</span>
          </button>
        </Card>
      )}

      <div className="hidden">
        <Settings className="h-4 w-4" />
      </div>
    </div>
  );
}
