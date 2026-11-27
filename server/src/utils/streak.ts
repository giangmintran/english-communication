export function isValidDateStr(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeDateStr(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
}

export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().split('T')[0];
}

export function hasDailyReviewActivity(row: {
  is_completed?: boolean | null;
  answered_count?: number | null;
  results?: Record<string, any> | null;
}): boolean {
  if (!row) return false;
  if (row.is_completed) return true;
  if ((row.answered_count || 0) > 0) return true;
  if (row.results && typeof row.results === 'object' && Object.keys(row.results).length > 0) {
    return true;
  }
  return false;
}

export function computeStreakFromDates(
  studiedDates: Set<string>,
  referenceDate: string
): number {
  if (!isValidDateStr(referenceDate)) return 0;

  let cursor: string | null = null;
  if (studiedDates.has(referenceDate)) {
    cursor = referenceDate;
  } else {
    const yesterday = shiftDateStr(referenceDate, -1);
    if (studiedDates.has(yesterday)) {
      cursor = yesterday;
    }
  }

  if (!cursor) return 0;

  let streak = 0;
  while (studiedDates.has(cursor)) {
    streak += 1;
    cursor = shiftDateStr(cursor, -1);
  }
  return streak;
}

export async function syncAndUpdateStreak(
  db: any,
  userId: string,
  options?: { activityDate?: string; referenceDate?: string }
): Promise<number> {
  const actDate = isValidDateStr(options?.activityDate) ? options!.activityDate : undefined;
  const refDate = isValidDateStr(options?.referenceDate)
    ? options!.referenceDate
    : actDate || new Date().toISOString().split('T')[0];

  try {
    const [{ data: profile }, { data: dailyRows }, { data: colRows }] = await Promise.all([
      db
        .from('profiles')
        .select('id, streak_count, last_active_date')
        .eq('id', userId)
        .maybeSingle(),
      db
        .from('daily_reviews')
        .select('review_date, is_completed, answered_count, results')
        .eq('user_id', userId)
        .order('review_date', { ascending: false })
        .limit(90),
      db
        .from('collection_reviews')
        .select('last_reviewed_at')
        .eq('user_id', userId)
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })
        .limit(200),
    ]);

    const studiedDates = new Set<string>();
    if (Array.isArray(dailyRows)) {
      for (const row of dailyRows) {
        if (hasDailyReviewActivity(row)) {
          const d = normalizeDateStr(row.review_date);
          if (d) studiedDates.add(d);
        }
      }
    }
    if (Array.isArray(colRows)) {
      for (const row of colRows) {
        const d = normalizeDateStr(row.last_reviewed_at);
        if (d) studiedDates.add(d);
      }
    }
    if (actDate) {
      studiedDates.add(actDate);
    }

    const historyStreak = computeStreakFromDates(studiedDates, refDate);
    const prevActive = normalizeDateStr(profile?.last_active_date);
    const currentDbStreak = Math.max(0, Number(profile?.streak_count || 0));

    let nextStreak: number;
    let nextLastActive = prevActive;

    if (actDate) {
      const actYesterday = shiftDateStr(actDate, -1);
      let incrementalStreak: number;

      if (!prevActive) {
        incrementalStreak = 1;
      } else if (prevActive === actDate) {
        incrementalStreak = Math.max(1, currentDbStreak);
      } else if (prevActive === actYesterday) {
        incrementalStreak = currentDbStreak === 0 ? 1 : currentDbStreak + 1;
      } else if (prevActive < actYesterday) {
        incrementalStreak = 1;
      } else {
        incrementalStreak = Math.max(1, currentDbStreak);
      }

      nextStreak = Math.max(incrementalStreak, historyStreak, 1);
      if (!prevActive || actDate > prevActive) {
        nextLastActive = actDate;
      }
    } else {
      const yesterday = shiftDateStr(refDate, -1);
      const isProfileAlive = Boolean(
        prevActive && (prevActive === refDate || prevActive === yesterday)
      );
      nextStreak = isProfileAlive ? Math.max(currentDbStreak, historyStreak) : historyStreak;
    }

    if (profile) {
      const updates: Record<string, any> = {};
      if (nextStreak !== currentDbStreak) {
        updates.streak_count = nextStreak;
      }
      if (nextLastActive && nextLastActive !== prevActive) {
        updates.last_active_date = nextLastActive;
      }
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await db.from('profiles').update(updates).eq('id', userId);
      }
    }

    return nextStreak;
  } catch (err: any) {
    console.warn('Could not sync user streak:', err?.message || err);
    return actDate ? 1 : 0;
  }
}
