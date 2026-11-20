import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { authenticateUser, AuthRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import { noCache } from '../middlewares/cache';
import { sanitizePostgrestParam } from '../utils/sanitize';

const router = Router();

// Đảm bảo tuyệt đối không cache tiến độ học cá nhân
router.use(noCache());

// GET /api/progress - Lấy tiến độ học của user hiện tại
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;
  try {
    // Ưu tiên lấy từ collection_reviews (mô hình chuẩn mới)
    const { data: colReviews, error: colErr } = await db
      .from('collection_reviews')
      .select('*')
      .eq('user_id', userId);

    if (!colErr && colReviews) {
      return sendSuccess(res, colReviews, 'Lấy tiến độ học thành công', 200, {
        total: colReviews.length,
      });
    }

    // Dự phòng bảng reviews cũ nếu chưa chạy migration
    const { data, error } = await db
      .from('reviews')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return sendSuccess(res, [], 'Chưa có tiến độ học', 200, { total: 0 });
    }

    return sendSuccess(res, data || [], 'Lấy tiến độ học thành công', 200, {
      total: data?.length || 0,
    });
  } catch (err: any) {
    return sendSuccess(res, [], 'Chưa có tiến độ học (fallback)', 200, { total: 0 });
  }
});

// POST /api/progress/record - Cập nhật tiến độ học cho 1 card/item
router.post('/record', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user.id;
  const db = authReq.supabase || supabase;
  const { itemId, collectionId, repetitions, intervalDays, easeFactor, nextReviewAt, lastQuality } = req.body;

  if (!itemId) {
    return sendError(res, 'itemId is required', 400, 'BAD_REQUEST');
  }

  try {
    const now = new Date().toISOString();
    const colId = collectionId || 'col-default';
    const cleanItemId = sanitizePostgrestParam(itemId);

    // 1. Thử lưu vào collection_reviews
    const { data: existingCol } = await db
      .from('collection_reviews')
      .select('id')
      .eq('user_id', userId)
      .or(`item_id.eq.${cleanItemId},phrase_id.eq.${cleanItemId}`)
      .maybeSingle();

    if (existingCol?.id) {
      await db
        .from('collection_reviews')
        .update({
          repetitions,
          interval_days: intervalDays,
          ease_factor: easeFactor,
          next_review_at: nextReviewAt,
          last_reviewed_at: now,
          last_quality: lastQuality,
          updated_at: now,
        })
        .eq('id', existingCol.id);
    } else {
      await db.from('collection_reviews').insert({
        user_id: userId,
        collection_id: colId,
        item_id: itemId,
        phrase_id: itemId,
        repetitions,
        interval_days: intervalDays,
        ease_factor: easeFactor,
        next_review_at: nextReviewAt,
        last_reviewed_at: now,
        last_quality: lastQuality,
      });
    }

    // Update last_active_date in profiles
    try {
      await db
        .from('profiles')
        .update({
          last_active_date: now,
          updated_at: now,
        })
        .eq('id', userId);
    } catch (_) {}

    return sendSuccess(res, { itemId, repetitions, intervalDays }, 'Lưu kết quả ôn tập thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'PROGRESS_UPDATE_ERROR');
  }
});

// Helper lấy tiến trình ôn tập từ DB hoặc metadata
async function getServerReviewProgress(db: any, user: any, targetDate: string) {
  try {
    const { data, error } = await db
      .from('daily_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('review_date', targetDate)
      .maybeSingle();

    if (!error && data) {
      return {
        date: data.review_date,
        deckId: data.deck_id || 'daily',
        wordIds: data.word_ids || [],
        currentIndex: data.current_index || 0,
        totalQuestions: data.total_questions || 60,
        answeredCount: data.answered_count || 0,
        correctCount: data.correct_count || 0,
        isCompleted: Boolean(data.is_completed),
        results: data.results || {},
        lastUpdated: data.updated_at,
      };
    }
  } catch (_) {}

  // Fallback lấy từ user_metadata
  const metaMap = user.user_metadata?.daily_review_progress || {};
  return metaMap[targetDate] || null;
}

// Helper lưu tiến trình ôn tập vào DB và metadata
async function saveServerReviewProgress(db: any, scopedClient: any, user: any, progress: any) {
  const now = new Date().toISOString();

  try {
    const { data: existing } = await db
      .from('daily_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('review_date', progress.date)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      review_date: progress.date,
      deck_id: progress.deckId || 'daily',
      word_ids: progress.wordIds || [],
      current_index: progress.currentIndex || 0,
      total_questions: progress.totalQuestions || 60,
      answered_count: progress.answeredCount || 0,
      correct_count: progress.correctCount || 0,
      is_completed: Boolean(progress.isCompleted),
      results: progress.results || {},
      updated_at: now,
    };

    if (existing?.id) {
      await db.from('daily_reviews').update(payload).eq('id', existing.id);
    } else {
      await db.from('daily_reviews').insert(payload);
    }
  } catch (_) {}

  // Đồng bộ vào user_metadata để đảm bảo không phụ thuộc migration SQL
  try {
    const currentMeta = user.user_metadata || {};
    const reviewMap = currentMeta.daily_review_progress || {};
    const updatedMap = {
      ...reviewMap,
      [progress.date]: {
        ...progress,
        lastUpdated: now,
      },
    };

    if (scopedClient?.auth?.updateUser) {
      await scopedClient.auth.updateUser({
        data: { daily_review_progress: updatedMap },
      });
    }
  } catch (_) {}

  // Cập nhật hàng loạt (Batch) SRS cho các từ vựng trong bài ôn tập
  if (progress.results && Object.keys(progress.results).length > 0) {
    await batchUpdateWordReviews(db, user.id, progress.results);
  }

  return { ...progress, lastUpdated: now };
}

// Helper cập nhật hàng loạt SRS cho các từ vựng
async function batchUpdateWordReviews(db: any, userId: string, results: Record<string, any>) {
  if (!results || Object.keys(results).length === 0) return;

  const wordStats: Record<string, { total: number; correct: number }> = {};
  for (const r of Object.values(results)) {
    const wordId = r.question?.wordId || r.wordId;
    if (!wordId) continue;
    if (!wordStats[wordId]) wordStats[wordId] = { total: 0, correct: 0 };
    wordStats[wordId].total++;
    if (r.isCorrect) wordStats[wordId].correct++;
  }

  const now = new Date().toISOString();
  for (const [wordId, stat] of Object.entries(wordStats)) {
    const grade = stat.correct === stat.total ? 3 : stat.correct > 0 ? 2 : 0;
    try {
      const cleanWordId = sanitizePostgrestParam(wordId);
      const { data: existing } = await db
        .from('collection_reviews')
        .select('id, repetitions, interval_days, ease_factor')
        .eq('user_id', userId)
        .or(`item_id.eq.${cleanWordId},phrase_id.eq.${cleanWordId}`)
        .maybeSingle();

      const currentReps = existing?.repetitions || 0;
      const currentInterval = existing?.interval_days || 1;
      const currentEase = existing?.ease_factor || 2.5;

      const newReps = grade >= 2 ? currentReps + 1 : 0;
      const newInterval = newReps <= 1 ? 1 : newReps === 2 ? 6 : Math.round(currentInterval * currentEase);
      const newEase = Math.max(1.3, currentEase + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)));

      const payload = {
        user_id: userId,
        collection_id: 'col-daily',
        item_id: wordId,
        phrase_id: wordId,
        repetitions: newReps,
        interval_days: newInterval,
        ease_factor: newEase,
        next_review_at: new Date(Date.now() + newInterval * 86400000).toISOString(),
        last_reviewed_at: now,
        last_quality: grade,
        updated_at: now,
      };

      if (existing?.id) {
        await db.from('collection_reviews').update(payload).eq('id', existing.id);
      } else {
        await db.from('collection_reviews').insert(payload);
      }
    } catch (_) {}
  }

  // Cập nhật last_active_date trong profiles
  try {
    await db.from('profiles').update({ last_active_date: now, updated_at: now }).eq('id', userId);
  } catch (_) {}
}

function mergeReviewProgress(serverP: any, clientP: any) {
  if (!serverP && !clientP) return null;
  if (!serverP) return clientP;
  if (!clientP) return serverP;

  const mergedResults = {
    ...(serverP.results || {}),
    ...(clientP.results || {}),
  };

  const answeredCount = Object.keys(mergedResults).length;
  const correctCount = Object.values(mergedResults).filter((r: any) => r.isCorrect).length;
  const totalQuestions = Math.max(serverP.totalQuestions || 60, clientP.totalQuestions || 60);
  const isCompleted = Boolean(
    serverP.isCompleted || clientP.isCompleted || (answeredCount >= totalQuestions && totalQuestions > 0)
  );
  const currentIndex = isCompleted
    ? totalQuestions
    : Math.max(serverP.currentIndex || 0, clientP.currentIndex || 0);

  return {
    date: clientP.date || serverP.date,
    deckId: clientP.deckId || serverP.deckId || 'daily',
    wordIds: clientP.wordIds?.length ? clientP.wordIds : (serverP.wordIds || []),
    currentIndex,
    totalQuestions,
    answeredCount,
    correctCount,
    isCompleted,
    results: mergedResults,
    lastUpdated: new Date().toISOString(),
  };
}

// GET /api/progress/daily-review - Lấy tiến trình ôn tập của ngày
router.get('/daily-review', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  try {
    const progress = await getServerReviewProgress(db, authReq.user, targetDate);
    return sendSuccess(res, progress, 'Lấy tiến trình ôn tập thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'GET_DAILY_REVIEW_ERROR');
  }
});

// POST /api/progress/daily-review - Lưu tiến trình ôn tập
router.post('/daily-review', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const { progress } = req.body;

  if (!progress || !progress.date) {
    return sendError(res, 'progress object with date is required', 400, 'BAD_REQUEST');
  }

  try {
    const saved = await saveServerReviewProgress(db, authReq.supabase, authReq.user, progress);
    return sendSuccess(res, saved, 'Lưu tiến trình ôn tập lên server thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'SAVE_DAILY_REVIEW_ERROR');
  }
});

// POST /api/progress/daily-review/merge - Gộp tiến trình khi đăng nhập
router.post('/daily-review/merge', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const { clientProgress } = req.body;

  try {
    const targetDate = clientProgress?.date || new Date().toISOString().split('T')[0];
    const serverProgress = await getServerReviewProgress(db, authReq.user, targetDate);
    const merged = mergeReviewProgress(serverProgress, clientProgress);

    if (merged) {
      await saveServerReviewProgress(db, authReq.supabase, authReq.user, merged);
    }

    return sendSuccess(res, merged, 'Gộp tiến trình ôn tập thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'MERGE_DAILY_REVIEW_ERROR');
  }
});

// DELETE /api/progress/daily-review - Đặt lại tiến trình ôn tập
router.delete('/daily-review', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

  try {
    try {
      await db
        .from('daily_reviews')
        .delete()
        .eq('user_id', authReq.user.id)
        .eq('review_date', targetDate);
    } catch (_) {}

    try {
      const currentMeta = authReq.user.user_metadata || {};
      const reviewMap = { ...(currentMeta.daily_review_progress || {}) };
      delete reviewMap[targetDate];

      if (authReq.supabase?.auth?.updateUser) {
        await authReq.supabase.auth.updateUser({
          data: { daily_review_progress: reviewMap },
        });
      }
    } catch (_) {}

    return sendSuccess(res, null, 'Đặt lại tiến trình ôn tập thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'RESET_DAILY_REVIEW_ERROR');
  }
});

// POST /api/progress/daily-lesson - Lưu kết quả hoàn thành bài học Daily Lesson 7 bước
router.post('/daily-lesson', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const userId = authReq.user.id;
  const { date, lessonId, collectionId, sprintDay, wordIds, score, totalQuestions, completed } = req.body;

  const reviewDate = date || new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  try {
    const { data: existing } = await db
      .from('daily_reviews')
      .select('id, results')
      .eq('user_id', userId)
      .eq('review_date', reviewDate)
      .maybeSingle();

    const lessonResults = {
      ...(existing?.results || {}),
      daily_lesson: {
        lessonId,
        collectionId: collectionId || 'col-restaurant',
        sprintDay: sprintDay || 1,
        wordIds: wordIds || [],
        score: score || 0,
        totalQuestions: totalQuestions || 8,
        completed: completed !== false,
        completedAt: now,
      },
    };

    const payload = {
      user_id: userId,
      review_date: reviewDate,
      deck_id: collectionId || 'daily',
      word_ids: wordIds || [],
      is_completed: true,
      correct_count: score || 0,
      total_questions: totalQuestions || 8,
      results: lessonResults,
      updated_at: now,
    };

    if (existing?.id) {
      await db.from('daily_reviews').update(payload).eq('id', existing.id);
    } else {
      await db.from('daily_reviews').insert(payload);
    }

    // Cập nhật streak & last_active_date trong profiles
    try {
      await db.from('profiles').update({
        last_active_date: now,
        updated_at: now,
      }).eq('id', userId);
    } catch (_) {}

    return sendSuccess(res, { reviewDate, lessonId, completed: true }, 'Lưu kết quả bài học thành công');
  } catch (err: any) {
    return sendError(res, err.message, 500, 'SAVE_DAILY_LESSON_ERROR');
  }
});

// GET /api/progress/history - Lấy danh sách lịch sử các ngày đã học
router.get('/history', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const db = authReq.supabase || supabase;
  const userId = authReq.user.id;

  try {
    const { data, error } = await db
      .from('daily_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('review_date', { ascending: false })
      .limit(60);

    if (error) {
      return sendSuccess(res, [], 'Chưa có lịch sử học');
    }

    const formatted = (data || []).map((row: any) => ({
      date: row.review_date,
      isCompleted: Boolean(row.is_completed),
      score: row.correct_count,
      totalQuestions: row.total_questions,
      collectionId: row.deck_id,
      wordIds: row.word_ids || [],
      lessonInfo: row.results?.daily_lesson || null,
      completedAt: row.updated_at,
    }));

    return sendSuccess(res, formatted, 'Lấy lịch sử học thành công');
  } catch (err: any) {
    return sendSuccess(res, [], 'Chưa có lịch sử học');
  }
});

export default router;
