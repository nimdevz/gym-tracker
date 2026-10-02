'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  PlayCircle,
  TrendingUp,
  Dumbbell,
  Clock,
  Trophy,
  Sparkles,
  AlertTriangle,
  Flame,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useMeData, useProgressData, useInsightsData, useHistoryWorkouts, useAuthMode, importGuestDataToAccount } from '@/lib/use-data';
import { qk } from '@/lib/query-keys';
import { Card, EmptyState, GuestBanner, PageHeader, Stat } from '@/components/ui';

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#10b981',
  back: '#3b82f6',
  shoulders: '#8b5cf6',
  legs: '#f59e0b',
  arms: '#ec4899',
  core: '#06b6d4',
  full_body: '#64748b',
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { mode } = useAuthMode();
  const { data: meData, isLoading: isMeLoading } = useMeData();
  const { data: progressData, isLoading: isProgressLoading } = useProgressData();
  const { data: insightsList = [], isLoading: isInsightsLoading } = useInsightsData();
  const { data: recentWorkouts = [], isLoading: isWorkoutsLoading } = useHistoryWorkouts();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<string | null>(null);

  const handleImport = async () => {
    try {
      setImporting(true);
      const counts = await importGuestDataToAccount();
      queryClient.invalidateQueries({ queryKey: [...qk.workoutHistory] });
      queryClient.invalidateQueries({ queryKey: [...qk.progress] });
      queryClient.invalidateQueries({ queryKey: [...qk.records] });
      queryClient.invalidateQueries({ queryKey: [...qk.bodyMeasurements] });
      setImported(`Imported ${counts.workouts} workouts and ${counts.body} measurements to your account.`);
    } catch {
      setImported('Import failed — please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (isMeLoading) {
    return <div className="p-12 text-center text-sm text-zinc-500">Loading your dashboard...</div>;
  }

  const user = meData?.user;
  const summary = (progressData as any)?.summary || {
    workoutsCompleted: 0,
    trainingVolumeKg: 0,
    prsAchieved: 0,
    weeklyTrendPercentage: 0,
  };
  const volumeByMuscleGroup = (progressData as any)?.volumeByMuscleGroup || {};
  const weeklyVolumeChart = (progressData as any)?.weeklyVolumeChart || [];

  const pieData = Object.entries(volumeByMuscleGroup)
    .filter(([_, vol]) => (vol as number) > 0)
    .map(([muscle, vol]) => ({
      name: (muscle as string).toUpperCase(),
      value: vol as number,
      color: MUSCLE_COLORS[muscle] || '#10b981',
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {mode === 'guest' && <GuestBanner />}
      {mode === 'user' && imported && (
        <div className="rise rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{imported}</div>
      )}

      <PageHeader
        eyebrow={mode === 'guest' ? 'Guest training' : 'Personal fitness hub'}
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'athlete'}`}
        sub={mode === 'guest' ? 'Everything below is computed live from data on this device.' : 'Volume, records and intelligence from your private training log.'}
        action={
          <Link href="/workout" className="btn-primary px-6 py-3 text-sm">
            <PlayCircle className="h-5 w-5" />
            <span>Start workout</span>
          </Link>
        }
      />

      {/* Hero strip */}
      <div className="rise rise-1 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/50 via-[#0c0e14] to-[#0c0e14] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-[90px]" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="h-14 w-14 rounded-2xl object-cover border border-emerald-500/40" />
            ) : (
              <div className="font-display flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/40 to-teal-500/20 text-2xl font-bold text-emerald-300">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
                <Flame className="h-3.5 w-3.5" /> Streak active
              </p>
              <p className="font-display text-xl font-bold text-white">{summary.workoutsCompleted} sessions logged</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            {mode === 'guest' && (
              <button onClick={handleImport} disabled className="btn-ghost px-4 py-2.5 text-xs font-bold opacity-50" title="Sign in to import">
                <Download className="h-4 w-4" />
                <span>Sign in to sync</span>
              </button>
            )}
            <Link href="/progress" className="btn-ghost px-4 py-2.5 text-xs font-bold">
              <span>Full analytics</span>
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Workouts" value={summary.workoutsCompleted} unit="sessions"
          icon={<Dumbbell className="h-4 w-4" />} />
        <Stat label="Weekly volume" value={Number(summary.trainingVolumeKg || 0).toLocaleString()} unit="kg"
          icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-300"
          sub={summary.weeklyTrendPercentage !== 0 ? (
            <p className={`text-[11px] font-semibold ${summary.weeklyTrendPercentage > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {summary.weeklyTrendPercentage > 0 ? '+' : ''}{summary.weeklyTrendPercentage}% vs 4-wk avg
            </p>
          ) : undefined} />
        <Stat label="PRs" value={summary.prsAchieved} unit="records" icon={<Trophy className="h-4 w-4" />} accent="text-amber-300" />
        <Stat label="This week" value={weeklyVolumeChart.length} unit="weeks tracked" icon={<Activity className="h-4 w-4" />} accent="text-teal-300" />
      </div>

      {/* Intelligence */}
      <Card className="rise rise-2">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-white">Training intelligence</h2>
          </div>
          <span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-mono text-zinc-500">on-device engine</span>
        </div>
        {isInsightsLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Analyzing lifting data...</div>
        ) : insightsList.length === 0 ? (
          <p className="rounded-2xl border border-white/[0.06] bg-black/30 p-6 text-center text-sm text-zinc-400">
            No insights yet — complete more workouts to unlock plateau warnings, volume trends and overload advice.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insightsList.map((item: any) => (
              <div key={item.id}
                className={`rounded-2xl border p-4 ${
                  item.type === 'plateau'
                    ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-200'
                    : item.type === 'recommendation'
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200'
                    : 'border-white/[0.06] bg-black/30 text-zinc-300'
                }`}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                    {item.type === 'plateau' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                    {item.type === 'recommendation' && <Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                    {item.title}
                  </span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">{item.category}</span>
                </div>
                <p className="text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rise rise-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-white">Weekly volume</h2>
            <span className="text-xs text-zinc-500">kilograms lifted</span>
          </div>
          <div className="h-64 w-full">
            {weeklyVolumeChart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Log completed workouts to chart your volume
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolumeChart}>
                  <XAxis dataKey="week" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} width={48} />
                  <Tooltip contentStyle={{ backgroundColor: '#13141b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff' }} />
                  <Bar dataKey="volume" fill="url(#volGrad)" radius={[8, 8, 2, 2]} />
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="rise rise-3">
          <h2 className="font-display mb-4 text-base font-bold text-white">Muscle split</h2>
          <div className="flex h-48 w-full items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-zinc-500">No volume data yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={44} paddingAngle={3} strokeWidth={0}>
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#13141b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map((d: any) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent */}
      <Card className="rise rise-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Recent workouts</h2>
          <Link href="/history" className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline">
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isWorkoutsLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading recent workouts...</div>
        ) : recentWorkouts.length === 0 ? (
          <EmptyState title="No workouts yet" sub="Start your first session — it takes less than a minute."
            action={<Link href="/workout" className="btn-primary px-5 py-2.5 text-xs"><PlayCircle className="h-4 w-4" /><span>Start workout</span></Link>} />
        ) : (
          <div className="space-y-2.5">
            {recentWorkouts.slice(0, 4).map((w: any) => (
              <Link key={w.id} href={`/history/${w.id}`}
                className="group flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/30 p-4 transition-all hover:border-emerald-500/30">
                <div>
                  <h3 className="font-bold text-white transition-colors group-hover:text-emerald-300">{w.name}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{new Date(w.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {w.durationSeconds ? (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{Math.round(w.durationSeconds / 60)} min</span>
                    ) : null}
                    <span>{w.workoutExercises?.length || 0} exercises</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">Done</span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-emerald-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
