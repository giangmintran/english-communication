import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  Mic,
  Play,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  X,
  Star,
  Layers,
  LayoutList,
  HelpCircle,
  Brain,
  FileCheck2,
  Share2,
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  Sun,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Collection, CollectionItem } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { speakText } from '@/lib/speech';
import { CollectionFlashcardViewer } from '@/components/collection/CollectionFlashcardViewer';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  BriefcaseBusiness: Briefcase,
  MessageSquare,
  MessagesSquare: MessageSquare,
  Sun,
  HeartPulse,
  Lightbulb,
  GraduationCap,
  BookOpen,
};

type FilterStatus = 'all' | 'needs_review' | 'mastered' | 'starred';

export default function CollectionDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const isGuest = !user;
  const { t } = useTranslation();
  const { collectionReviews, collectionProgress } = useLearningStore();

  const [collection, setCollection] = useState<Collection | null>(null);
  const deck = collection;
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('starred_phrases');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Chế độ hiển thị: 1 Thẻ lật & lướt (card) HOẶC Danh sách phân trang (list)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Tải thông tin collection và danh sách phrases
  useEffect(() => {
    let mounted = true;

    async function loadCollection() {
      if (!deckId) return;
      try {
        setLoading(true);
        const data = await api.collections.getById(deckId);
        if (mounted && data) {
          setCollection(data);
          const loadedPhrases: CollectionItem[] = (data.items || data.phrases || []) as CollectionItem[];
          setItems(loadedPhrases);
        }
      } catch (err) {
        console.warn('Lỗi khi tải thông tin bộ sưu tập:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCollection();
    return () => {
      mounted = false;
    };
  }, [deckId]);

  // Reset về trang 1 khi tìm kiếm hoặc thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // Lưu trạng thái Starred vào localStorage
  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem('starred_phrases', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Lỗi lưu starred:', err);
      }
      return next;
    });
  };

  // Phát âm audio bằng Web Speech API
  const handlePlayAudio = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId) return;
    setPlayingId(id);
    await speakText(text);
    setPlayingId(null);
  };

  // Chuyển trang kèm cuộn nhẹ lên đầu danh sách
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Lấy tiến độ riêng của Collection này (hoàn toàn không liên quan đến decks/items/reviews)
  const colId = collection?.id || deckId || '';
  const currentProgress = collectionProgress[colId] || collectionProgress[collection?.slug || ''];
  const phraseStates = currentProgress?.phrase_states || {};

  // Tính toán trạng thái học tập của riêng Collection này (tách biệt hoàn toàn với Daily Routine)
  const { masteredCount, learningCount, newCount, progressPercent } = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let notLearned = 0;

    items.forEach((item) => {
      const pState = phraseStates[item.id];
      if (!pState) {
        notLearned++;
      } else if (pState.is_mastered || (pState as any).repetitions >= 3 || (pState as any).interval_days >= 7) {
        mastered++;
      } else {
        learning++;
      }
    });

    const total = items.length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return {
      masteredCount: mastered,
      learningCount: learning,
      newCount: notLearned,
      progressPercent: percent,
    };
  }, [items, phraseStates]);

  // Lọc danh sách câu/từ theo tìm kiếm và tab
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText = item.english_text.toLowerCase().includes(query);
        const matchMeaning = item.vietnamese_meaning.toLowerCase().includes(query);
        const matchIpa = item.phonetic_ipa?.toLowerCase().includes(query);
        const matchExample = item.example_sentence?.toLowerCase().includes(query);
        if (!matchText && !matchMeaning && !matchIpa && !matchExample) {
          return false;
        }
      }

      // 2. Lọc theo trạng thái
      const pState = phraseStates[item.id];
      const isMastered = pState && (pState.is_mastered || (pState as any).repetitions >= 3 || (pState as any).interval_days >= 7);
      const isLearning = pState && !isMastered;
      const isStarred = starredIds.has(item.id);

      if (statusFilter === 'mastered') return isMastered;
      if (statusFilter === 'needs_review') return isLearning;
      if (statusFilter === 'starred') return isStarred;

      return true;
    });
  }, [items, searchQuery, statusFilter, phraseStates, starredIds]);

  // Dữ liệu phân trang
  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, startIndex, endIndex]);

  // Tạo mảng số trang thông minh có ellipsis
  const paginationRange = useMemo(() => {
    const delta = 1; // số trang hiển thị 2 bên trang hiện tại
    const range: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }
    return range;
  }, [totalPages, safeCurrentPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('flashcards.noData')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {t('collectionDetail.notFoundDesc')}
        </p>
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('collectionDetail.back')}</span>
        </Link>
      </div>
    );
  }

  // Chế độ khách (chưa đăng nhập): chỉ cho phép xem 5 bộ sưu tập mẫu (order_index <= 5)
  const isLockedForGuest = !user && collection && (collection.order_index > 5);

  if (isLockedForGuest) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50/50 dark:ring-amber-900/20">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{t('collectionDetail.guestLockedBadge')}</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {t('collectionDetail.guestLockedTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {t('collectionDetail.guestLockedDesc')}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => signInWithGoogle()}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>{t('collectionDetail.guestSignInBtn')}</span>
          </button>

          <Link
            to="/collections"
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors block"
          >
            <span>{t('collectionDetail.backToCollections')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = iconMap[deck.icon_name] || BookOpen;
  const targetDeckSlug = deck.slug || deck.id;

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-4 pb-8 space-y-6 no-scrollbar">
      {/* 1. Header Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>{t('collectionDetail.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
            {deck.category || t('collectionDetail.topicDefault')}
          </span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Desktop: 5/7, Mobile: 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ================= LEFT COLUMN: STICKY OVERVIEW & ACTIONS ================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
          {/* Deck Hero Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden relative">
            {/* Background image preview with soft blur overlay */}
            <div className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
              <img
                src={deck.image_url}
                alt={deck.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Badges on Hero Image */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 shadow-xs">
                  <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{deck.title}</span>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs text-slate-200 line-clamp-1">{deck.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    {items.length} {t('collectionDetail.phrases')}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ~{Math.max(10, Math.round(items.length * 0.25))} {t('common.mins')}
                  </span>
                </div>
              </div>
            </div>

            {/* Learning Progress Section */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">
                  {t('collectionDetail.progressTitle')}
                </span>
                <span className="text-blue-600 dark:text-blue-400">{progressPercent}%</span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(masteredCount / (items.length || 1)) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`${t('collectionDetail.mastered')}: ${masteredCount}`}
                />
                <div
                  style={{ width: `${(learningCount / (items.length || 1)) * 100}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`${t('collectionDetail.learning')}: ${learningCount}`}
                />
              </div>

              {/* Progress Breakdown Pills */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-2 text-center">
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {masteredCount}
                  </div>
                  <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 truncate">
                    {t('collectionDetail.mastered')}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-2 text-center">
                  <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {learningCount}
                  </div>
                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-300 truncate">
                    {t('collectionDetail.learning')}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 text-center">
                  <div className="text-sm font-extrabold text-slate-600 dark:text-slate-400">
                    {newCount}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {t('collectionDetail.notLearned')}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div className="mt-5">
              <Link
                to={`/collections/${targetDeckSlug}/learn`}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {progressPercent > 0
                    ? t('collectionDetail.continueLearning')
                    : t('collectionDetail.startLearning')}
                </span>
              </Link>
            </div>
          </div>

          {/* Study Modes Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              {t('collectionDetail.studyModes')}
            </h3>

            <div className="space-y-2.5">
              {/* Mode 1: Learn Mode (Quizlet-style Adaptive) */}
              <Link
                to={`/collections/${targetDeckSlug}/learn?mode=learn`}
                className="group flex items-center justify-between p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {t('collectionStudy.modeLearn')}
                      </h4>
                      {/* <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                        Quizlet
                      </span> */}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('collectionStudy.modeLearnDesc')}
                    </p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-blue-600 transition-colors" />
              </Link>

              {/* Mode 2: Flashcards */}
              <Link
                to={`/collections/${targetDeckSlug}/learn?mode=flashcards`}
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {t('collectionStudy.modeFlashcards')}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('collectionStudy.modeFlashcardsDesc')}
                    </p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              {/* Mode 3: Test Quiz */}
              <Link
                to={`/collections/${targetDeckSlug}/learn?mode=test`}
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {t('collectionStudy.modeTest')}
                      </h4>
                      {isGuest && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                          {t('collectionStudy.guestTestNotice')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('collectionStudy.modeTestDesc')}
                    </p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </Link>

              {/* Mode 4: AI Speaking Practice */}
              <Link
                to="/speaking"
                className="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t('collectionStudy.modeSpeaking')}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t('collectionStudy.modeSpeakingDesc')}
                    </p>
                  </div>
                </div>
                {/* <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" /> */}
              </Link>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CURRICULUM EXPLORER ================= */}
        <div ref={listTopRef} className="lg:col-span-7 space-y-4">
          {/* Search Bar & Filter Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('collectionDetail.curriculum')}</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {filteredItems.length}
                </span>
              </h2>

              <div className="flex items-center gap-2">
                {/* View Switcher: 1 Card Flip & Swipe vs List View */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer',
                      viewMode === 'card'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                    title={t('collectionDetail.viewCard')}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t('collectionDetail.viewCard')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer',
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                    title={t('collectionDetail.viewList')}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>{t('collectionDetail.viewList')}</span>
                  </button>
                </div>

                {/* Page size selector (chỉ hiện khi ở chế độ list và có > 10 từ) */}
                {viewMode === 'list' && totalFiltered > 10 && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t('collectionDetail.perPage')}:</span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                      {[10, 20, 50].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setPageSize(size)}
                          className={cn(
                            'px-2 py-0.5 rounded-md font-semibold text-[11px] transition-all',
                            pageSize === size
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('collectionDetail.searchPlaceholder')}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {t('collectionDetail.filterAll')} ({items.length})
              </button>

              <button
                onClick={() => setStatusFilter('needs_review')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1',
                  statusFilter === 'needs_review'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <span>{t('collectionDetail.filterNeedsReview')}</span>
                <span>({learningCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('mastered')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1',
                  statusFilter === 'mastered'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <span>{t('collectionDetail.filterMastered')}</span>
                <span>({masteredCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('starred')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1',
                  statusFilter === 'starred'
                    ? 'bg-yellow-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>{t('collectionDetail.filterStarred')}</span>
                <span>({starredIds.size})</span>
              </button>
            </div>
          </div>

          {/* Guest Limit Notice Banner */}
          {isGuest && items.length > 10 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t('collectionStudy.guestTrialNoticeTitle', { current: 10, total: items.length })}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    {t('collectionStudy.guestTrialNoticeDesc', { total: items.length })}
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                <span>{t('collectionStudy.guestLoginBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Vocabulary Card List */}
          {filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                {t('collectionDetail.emptySearch')}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  {t('collectionDetail.clearSearch')}
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            /* ================= MODE 1: THẺ LẬT & LƯỚT (1 CARD 1 TỪ) ================= */
            <CollectionFlashcardViewer
              items={isGuest && filteredItems.length > 10 ? filteredItems.slice(0, 10) : filteredItems}
              reviews={phraseStates}
              starredIds={starredIds}
              onToggleStar={toggleStar}
              playingId={playingId}
              onPlayAudio={handlePlayAudio}
              deckTitle={deck.title}
            />
          ) : (
            /* ================= MODE 2: DANH SÁCH TỪ VỰNG ================= */
            <>
              {/* Pagination Info Top */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
                <span>
                  {t('collectionDetail.showing')}{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {startIndex + 1}–{endIndex}
                  </strong>{' '}
                  {t('collectionDetail.of')}{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{totalFiltered}</strong>{' '}
                  {t('collectionDetail.phrases')}
                </span>
                <span>
                  {t('collectionDetail.page')}{' '}
                  <strong className="text-blue-600 dark:text-blue-400">{safeCurrentPage}</strong> /{' '}
                  {totalPages}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {(isGuest && items.length > 10 ? filteredItems.slice(0, 10) : paginatedItems).map((item, index) => {
                  const review = phraseStates[item.id];
                  const isMastered = review && ((review as any).is_mastered || review.repetitions >= 3 || review.interval_days >= 7);
                  const isLearning = review && !isMastered;
                  const isStarred = starredIds.has(item.id);
                  const isSpeaking = playingId === item.id;

                  return (
                    <div
                      key={item.id || index}
                      className="group bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* English phrase & Pronunciation */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                              {item.english_text}
                            </h4>

                            {/* Quick Audio Speak Button */}
                            <button
                              type="button"
                              onClick={(e) => handlePlayAudio(item.english_text, item.id, e)}
                              className={cn(
                                'p-1.5 rounded-full transition-all flex items-center justify-center',
                                isSpeaking
                                  ? 'bg-blue-600 text-white animate-pulse'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                              )}
                              title={t('collectionDetail.listenAudio')}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>

                            {item.phonetic_ipa && (
                              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                /{item.phonetic_ipa}/
                              </span>
                            )}
                          </div>

                          {/* Vietnamese Meaning */}
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {item.vietnamese_meaning}
                          </p>

                          {/* Context Example Sentence */}
                          {item.example_sentence && (
                            <div className="pt-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800/60">
                              <p className="italic text-slate-700 dark:text-slate-300 font-medium">
                                "{item.example_sentence}"
                              </p>
                              {item.example_meaning && (
                                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                  → {item.example_meaning}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Actions & Badges */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            {/* Starred Bookmark Button */}
                            <button
                              type="button"
                              onClick={(e) => toggleStar(item.id, e)}
                              className={cn(
                                'p-1.5 rounded-full transition-colors',
                                isStarred
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                              )}
                              title={isStarred ? t('collectionDetail.unstar') : t('collectionDetail.star')}
                            >
                              <Star className={cn('w-4 h-4', isStarred && 'fill-current')} />
                            </button>

                            {/* Difficulty level badge */}
                            {item.difficulty_level && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.difficulty_level}
                              </span>
                            )}
                          </div>

                          {/* Mastery status badge */}
                          {isMastered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('collectionDetail.mastered')}</span>
                            </span>
                          ) : isLearning ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">
                              <Clock className="w-3 h-3" />
                              <span>{t('collectionDetail.learning')}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-full">
                              {t('collectionDetail.notLearned')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guest Remaining Words Lock Card */}
              {isGuest && items.length > 10 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {t('collectionStudy.guestRemainingWordsLocked', { count: items.length - 10 })}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {t('collectionStudy.guestTrialNoticeDesc', { total: items.length })}
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('collectionStudy.guestUnlockAllBtn', { total: items.length })}</span>
                  </Link>
                </div>
              )}

              {/* Pagination Controls Bottom */}
              {!isGuest && totalPages > 1 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-card flex flex-wrap items-center justify-between gap-3 pt-3">
                  {/* Previous Button */}
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    className={cn(
                      'inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all',
                      safeCurrentPage <= 1
                        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('collectionDetail.prevPage')}</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {paginationRange.map((pageNumber, idx) => {
                      if (pageNumber === '...') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 py-1 text-xs text-slate-400 select-none font-bold"
                          >
                            ...
                          </span>
                        );
                      }

                      const pageNum = Number(pageNumber);
                      const isActive = pageNum === safeCurrentPage;

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            'w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center',
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25 scale-105'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    className={cn(
                      'inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all',
                      safeCurrentPage >= totalPages
                        ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400'
                    )}
                  >
                    <span className="hidden sm:inline">{t('collectionDetail.nextPage')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
