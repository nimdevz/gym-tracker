'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { InsightItem, WorkoutData } from '@gym-tracker/types';
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
  User as UserIcon,
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
  const { data: meData } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => apiFetch('/api/users/me'),
  });

  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => apiFetch('/api/progress'),
  });

  const { data: insightsList = [], isLoading: isInsightsLoading } = useQuery<InsightItem[]>({
    queryKey: ['insights'],
    queryFn: () => apiFetch('/api/insights'),
  });

  const { data: recentWorkouts = [], isLoading: isWorkoutsLoading } = useQuery<WorkoutData[]>({
    queryKey: ['recentWorkouts'],
    queryFn: () => apiFetch('/api/workouts'),
  });

  const user = meData?.user || { name: 'Demo Gym Athlete', email: 'dev@gymtracker.local' };

  const summary = progressData?.summary || {
    workoutsCompleted: 0,
    trainingVolumeKg: 0,
    prsAchieved: 0,
    weeklyTrendPercentage: 0,
  };

  const volumeByMuscleGroup = progressData?.volumeByMuscleGroup || {};
  const weeklyVolumeChart = progressData?.weeklyVolumeChart || [];

  const pieData = Object.entries(volumeByMuscleGroup)
    .filter(([_, vol]) => (vol as number) > 0)
    .map(([muscle, vol]) => ({
      name: muscle.toUpperCase(),
      value: vol as number,
      color: MUSCLE_COLORS[muscle] || '#10b981',
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* User Welcome & Quick Start Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="space-y-3">
          {/* User Badge */}
          <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-emerald-500/40" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-bold text-zinc-100 block">{user.name}</span>
              <span className="text-[10px] text-zinc-400 block font-mono">{user.email}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <Flame className="h-4 w-4 fill-emerald-400 text-emerald-400" />
              <span>Personal Fitness Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
              Welcome back, {user.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Here is your training volume, personal records, and active workout intelligence.
            </p>
          </div>
        </div>

        <Link
          href="/workout"
          className="flex items-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-3.5 font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] shrink-0"
        >
          <PlayCircle className="h-5 w-5 fill-zinc-950 text-emerald-500" />
          <span>Start Workout</span>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Workouts</span>
            <Dumbbell className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100">{summary.workoutsCompleted}</span>
            <span className="text-xs text-zinc-500 font-medium">sessions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Volume</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-100">
              {summary.trainingVolumeKg.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-medium">kg</span>
          </div>
          {summary.weeklyTrendPercentage !== 0 && (
            <p className={`text-[11px] font-semibold mt-1 ${summary.weeklyTrendPercentage > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {summary.weeklyTrendPercentage > 0 ? '+' : ''}{summary.weeklyTrendPercentage}% vs 4-wk avg
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">PRs Achieved</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{summary.prsAchieved}</span>
            <span className="text-xs text-zinc-500 font-medium">records</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Consistency</span>
            <Activity className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-400">Active</span>
            <span className="text-xs text-zinc-500 font-medium">streak</span>
          </div>
        </div>
      </div>

      {/* Personal Intelligence Engine Cards */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-zinc-100">Personal Fitness Intelligence</h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">Deterministic Engine V1</span>
        </div>

        {isInsightsLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Analyzing lifting data...</div>
        ) : insightsList.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 text-center text-zinc-400">
            <p className="text-sm">No insights available yet. Complete more workouts to unlock automated plateau warnings, volume trends, and progression advice!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insightsList.map(item => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 backdrop-blur-sm transition-all ${
                  item.type === 'plateau'
                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-200'
                    : item.type === 'recommendation'
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {item.type === 'plateau' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                    {item.type === 'recommendation' && <Sparkles className="h-3.5 w-3.5 text-emerald-400" />}
                    {item.title}
                  </span>
                  <span className="text-[10px] rounded-md bg-zinc-800/80 px-2 py-0.5 font-medium text-zinc-400">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-normal">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Volume Bar Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-base font-bold text-zinc-100 mb-4 flex items-center justify-between">
            <span>Weekly Training Volume (kg)</span>
            <span className="text-xs text-zinc-500 font-normal">Last 8 Weeks</span>
          </h2>
          <div className="h-64 w-full">
            {weeklyVolumeChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                Log completed workouts to view weekly volume chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolumeChart}>
                  <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="volume" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Muscle Group Distribution */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-base font-bold text-zinc-100 mb-4">Muscle Group Split</h2>
          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-xs text-zinc-500">No volume data yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-[11px] text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Recent Workouts</h2>
          <Link href="/history" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isWorkoutsLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading recent workouts...</div>
        ) : recentWorkouts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 text-center">
            <p className="text-zinc-400 text-sm font-medium">No workouts recorded yet.</p>
            <p className="text-xs text-zinc-500 mt-1">Start your first workout to begin tracking your progress!</p>
            <Link
              href="/workout"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Start Workout</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.slice(0, 4).map(w => (
              <Link
                key={w.id}
                href={`/history/${w.id}`}
                className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:border-emerald-500/40 transition-all group"
              >
                <div>
                  <h3 className="font-bold text-zinc-100 text-base group-hover:text-emerald-400 transition-colors">
                    {w.name}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                    <span>{new Date(w.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {w.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        {Math.round(w.durationSeconds / 60)} mins
                      </span>
                    )}
                    <span>{w.workoutExercises?.length || 0} exercises</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    Completed
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
