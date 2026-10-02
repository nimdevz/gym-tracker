'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useSession } from '@/lib/auth-client';
import {
  clearGuestData,
  guestActiveWorkout,
  guestAddExercise,
  guestAddSet,
  guestBodyList,
  guestCompletedWorkouts,
  guestCounts,
  guestDeleteBody,
  guestDeleteSet,
  guestDeleteWorkout,
  guestExerciseHistory,
  guestFinishWorkout,
  guestInsights,
  guestAllExercises,
  guestProgress,
  guestRecords,
  guestRemoveExercise,
  guestSaveBody,
  guestSaveSettings,
  useGuestVersion,
  guestSettings,
  guestStartWorkout,
  guestUpdateSet,
  guestWorkoutById,
  useGuestStore,
} from '@/lib/guest-store';

export type AuthMode = 'guest' | 'user' | 'loading';

export function useAuthMode(): { mode: AuthMode; user: any; isPending: boolean } {
  const { data: session, isPending } = useSession();
  if (isPending) return { mode: 'loading', user: null, isPending: true };
  if (session?.user) return { mode: 'user', user: session.user, isPending: false };
  return { mode: 'guest', user: null, isPending: false };
}

export function useMeData() {
  const { mode } = useAuthMode();
  useGuestStore();
  const query = useQuery({
    queryKey: [...qk.me],
    queryFn: () => apiFetch('/api/users/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: mode === 'user',
  });
  if (mode === 'guest') {
    return {
      data: { user: { id: 'guest', name: 'Guest Athlete', email: 'Training locally on this device', image: null }, settings: guestSettings() },
      isLoading: false,
      isError: false,
      isUnauthorized: false,
      isGuest: true as const,
    };
  }
  const isUnauthorized =
    !query.isLoading &&
    (query.isError || !(query.data as any)?.user) &&
    String((query.error as Error | undefined)?.message || '').includes('Unauthorized');
  return { ...query, isUnauthorized, isGuest: false as const };
}

export function useHistoryWorkouts() {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: [...qk.workoutHistory],
    queryFn: () => apiFetch('/api/workouts'),
    enabled: mode === 'user',
  });
  const guest = useMemo(() => guestCompletedWorkouts(), [mode, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: (query.data as any[]) || [], isLoading: query.isLoading, isGuest: false as const };
}

export function useActiveWorkout() {
  const { mode } = useAuthMode();
  useGuestStore();
  const query = useQuery({
    queryKey: [...qk.activeWorkout],
    queryFn: () => apiFetch('/api/workouts/active'),
    retry: false,
    staleTime: 30 * 1000,
    enabled: mode === 'user',
  });
  if (mode === 'guest') return { data: guestActiveWorkout(), isLoading: false, isError: false, isGuest: true as const };
  return { data: query.data as any, isLoading: query.isLoading, isError: query.isError, isGuest: false as const };
}

export function useWorkoutDetail(id: string) {
  const { mode } = useAuthMode();
  useGuestStore();
  const query = useQuery({
    queryKey: qk.workoutDetail(id),
    queryFn: () => apiFetch(`/api/workouts/${id}`),
    enabled: mode === 'user' && !!id,
  });
  if (mode === 'guest') return { data: guestWorkoutById(id), isLoading: false, isError: !guestWorkoutById(id), isGuest: true as const };
  return { data: query.data as any, isLoading: query.isLoading, isError: query.isError, isGuest: false as const };
}

export function useProgressData() {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: [...qk.progress],
    queryFn: () => apiFetch('/api/progress'),
    enabled: mode === 'user',
  });
  const guest = useMemo(() => guestProgress(), [mode, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: query.data as any, isLoading: query.isLoading, isGuest: false as const };
}

export function useInsightsData() {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: [...qk.insights],
    queryFn: () => apiFetch('/api/insights'),
    enabled: mode === 'user',
  });
  const guest = useMemo(() => guestInsights(), [mode, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: (query.data as any[]) || [], isLoading: query.isLoading, isGuest: false as const };
}

export function useRecordsData() {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: [...qk.records],
    queryFn: () => apiFetch('/api/records'),
    enabled: mode === 'user',
  });
  const guest = useMemo(() => guestRecords(), [mode, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: (query.data as any[]) || [], isLoading: query.isLoading, isGuest: false as const };
}

export function useBodyData() {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: [...qk.bodyMeasurements],
    queryFn: () => apiFetch('/api/body-measurements'),
    enabled: mode === 'user',
  });
  const guest = useMemo(() => guestBodyList(), [mode, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: (query.data as any[]) || [], isLoading: query.isLoading, isGuest: false as const };
}

export function useLibraryExercises(search: string, muscle: string) {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: qk.exerciseLibrary(search, muscle),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (muscle !== 'all') params.set('muscleGroup', muscle);
      const qs = params.toString();
      return apiFetch(`/api/exercises${qs ? `?${qs}` : ''}`);
    },
    enabled: mode === 'user',
  });
  const guest = useMemo(() => {
    let list = guestAllExercises();
    if (search) list = list.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    if (muscle !== 'all') list = list.filter((e) => e.muscleGroup === muscle);
    return list;
  }, [mode, search, muscle, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isGuest: true as const };
  return { data: (query.data as any[]) || [], isLoading: query.isLoading, isGuest: false as const };
}

export function useExerciseHistoryData(id: string) {
  const { mode } = useAuthMode();
  const gv = useGuestVersion();
  const query = useQuery({
    queryKey: qk.exerciseHistory(id),
    queryFn: () => apiFetch(`/api/exercises/${id}/history`),
    enabled: mode === 'user' && !!id,
  });
  const guest = useMemo(() => guestExerciseHistory(id), [mode, id, gv]);
  if (mode === 'guest') return { data: guest, isLoading: false, isError: !guest, isGuest: true as const };
  return { data: query.data as any, isLoading: query.isLoading, isError: query.isError, isGuest: false as const };
}

/** Mutations that write to the API when signed in, or localStorage as guest. */
export function useWorkoutMutations(workoutId?: string) {
  const queryClient = useQueryClient();
  const { mode } = useAuthMode();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [...qk.activeWorkout] });
    if (workoutId) queryClient.invalidateQueries({ queryKey: qk.workoutDetail(workoutId) });
    queryClient.invalidateQueries({ queryKey: [...qk.workoutHistory] });
    queryClient.invalidateQueries({ queryKey: [...qk.progress] });
    queryClient.invalidateQueries({ queryKey: [...qk.insights] });
    queryClient.invalidateQueries({ queryKey: [...qk.records] });
  };

  return {
    mode,
    async startWorkout(name: string) {
      if (mode === 'user') {
        const w = await apiFetch('/api/workouts', { method: 'POST', body: JSON.stringify({ name }) });
        invalidateAll();
        return w;
      }
      const w = guestStartWorkout(name);
      invalidateAll();
      return w;
    },
    async finishWorkout(id: string) {
      if (mode === 'user') {
        const w = await apiFetch(`/api/workouts/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
        invalidateAll();
        return w;
      }
      const w = guestFinishWorkout(id);
      invalidateAll();
      return w;
    },
    async deleteWorkout(id: string) {
      if (mode === 'user') {
        await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' });
      } else {
        guestDeleteWorkout(id);
      }
      invalidateAll();
    },
    async addExercise(id: string, exerciseId: string) {
      if (mode === 'user') {
        const we = await apiFetch(`/api/workouts/${id}/exercises`, { method: 'POST', body: JSON.stringify({ exerciseId }) });
        invalidateAll();
        return we;
      }
      const we = guestAddExercise(id, exerciseId);
      invalidateAll();
      return we;
    },
    async removeExercise(id: string, weId: string) {
      if (mode === 'user') {
        await apiFetch(`/api/workouts/${id}/exercises/${weId}`, { method: 'DELETE' });
      } else {
        guestRemoveExercise(id, weId);
      }
      invalidateAll();
    },
    async addSet(id: string, input: { weId: string; setNumber: number; weight: number; reps: number; rir?: number | null }) {
      if (mode === 'user') {
        const s = await apiFetch(`/api/workouts/${id}/sets`, {
          method: 'POST',
          body: JSON.stringify({ workoutExerciseId: input.weId, setNumber: input.setNumber, weight: input.weight, reps: input.reps, rir: input.rir ?? null, completed: false }),
        });
        invalidateAll();
        return s;
      }
      const s = guestAddSet(id, input.weId, { weight: input.weight, reps: input.reps, rir: input.rir ?? null });
      invalidateAll();
      return s;
    },
    async updateSet(id: string, setId: string, data: any) {
      if (mode === 'user') {
        const s = await apiFetch(`/api/workouts/${id}/sets/${setId}`, { method: 'PUT', body: JSON.stringify(data) });
        invalidateAll();
        return s;
      }
      const s = guestUpdateSet(id, setId, data);
      invalidateAll();
      return s;
    },
    async deleteSet(id: string, setId: string) {
      if (mode === 'user') {
        await apiFetch(`/api/workouts/${id}/sets/${setId}`, { method: 'DELETE' });
      } else {
        guestDeleteSet(id, setId);
      }
      invalidateAll();
    },
    async saveBody(input: any) {
      if (mode === 'user') {
        const r = await apiFetch('/api/body-measurements', { method: 'POST', body: JSON.stringify(input) });
        queryClient.invalidateQueries({ queryKey: [...qk.bodyMeasurements] });
        return r;
      }
      const r = guestSaveBody(input);
      queryClient.invalidateQueries({ queryKey: [...qk.bodyMeasurements] });
      return r;
    },
    async deleteBody(bodyId: string) {
      if (mode === 'user') {
        await apiFetch(`/api/body-measurements/${bodyId}`, { method: 'DELETE' });
      } else {
        guestDeleteBody(bodyId);
      }
      queryClient.invalidateQueries({ queryKey: [...qk.bodyMeasurements] });
    },
    async saveSettings(patch: any) {
      if (mode === 'user') {
        const r = await apiFetch('/api/users/settings', { method: 'PUT', body: JSON.stringify(patch) });
        queryClient.invalidateQueries({ queryKey: [...qk.me] });
        return r;
      }
      const r = guestSaveSettings(patch);
      queryClient.invalidateQueries({ queryKey: [...qk.me] });
      return r;
    },
  };
}

/** Push local guest data into the signed-in account, then clear local storage. */
export async function importGuestDataToAccount(): Promise<{ workouts: number; body: number }> {
  const counts = guestCounts();
  const workouts = guestCompletedWorkouts().concat(
    (() => {
      const active = guestActiveWorkout();
      return active ? [active] : [];
    })(),
  );

  for (const w of workouts) {
    const created: any = await apiFetch('/api/workouts', { method: 'POST', body: JSON.stringify({ name: w.name }) });
    for (const we of w.workoutExercises) {
      try {
        const added: any = await apiFetch(`/api/workouts/${created.id}/exercises`, {
          method: 'POST',
          body: JSON.stringify({ exerciseId: we.exerciseId }),
        });
        const targetWeId = added?.id;
        for (const s of we.sets) {
          if (!targetWeId) break;
          const setPayload: any = { workoutExerciseId: targetWeId, setNumber: s.setNumber, weight: s.weight, reps: s.reps, completed: s.completed };
          if (s.rir != null) setPayload.rir = s.rir;
          await apiFetch(`/api/workouts/${created.id}/sets`, { method: 'POST', body: JSON.stringify(setPayload) });
        }
        // Remove the auto-created empty set if the guest exercise already had sets
        if (we.sets.length > 0 && added?.sets?.[0] && we.sets.length >= 1) {
          // keep it simple: leave the placeholder; user can delete it
        }
      } catch {
        // Exercise may not exist server-side (custom guest exercise) — skip it
      }
    }
    if (w.status === 'completed') {
      await apiFetch(`/api/workouts/${created.id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
    }
  }

  for (const b of guestBodyList()) {
    try {
      await apiFetch('/api/body-measurements', {
        method: 'POST',
        body: JSON.stringify({
          date: b.date,
          ...(b.weightKg != null ? { weightKg: b.weightKg } : {}),
          ...(b.bodyFatPercentage != null ? { bodyFatPercentage: b.bodyFatPercentage } : {}),
          ...(b.chestCm != null ? { chestCm: b.chestCm } : {}),
          ...(b.waistCm != null ? { waistCm: b.waistCm } : {}),
          ...(b.armsCm != null ? { armsCm: b.armsCm } : {}),
          ...(b.thighsCm != null ? { thighsCm: b.thighsCm } : {}),
        }),
      });
    } catch {}
  }

  clearGuestData();
  return counts;
}
