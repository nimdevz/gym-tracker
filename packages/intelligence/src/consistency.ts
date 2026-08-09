import { WorkoutData } from '@gym-tracker/types';

export interface ConsistencyMetrics {
  workoutsThisWeek: number;
  workoutsLastWeek: number;
  monthlyTotal: number;
  currentStreakWeeks: number;
  insightDescription?: string;
}

export function analyzeConsistency(workouts: WorkoutData[]): ConsistencyMetrics {
  const completed = workouts.filter(w => w.status === 'completed');
  const now = new Date();

  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let thisWeek = 0;
  let lastWeek = 0;
  let monthlyTotal = 0;

  for (const w of completed) {
    const wDate = new Date(w.startTime);
    if (wDate >= thisWeekStart) thisWeek++;
    else if (wDate >= lastWeekStart && wDate < thisWeekStart) lastWeek++;

    if (wDate >= thirtyDaysAgo) monthlyTotal++;
  }

  let streakWeeks = 0;
  let checkWeekStart = thisWeekStart;

  for (let i = 0; i < 52; i++) {
    const checkWeekEnd = new Date(checkWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const countInWeek = completed.filter(w => {
      const d = new Date(w.startTime);
      return d >= checkWeekStart && d < checkWeekEnd;
    }).length;

    if (countInWeek > 0) {
      streakWeeks++;
      checkWeekStart = new Date(checkWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (i === 0) {
      // If current week has 0 workouts yet, check previous week before ending streak
      checkWeekStart = new Date(checkWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  let description: string | undefined;
  if (thisWeek >= 4) {
    description = `You've completed ${thisWeek} workouts this week! Excellent training consistency.`;
  } else if (thisWeek > lastWeek && lastWeek > 0) {
    description = `Frequency boost: ${thisWeek} workouts completed this week compared to ${lastWeek} last week.`;
  }

  return {
    workoutsThisWeek: thisWeek,
    workoutsLastWeek: lastWeek,
    monthlyTotal,
    currentStreakWeeks: streakWeeks,
    insightDescription: description,
  };
}
