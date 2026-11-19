import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Flame,
  SlidersHorizontal,
  X,
  RotateCcw,
  Lock,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { TodayLessonHeroCard } from '@/components/daily/TodayLessonHeroCard';
import { DailyFilterDrawer } from '@/components/daily/DailyFilterDrawer';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { api } from '@/lib/api';
import { lessonApi } from '@/lib/lessonApi';
import { Deck, DailyLesson } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function DailyLearningPage() {
  const { user, signInWithGoogle } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [lessons, setLessons] = useState<DailyLesson[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showMoreLessons, setShowMoreLessons] = useState(false);
  const [loading, setLoading] = useState(true);
  const { lessonProgress } = useLearningStore();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [decksData, lessonsData] = await Promise.all([
          api.decks.getAll(),
          lessonApi.getAll(),
        ]);

        if (mounted) {
          if (decksData && decksData.length > 0) setDecks(decksData);
          if (lessonsData && lessonsData.length > 0) setLessons(lessonsData);
        }
      } catch (err) {
        console.warn('Lỗi khi tải dữ liệu trong DailyLearningPage:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleResetFilters = () => {
    setSelectedDeckId('all');
    setSelectedLevel('all');
    setSelectedStatus('all');
  };

  const activeFilterCount =
    (selectedDeckId !== 'all' ? 1 : 0) +
    (selectedLevel !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0);

  // Khi có bộ lọc đang hoạt động, tự động bung danh sách ra để hiển thị kết quả lọc
  const isListExpanded = showMoreLessons || activeFilterCount > 0;

  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayFormatted = useMemo(() => {
    const now = new Date();
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayOfWeek = dayNames[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek}, ${date}/${month}`;
  }, []);

  // Chọn 1 chủ đề bất kỳ cho ngày hôm nay theo tiến độ bài chưa học
  const todayLesson = useMemo(() => {
    if (lessons.length === 0) return null;

    // Đối với khách chưa đăng nhập: Mặc định chọn bài mẫu đầu tiên (Free Trial)
    if (!user) {
      return lessons[0];
    }

    const storageKey = `speakup_daily_topic_${todayDateStr}`;
    const savedLessonId = localStorage.getItem(storageKey);

    // 1. Nếu đã lưu bài học cho ngày hôm nay và bài đó tồn tại trong danh sách
    if (savedLessonId) {
      const found = lessons.find((l) => l.id === savedLessonId);
      if (found) {
        return found;
      }
    }

    // 2. Nếu chưa lưu: Ưu tiên chọn 1 chủ đề bất kỳ từ các bài chưa hoàn thành
    const uncompleted = lessons.filter((l) => !lessonProgress[l.id]?.completed);

    let selected: DailyLesson;
    if (uncompleted.length > 0) {
      const randomIndex = Math.floor(Math.random() * uncompleted.length);
      selected = uncompleted[randomIndex];
    } else {
      // Nếu đã hoàn thành tất cả: Chọn ngẫu nhiên 1 bài để ôn tập lại hôm nay
      const randomIndex = Math.floor(Math.random() * lessons.length);
      selected = lessons[randomIndex];
    }

    // Lưu lại cho cả ngày hôm nay để không bị nhảy bài khi F5 hoặc chuyển trang
    try {
      localStorage.setItem(storageKey, selected.id);
    } catch (_) {}

    return selected;
  }, [lessons, lessonProgress, todayDateStr, user]);

  const selectedDeckTitle =
    selectedDeckId === 'all'
      ? t('daily.allLessons')
      : decks.find(
          (d) =>
            d.id === selectedDeckId ||
            d.slug === selectedDeckId ||
            d.id === `deck-${selectedDeckId}`
        )?.title || selectedDeckId;

  const filteredLessons = lessons.filter((l) => {
    const matchDeck =
      selectedDeckId === 'all' ||
      l.deck_id === selectedDeckId ||
      l.deck_id === `deck-${selectedDeckId}` ||
      l.deck_id.replace(/^deck-/, '') === selectedDeckId;

    const matchLevel = selectedLevel === 'all' || l.level === selectedLevel;

    const isCompleted = Boolean(lessonProgress[l.id]?.completed);
    const matchStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'completed' && isCompleted) ||
      (selectedStatus === 'in_progress' && !isCompleted);

    return matchDeck && matchLevel && matchStatus;
  });

  const matchedDeckForToday = todayLesson
    ? decks.find(
        (d) =>
          d.id === todayLesson.deck_id ||
          d.slug === todayLesson.deck_id.replace(/^deck-/, '')
      )
    : undefined;

  const todayLessonProgress = todayLesson ? lessonProgress[todayLesson.id] : undefined;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2 sm:gap-2.5">
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{t('daily.title')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          {t('daily.subtitle')}
        </p>
      </div>

      {/* Today's Goal Card (Từ vựng hàng ngày) */}
      <TodaysGoalCard />

      {/* Guest Mode Notice */}
      {!user && (
        <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/40 dark:border-amber-700/50">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Chế độ học thử (Khách)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  1 bài học mẫu miễn phí
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Bạn có thể trải nghiệm trọn vẹn chủ đề hôm nay. Đăng nhập Google để mở khóa toàn bộ các chủ đề và lưu streak học tập!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer transition-all"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>Mở khóa toàn bộ</span>
          </button>
        </div>
      )}

      {/* TODAY'S FEATURED LESSON (Chủ đề hôm nay - 1 bài mỗi ngày) */}
      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/50 animate-pulse border border-slate-100 dark:border-slate-800" />
      ) : todayLesson ? (
        <TodayLessonHeroCard
          lesson={todayLesson}
          deckTitle={matchedDeckForToday?.title}
          progress={todayLessonProgress}
          isGuest={!user}
          todayFormatted={todayFormatted}
          onUnlock={() => setIsAuthModalOpen(true)}
          onExploreMore={() => {
            setShowMoreLessons(true);
            // Smooth scroll nhẹ xuống khu vực danh sách
            setTimeout(() => {
              const el = document.getElementById('more-lessons-section');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        />
      ) : null}

      {/* EXPLORE MORE LESSONS SECTION (Học thêm chủ đề khác) */}
      <div id="more-lessons-section" className="space-y-4 pt-2">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isListExpanded ? 'Tất cả chủ đề bài học' : 'Học thêm chủ đề khác'}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {filteredLessons.length} bài
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                {isListExpanded
                  ? 'Chọn bất kỳ chủ đề nào bạn muốn khám phá hoặc luyện tập thêm hôm nay'
                  : 'Hoàn thành 1 bài mỗi ngày để đạt hiệu quả tốt nhất. Muốn học thêm? Hãy bấm để mở rộng.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Filter Button (chỉ hiện khi đã mở rộng hoặc đang có bộ lọc) */}
            {isListExpanded && (
              <>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Đặt lại bộ lọc"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95',
                    activeFilterCount > 0
                      ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                  aria-label="Mở bộ lọc bài học"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-blue-600 font-extrabold text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Toggle Expand / Collapse Button */}
            <button
              type="button"
              onClick={() => {
                if (isListExpanded && activeFilterCount > 0) {
                  handleResetFilters();
                }
                setShowMoreLessons(!isListExpanded);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 border',
                isListExpanded
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-500/20'
              )}
            >
              {isListExpanded ? (
                <>
                  <span>Thu gọn</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Hiển thị thêm ({Math.max(0, lessons.length - 1)} bài)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsed Preview Card */}
        {!isListExpanded && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Bạn muốn học thêm chủ đề khác?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Chúng tôi gợi ý 1 chủ đề mỗi ngày để bạn học sâu và không bị ngợp. Nếu bạn có thêm thời gian, bấm nút bên dưới để mở toàn bộ {lessons.length} chủ đề giao tiếp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMoreLessons(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold border border-blue-200/60 dark:border-blue-800 transition-all cursor-pointer active:scale-95"
            >
              <span>Xem tất cả các chủ đề</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Expanded View with Full Lessons List */}
        {isListExpanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs text-slate-400 font-medium mr-1">Đang lọc:</span>
                {selectedDeckId !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800">
                    <span>{selectedDeckTitle}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDeckId('all')}
                      className="hover:text-blue-800 dark:hover:text-white cursor-pointer"
                      aria-label="Xóa lọc chủ đề"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedLevel !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-semibold border border-purple-200/60 dark:border-purple-800">
                    <span>Level {selectedLevel}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLevel('all')}
                      className="hover:text-purple-800 dark:hover:text-white cursor-pointer"
                      aria-label="Xóa lọc trình độ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800">
                    <span>{selectedStatus === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('all')}
                      className="hover:text-emerald-800 dark:hover:text-white cursor-pointer"
                      aria-label="Xóa lọc trạng thái"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {filteredLessons.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('daily.empty')}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLessons.map((lesson, idx) => {
                  const matchedDeck = decks.find(
                    (d) =>
                      d.id === lesson.deck_id ||
                      d.slug === lesson.deck_id.replace(/^deck-/, '')
                  );
                  const progress = lessonProgress[lesson.id];
                  const isCompleted = progress?.completed;
                  const isTodayItem = todayLesson && lesson.id === todayLesson.id;

                  // Quy tắc giới hạn cho khách (Guest): chỉ được học bài đầu tiên
                  const isFreeTrial = !user && (idx === 0 || lesson.id === 'lesson-restaurant-01' || lesson.id === 'lesson-daily-1');
                  const isLocked = !user && !isFreeTrial;

                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        'group bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                        isTodayItem
                          ? 'border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/10'
                          : isLocked
                          ? 'border-slate-100 dark:border-slate-800 opacity-90'
                          : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-lg'
                      )}
                    >
                      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                        <div
                          className={cn(
                            'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl font-extrabold flex items-center justify-center text-sm shadow-md shrink-0',
                            isLocked
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-none'
                              : isCompleted
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                              : isTodayItem
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/30 ring-2 ring-blue-400/40'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20'
                          )}
                        >
                          {isLocked ? (
                            <Lock className="w-5 h-5" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {isTodayItem && (
                              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                                <span>Hôm nay</span>
                              </span>
                            )}

                            {matchedDeck && (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                {matchedDeck.title}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                              {lesson.level}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>~{lesson.estimated_minutes} {t('daily.min')}</span>
                            </span>
                            {isCompleted && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('daily.completed')}</span>
                              </span>
                            )}
                            {isFreeTrial && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 border border-blue-200/50 dark:border-blue-900/40">
                                <Sparkles className="w-3 h-3" />
                                <span>Học thử miễn phí</span>
                              </span>
                            )}
                            {isLocked && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-1 border border-amber-200/50 dark:border-amber-800/40">
                                <Lock className="w-3 h-3" />
                                <span>Khóa</span>
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {lesson.title}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {lesson.description}
                          </p>
                        </div>
                      </div>

                      {isLocked ? (
                        <button
                          type="button"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full sm:w-auto px-5 py-3 active:scale-95 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer border border-slate-200/80 dark:border-slate-700"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mở khóa bài học</span>
                        </button>
                      ) : (
                        <Link
                          to={`/daily/lesson/${lesson.id}`}
                          className={cn(
                            'w-full sm:w-auto px-5 py-3 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer',
                            isCompleted
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                              : isTodayItem
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                              : 'bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700'
                          )}
                        >
                          <span>
                            {isCompleted
                              ? t('dailyLesson.reviewAgain')
                              : isTodayItem
                              ? 'Học bài hôm nay'
                              : isFreeTrial
                              ? 'Học thử ngay'
                              : 'Học chủ đề này'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom button to collapse back */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowMoreLessons(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu gọn danh sách bài học</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Filter Drawer (Opens from right) */}
      <DailyFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        decks={decks}
        lessons={lessons}
        lessonProgress={lessonProgress}
        selectedDeckId={selectedDeckId}
        onSelectDeck={(deckId) => {
          setSelectedDeckId(deckId);
          setShowMoreLessons(true);
        }}
        selectedLevel={selectedLevel}
        onSelectLevel={(level) => {
          setSelectedLevel(level);
          setShowMoreLessons(true);
        }}
        selectedStatus={selectedStatus}
        onSelectStatus={(status) => {
          setSelectedStatus(status);
          setShowMoreLessons(true);
        }}
        onReset={handleResetFilters}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="daily_lesson"
      />
    </div>
  );
}
