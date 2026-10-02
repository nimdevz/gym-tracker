'use client';

import React, { useState } from 'react';
import { useBodyData, useWorkoutMutations, useAuthMode } from '@/lib/use-data';
import { GuestBanner, PageHeader } from '@/components/ui';
import { Plus, Trash2, Scale } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function BodyMeasurementsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [armsCm, setArmsCm] = useState('');
  const [thighsCm, setThighsCm] = useState('');

  const { mode } = useAuthMode();
  const mutations = useWorkoutMutations();
  const [saving, setSaving] = useState(false);

  const { data: list = [], isLoading } = useBodyData();

  const createPending = saving;
  const createMutation = {
    get isPending() {
      return createPending;
    },
    mutate: async (input: any) => {
      setSaving(true);
      try {
        await mutations.saveBody(input);
        setWeightKg('');
        setBodyFatPercentage('');
        setChestCm('');
        setWaistCm('');
        setArmsCm('');
        setThighsCm('');
      } finally {
        setSaving(false);
      }
    },
  };

  const deleteMutation = {
    mutate: (id: string) => {
      void mutations.deleteBody(id);
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = weightKg ? parseFloat(weightKg) : undefined;
    const bf = bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined;
    if (w !== undefined && (w <= 0 || w > 500)) return;
    if (bf !== undefined && (bf <= 0 || bf > 70)) return;
    const payload: Record<string, unknown> = { date };
    if (w !== undefined) payload.weightKg = w;
    if (bf !== undefined) payload.bodyFatPercentage = bf;
    if (chestCm) payload.chestCm = parseFloat(chestCm);
    if (waistCm) payload.waistCm = parseFloat(waistCm);
    if (armsCm) payload.armsCm = parseFloat(armsCm);
    if (thighsCm) payload.thighsCm = parseFloat(thighsCm);
    createMutation.mutate(payload);
  };

  const chartData = [...list]
    .filter(m => m.weightKg)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date,
      weight: m.weightKg,
      bodyFat: m.bodyFatPercentage,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      <PageHeader eyebrow="Body metrics" title="Body tracking" sub="Weight, body fat and measurements over time." />

      {/* Log Entry Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <Scale className="h-4 w-4 text-emerald-400" />
          <span>Log New Measurement</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium">Body Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="75.5"
              value={weightKg}
              onChange={e => setWeightKg(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium">Body Fat %</label>
            <input
              type="number"
              step="0.1"
              placeholder="14.5"
              value={bodyFatPercentage}
              onChange={e => setBodyFatPercentage(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-400 font-medium">Chest (cm)</label>
            <input
              type="number"
              step="0.5"
              placeholder="102"
              value={chestCm}
              onChange={e => setChestCm(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium">Waist (cm)</label>
            <input
              type="number"
              step="0.5"
              placeholder="80"
              value={waistCm}
              onChange={e => setWaistCm(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium">Arms (cm)</label>
            <input
              type="number"
              step="0.5"
              placeholder="38"
              value={armsCm}
              onChange={e => setArmsCm(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium">Thighs (cm)</label>
            <input
              type="number"
              step="0.5"
              placeholder="60"
              value={thighsCm}
              onChange={e => setThighsCm(e.target.value)}
              className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Save Measurement</span>
        </button>
      </form>

      {/* Chart */}
      {chartData.length >= 2 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-base font-bold text-zinc-100 mb-4">Body Weight Trend (kg)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-lg font-bold text-zinc-100">Measurement History</h2>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading body metrics...</div>
        ) : list.length === 0 ? (
          <p className="text-xs text-zinc-500">No body measurements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 uppercase tracking-wider text-zinc-500">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Body Fat</th>
                  <th className="pb-2">Chest</th>
                  <th className="pb-2">Waist</th>
                  <th className="pb-2">Arms</th>
                  <th className="pb-2">Thighs</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {list.map(m => (
                  <tr key={m.id}>
                    <td className="py-2.5 font-bold text-zinc-200">{m.date}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{m.weightKg ? `${m.weightKg} kg` : '-'}</td>
                    <td className="py-2.5 text-zinc-300">{m.bodyFatPercentage ? `${m.bodyFatPercentage}%` : '-'}</td>
                    <td className="py-2.5 text-zinc-400">{m.chestCm ? `${m.chestCm} cm` : '-'}</td>
                    <td className="py-2.5 text-zinc-400">{m.waistCm ? `${m.waistCm} cm` : '-'}</td>
                    <td className="py-2.5 text-zinc-400">{m.armsCm ? `${m.armsCm} cm` : '-'}</td>
                    <td className="py-2.5 text-zinc-400">{m.thighsCm ? `${m.thighsCm} cm` : '-'}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete measurement from ${m.date}?`)) deleteMutation.mutate(m.id);
                        }}
                        className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
