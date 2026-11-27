import { CollectionProgress } from '@/types/database';
import { DailyReviewProgress } from '@/types/quiz';
import { getLocalDateStr } from './srs';

export function isValidDateStr(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeLocalDateStr(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return getLocalDateStr(value);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    return null;
  }
  return getLocalDateStr(parsed);
}

export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().split('T')[0];
}

export function hasStudiedOnReview(review?: Partial<DailyReviewProgress> | null): boolean {
  if (!review) return false;
  if (review.isCompleted) return true;
  if ((review.answeredCount || 0) > 0) return true;
  if (review.results && Object.keys(review.results).length > 0) return true;
  if (review.flashcardGrades && Object.keys(review.flashcardGrades).length > 0) return true;
  return false;
}

export function collectStudiedDatesFromState(params: {
  dailyReviewProgress?: Record<string, DailyReviewProgress>;
  collectionProgress?: Record<string, CollectionProgress>;
  lessonProgress?: Record<string, { completed?: boolean; lastStudiedAt?: string }>;
  todayLearned?: number;
  lastLearnedDate?: string;
  extraDates?: Iterable<string>;
}): Set<string> {
  const dates = new Set<string>();

  if (params.dailyReviewProgress) {
    for (const [dateKey, review] of Object.entries(params.dailyReviewProgress)) {
      if (hasStudiedOnReview(review)) {
        const d = normalizeLocalDateStr(review?.date || dateKey);
        if (d) dates.add(d);
      }
    }
  }

  if (params.collectionProgress) {
    for (const col of Object.values(params.collectionProgress)) {
      if (col?.last_studied_at) {
        const d = normalizeLocalDateStr(col.last_studied_at);
        if (d) dates.add(d);
      }
      if (col?.phrase_states) {
        for (const ps of Object.values(col.phrase_states)) {
          if (ps?.last_reviewed_at) {
            const d = normalizeLocalDateStr(ps.last_reviewed_at);
            if (d) dates.add(d);
          }
        }
      }
    }
  }

  if (params.lessonProgress) {
    for (const lp of Object.values(params.lessonProgress)) {
      if (lp?.completed && lp.lastStudiedAt) {
        const d = normalizeLocalDateStr(lp.lastStudiedAt);
        if (d) dates.add(d);
      }
    }
  }

  if ((params.todayLearned || 0) > 0 && isValidDateStr(params.lastLearnedDate)) {
    dates.add(params.lastLearnedDate);
  }

  if (params.extraDates) {
    for (const raw of params.extraDates) {
      const d = normalizeLocalDateStr(raw);
      if (d) dates.add(d);
    }
  }

  return dates;
}

export function computeStreakFromDates(
  studiedDates: Set<string>,
  todayStr: string = getLocalDateStr()
): number {
  if (!isValidDateStr(todayStr)) return 0;

  let cursor: string | null = null;
  if (studiedDates.has(todayStr)) {
    cursor = todayStr;
  } else {
    const yesterday = shiftDateStr(todayStr, -1);
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

export function computeBestStreakFromDates(
  studiedDates: Set<string>,
  currentStreak: number = 0
): number {
  if (studiedDates.size === 0) return currentStreak;

  const sorted = Array.from(studiedDates).filter(isValidDateStr).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;

  for (const d of sorted) {
    if (prev && shiftDateStr(prev, 1) === d) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }

  return Math.max(best, currentStreak);
}

/**
 * Tính streak hiện tại khi vừa phát sinh hoạt động học tập trong ngày `activityDate`,
 * kết hợp cả lịch sử các ngày đã học và chuỗi streak đang có (cho trường hợp ôn lại cùng 1 bộ từ nhiều ngày).
 */
export function computeNextStreakOnActivity(params: {
  studiedDates: Set<string>;
  prevStreakDays: number;
  prevLastLearnedDate?: string | null;
  activityDate?: string;
}): number {
  const actDate = params.activityDate || getLocalDateStr();
  const dates = new Set(params.studiedDates);
  dates.add(actDate);

  const historyStreak = computeStreakFromDates(dates, actDate);
  const prevActive = normalizeLocalDateStr(params.prevLastLearnedDate);
  const prevStreak = Math.max(0, params.prevStreakDays || 0);
  const yesterday = shiftDateStr(actDate, -1);

  let incremental = 1;
  if (prevActive === actDate) {
    incremental = Math.max(1, prevStreak);
  } else if (prevActive === yesterday) {
    incremental = prevStreak === 0 ? 1 : prevStreak + 1;
  } else if (prevActive && prevActive > actDate) {
    incremental = Math.max(1, prevStreak);
  }

  return Math.max(incremental, historyStreak, 1);
}
