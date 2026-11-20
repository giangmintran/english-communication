import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { LearningItem } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import {
  StudyModeSelector,
  CollectionStudyMode,
} from '@/components/collection/study/StudyModeSelector';
import { FlashcardsMode } from '@/components/collection/study/modes/FlashcardsMode';
import { LearnMode } from '@/components/collection/study/modes/LearnMode';
import { TestMode } from '@/components/collection/study/modes/TestMode';

export default function CollectionStudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { collectionReviews, collectionProgress, recordCollectionPhraseProgress } =
    useLearningStore();

  const colId = deckId || 'collection';
  const currentColProgress = collectionProgress[colId];
  const phraseStates = currentColProgress?.phrase_states || collectionReviews;

  const effectiveReviews = useMemo(() => {
    return phraseStates || {};
  }, [phraseStates]);

  const [deck, setDeck] = useState<any>(null);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guest limit configuration
  const isGuest = !user;
  const GUEST_WORD_LIMIT = 10;
  const isLimited = isGuest && items.length > GUEST_WORD_LIMIT;

  const studyItems = useMemo(() => {
    if (isLimited) {
      return items.slice(0, GUEST_WORD_LIMIT);
    }
    return items;
  }, [items, isLimited]);

  // Track if guest has already taken a test for this collection
  const guestTestKey = `guest_test_taken_${deckId || 'default'}`;
  const [hasGuestTakenTest, setHasGuestTakenTest] = useState<boolean>(() => {
    try {
      return localStorage.getItem(guestTestKey) === 'true';
    } catch {
      return false;
    }
  });

  const handleMarkGuestTestTaken = useCallback(() => {
    try {
      localStorage.setItem(guestTestKey, 'true');
    } catch {}
    setHasGuestTakenTest(true);
  }, [guestTestKey]);

  // Settings & Mode
  const urlMode = searchParams.get('mode') as CollectionStudyMode | null;
  const initialMode: CollectionStudyMode =
    urlMode === 'flashcards' || urlMode === 'learn' || urlMode === 'test'
      ? urlMode
      : 'learn';

  const [studyMode, setStudyMode] = useState<CollectionStudyMode>(initialMode);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);
  const [learnSessionKey, setLearnSessionKey] = useState(0);

  // Starred phrases state from localStorage
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('starred_phrases');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
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

  // Đồng bộ chế độ với URL searchParams
  const handleSelectMode = (newMode: CollectionStudyMode) => {
    setStudyMode(newMode);
    setSearchParams({ mode: newMode });
  };

  // 1. Tải thông tin deck và danh sách từ vựng
  useEffect(() => {
    let mounted = true;

    async function loadDeck() {
      if (!deckId) return;
      try {
        setLoading(true);
        const data = await api.collections.getById(deckId);
        if (mounted && data) {
          setDeck(data);
          const loadedItems: LearningItem[] = (data.items || data.phrases || []) as any;
          setItems(loadedItems);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || 'Lỗi khi tải thông tin bộ sưu tập');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDeck();
    return () => {
      mounted = false;
    };
  }, [deckId]);

  // Ghi nhận tiến độ học vào Store và Supabase
  const handleRecordWordProgress = useCallback(
    (wordId: string, grade: 0 | 1 | 2 | 3) => {
      recordCollectionPhraseProgress(colId, wordId, grade, items.length, user?.id);
    },
    [colId, items.length, user?.id, recordCollectionPhraseProgress]
  );

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t('common.loading') || 'Đang tải...'}
        </p>
      </div>
    );
  }

  // Giao diện khi lỗi hoặc không có từ vựng
  if (error || !deck || items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-8 sm:my-12 p-6 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-card">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
          {error || t('flashcards.noData') || 'Chưa có từ vựng nào trong bộ sưu tập'}
        </h3>
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('collectionDetail.back') || 'Quay lại'}</span>
        </Link>
      </div>
    );
  }

  const targetDeckSlug = deck.slug || deck.id;

  return (
    <div className="max-w-4xl mx-auto py-2.5 sm:py-6 px-2.5 sm:px-6 space-y-4 sm:space-y-6 pb-safe">
      {/* Guest Trial Banner */}
      {isLimited && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('collectionStudy.guestTrialNoticeTitle', { current: studyItems.length, total: items.length })}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('collectionStudy.guestTrialNoticeDesc', { total: items.length })}
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <span>{t('collectionStudy.guestLoginBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 1. Header Navigation & Study Mode Selector */}
      <StudyModeSelector
        currentMode={studyMode}
        onSelectMode={handleSelectMode}
        deckTitle={deck.title}
        deckSlugOrId={targetDeckSlug}
        autoPlayAudio={autoPlayAudio}
        onToggleAudio={() => setAutoPlayAudio(!autoPlayAudio)}
        isShuffled={isShuffled}
        onToggleShuffle={() => setIsShuffled(!isShuffled)}
        isGuest={isGuest}
        totalWordsCount={items.length}
        activeWordsCount={studyItems.length}
      />

      {/* 2. Interactive Study Mode Content */}
      {studyMode === 'flashcards' && (
        <FlashcardsMode
          items={studyItems}
          reviews={effectiveReviews}
          starredIds={starredIds}
          onToggleStar={handleToggleStar}
          autoPlayAudio={autoPlayAudio}
          isShuffled={isShuffled}
          onToggleShuffle={() => setIsShuffled(!isShuffled)}
          onSwitchToLearn={() => handleSelectMode('learn')}
          isGuest={isGuest}
          totalCollectionWords={items.length}
        />
      )}

      {studyMode === 'learn' && (
        <LearnMode
          key={`learn-${studyItems.length}-${learnSessionKey}`}
          allItems={studyItems}
          reviews={effectiveReviews}
          onRecordProgress={handleRecordWordProgress}
          autoPlayAudio={autoPlayAudio}
          onLearnNextBatch={() => setLearnSessionKey((k) => k + 1)}
          onRestartBatch={() => setLearnSessionKey((k) => k + 1)}
          isGuest={isGuest}
          totalCollectionWords={items.length}
        />
      )}

      {studyMode === 'test' && (
        <TestMode
          key={`test-${studyItems.length}-${hasGuestTakenTest ? 'locked' : 'open'}`}
          items={studyItems}
          deckTitle={deck.title}
          autoPlayAudio={autoPlayAudio}
          onRecordProgress={handleRecordWordProgress}
          onSwitchToLearn={() => handleSelectMode('learn')}
          isGuest={isGuest}
          hasGuestTakenTest={hasGuestTakenTest}
          onMarkGuestTestTaken={handleMarkGuestTestTaken}
        />
      )}
    </div>
  );
}
