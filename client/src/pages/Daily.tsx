import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Lock,
  Sparkles,
  Compass,
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  MessageCircle,
  Sun,
  HeartPulse,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { TodaysGoalCard } from '@/components/dashboard/TodaysGoalCard';
import { TodayLessonHeroCard } from '@/components/daily/TodayLessonHeroCard';
import { DailyFilterDrawer } from '@/components/daily/DailyFilterDrawer';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { api } from '@/lib/api';
import { lessonApi } from '@/lib/lessonApi';
import { Collection, DailyLesson } from '@/types/database';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  BriefcaseBusiness: Briefcase,
  MessageSquare,
  MessagesSquare: MessageSquare,
  MessageCircle,
  Sun,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  BookOpen,
};

export default function DailyLearningPage() {
  const { user, signInWithGoogle } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dynamicTodayLesson, setDynamicTodayLesson] = useState<DailyLesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { lessonProgress, collectionProgress } = useLearningStore();
  const { t, language } = useTranslation();

  const MAX_GUEST_COLLECTIONS = 5;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const masteredIds = Object.keys(lessonProgress).filter((k) => lessonProgress[k]?.completed);
        const [collectionsData, todayContent] = await Promise.all([
          api.collections.getAll(),
          lessonApi.getTodayLesson({ userMasteredIds: masteredIds, language }),
        ]);

        if (mounted) {
          if (collectionsData && collectionsData.length > 0) {
            setCollections(collectionsData);
          }
          if (todayContent?.lesson) {
            setDynamicTodayLesson(todayContent.lesson);
          }
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
  }, [language]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(collections.map((c) => c.category).filter(Boolean)));
    return ['all', ...cats];
  }, [collections]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return collections.length;
    return collections.filter((c) => c.category === cat).length;
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0);

  const todayFormatted = useMemo(() => {
    const now = new Date();
    if (language === 'en') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;
    }
    const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayOfWeek = dayNames[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${dayOfWeek}, ${date}/${month}`;
  }, [language]);

  // Chủ đề hôm nay: Ưu tiên bài học được sinh động (Hybrid Generator) theo từ chưa học
  const todayLesson = dynamicTodayLesson;

  const matchedCollectionForToday = todayLesson
    ? collections.find(
        (c) =>
          c.id === todayLesson.collection_id ||
          c.slug === todayLesson.collection_id?.replace(/^col-/, '') ||
          c.id === todayLesson.deck_id ||
          c.slug === todayLesson.deck_id?.replace(/^deck-/, '') ||
          c.id === `col-${todayLesson.deck_id?.replace(/^deck-/, '')}`
      )
    : undefined;

  const todayLessonProgress = todayLesson ? lessonProgress[todayLesson.id] : undefined;

  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const matchCategory = selectedCategory === 'all' || col.category === selectedCategory;

      const progress = collectionProgress[col.id] || collectionProgress[col.slug];
      const totalPhrases = col.total_phrases || col.phrases?.length || col.items?.length || 0;
      const isCompleted = Boolean(
        progress &&
        (progress.progress_percent >= 100 || (totalPhrases > 0 && progress.mastered_count >= totalPhrases))
      );
      const hasStarted = Boolean(progress && progress.learned_count > 0);

      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'completed' && isCompleted) ||
        (selectedStatus === 'in_progress' && hasStarted && !isCompleted);

      return matchCategory && matchStatus;
    });
  }, [collections, selectedCategory, selectedStatus, collectionProgress]);

  const isAllCollectionsDone =
    filteredCollections.length > 0 &&
    filteredCollections.every((col) => {
      const progress = collectionProgress[col.id] || collectionProgress[col.slug];
      const totalPhrases = col.total_phrases || col.phrases?.length || col.items?.length || 0;
      return Boolean(
        progress &&
        (progress.progress_percent >= 100 || (totalPhrases > 0 && progress.mastered_count >= totalPhrases))
      );
    });

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
                <span>{t('daily.guestModeTitle')}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  {t('daily.guestModeBadge')}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {t('daily.guestModeDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer transition-all"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>{t('daily.unlockAll')}</span>
          </button>
        </div>
      )}

      {/* TODAY'S FEATURED LESSON (Chủ đề hôm nay - 1 bài mỗi ngày) */}
      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/50 animate-pulse border border-slate-100 dark:border-slate-800" />
      ) : todayLesson ? (
        <TodayLessonHeroCard
          lesson={todayLesson}
          collectionTitle={matchedCollectionForToday?.title}
          deckTitle={matchedCollectionForToday?.title}
          progress={todayLessonProgress}
          isGuest={!user}
          todayFormatted={todayFormatted}
          onUnlock={() => setIsAuthModalOpen(true)}
          onExploreMore={() => {
            // Smooth scroll nhẹ xuống khu vực danh sách
            setTimeout(() => {
              const el = document.getElementById('more-lessons-section');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
        />
      ) : null}

      {/* EXPLORE MORE COLLECTIONS SECTION (Học thêm chủ đề khác) */}
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
                  {t('daily.moreTopics')}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {filteredCollections.length} {t('collections.words') ? 'chủ đề' : 'topics'}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                {t('daily.exploreMoreSubExpanded')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title={t('daily.resetFilter')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('daily.resetFilter')}</span>
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
              aria-label={t('daily.filterDrawerTitle')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('daily.filterBtn')}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-blue-600 font-extrabold text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Guest Limitation Notice in Explore More Topics */}
        {!user && (
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chế độ khách: Bạn được học thử 5 bộ từ vựng mẫu. Đăng nhập để mở khóa tất cả chủ đề!</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 cursor-pointer text-xs"
            >
              {t('daily.unlockAll')}
            </button>
          </div>
        )}

        {/* THÔNG BÁO KHI ĐÃ HỌC HẾT CÁC CHỦ ĐỀ ĐANG LỌC */}
        {isAllCollectionsDone && (
          <div className="rounded-3xl p-5 sm:p-7 border-2 border-emerald-200/90 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-sm text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/80 dark:ring-emerald-900/20 shadow-xs">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 fill-emerald-500" />
            </div>
            <div className="max-w-lg mx-auto space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('daily.completedTodayNoticeBadge')}</span>
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedCategory !== 'all'
                  ? `Bạn đã hoàn thành các chủ đề ${selectedCategory}!`
                  : t('daily.allTopicsDoneToday')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('daily.comeBackTomorrowNotice')}
              </p>
            </div>
          </div>
        )}

        {/* Full Collections List */}
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Active Filter Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-slate-400 font-medium mr-1">{t('daily.filteringLabel')}</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800">
                  <span>{selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="hover:text-blue-800 dark:hover:text-white cursor-pointer"
                    aria-label={t('daily.clearTopicFilter')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800">
                  <span>{selectedStatus === 'completed' ? t('daily.statusCompleted') : t('daily.statusInProgress')}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('all')}
                    className="hover:text-emerald-800 dark:hover:text-white cursor-pointer"
                    aria-label={t('daily.clearStatusFilter')}
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
                {t('daily.clearAllFilters')}
              </button>
            </div>
          )}

          {filteredCollections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('daily.empty')}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredCollections.map((col, idx) => {
                const Icon = iconMap[col.icon_name] || BookOpen;
                const progress = collectionProgress[col.id] || collectionProgress[col.slug];
                const totalPhrases = col.total_phrases || col.phrases?.length || col.items?.length || 0;
                const isCompleted = Boolean(
                  progress &&
                  (progress.progress_percent >= 100 || (totalPhrases > 0 && progress.mastered_count >= totalPhrases))
                );
                const hasStarted = Boolean(progress && progress.learned_count > 0);

                const isTodayTopic =
                  todayLesson &&
                  (todayLesson.collection_id === col.id ||
                    todayLesson.collection_id === col.slug ||
                    todayLesson.deck_id?.replace(/^deck-/, '') === col.slug ||
                    todayLesson.deck_id === col.id);

                const isLocked = !user && idx >= MAX_GUEST_COLLECTIONS;
                const isFreeTrial = !user && idx < MAX_GUEST_COLLECTIONS;

                return (
                  <div
                    key={col.id}
                    className={cn(
                      'group bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                      isTodayTopic
                        ? 'border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/10'
                        : isLocked
                          ? 'border-slate-100 dark:border-slate-800 opacity-90'
                          : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-lg'
                    )}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      {/* Image Thumbnail with Overlay */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                        {col.image_url ? (
                          <img
                            src={col.image_url}
                            alt={col.title}
                            className={cn(
                              'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
                              isLocked && 'filter grayscale contrast-125'
                            )}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Icon className="w-7 h-7" />
                          </div>
                        )}
                        {isLocked && (
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        )}
                        {isCompleted && !isLocked && (
                          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {isTodayTopic && (
                            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                              <span>{t('daily.todayTag')}</span>
                            </span>
                          )}

                          {col.category && (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              <span>{col.category}</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            <BookOpen className="w-3 h-3" />
                            <span>{totalPhrases} {t('collections.words')}</span>
                          </span>

                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('daily.completed')}</span>
                            </span>
                          )}

                          {hasStarted && !isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                              {progress?.learned_count}/{totalPhrases}
                            </span>
                          )}

                          {isFreeTrial && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 border border-blue-200/50 dark:border-blue-900/40">
                              <Sparkles className="w-3 h-3" />
                              <span>{t('daily.freeTrialTag')}</span>
                            </span>
                          )}

                          {isLocked && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center gap-1 border border-amber-200/50 dark:border-amber-800/40">
                              <Lock className="w-3 h-3" />
                              <span>{t('daily.lockedTag')}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {col.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {col.description}
                        </p>

                        {/* Progress Bar */}
                        {hasStarted && (
                          <div className="pt-1 max-w-xs">
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress?.progress_percent || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full sm:w-auto px-5 py-3 active:scale-95 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer border border-slate-200/80 dark:border-slate-700"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t('daily.unlockLesson')}</span>
                      </button>
                    ) : (
                      <Link
                        to={`/collections/${col.slug || col.id}`}
                        className={cn(
                          'w-full sm:w-auto px-5 py-3 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer',
                          isCompleted
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                            : hasStarted
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                              : 'bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700'
                        )}
                      >
                        <span>
                          {isCompleted
                            ? t('dailyLesson.reviewAgain')
                            : hasStarted
                              ? t('collectionDetail.continueLearning')
                              : t('daily.studyThisTopic')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Filter Drawer (Opens from right) */}
      <DailyFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
        }}
        selectedStatus={selectedStatus}
        onSelectStatus={(status) => {
          setSelectedStatus(status);
        }}
        onReset={handleResetFilters}
        getCategoryCount={getCategoryCount}
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
