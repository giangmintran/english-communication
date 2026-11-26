import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { LearningItem, DeckWithItems } from '@/types/database';
import { DailyWordReason } from '@/types/quiz';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getLocalDateStr } from '@/lib/srs';
import { selectDailyWordsWithReasons, loadDailyWordsFromCollectionItems } from '@/lib/dailyWordSelector';

export default function LearnDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, todayGoal } = useLearningStore();
  const { t } = useTranslation();
  const [deck, setDeck] = useState<DeckWithItems | null>(null);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [wordReasons, setWordReasons] = useState<Record<string, DailyWordReason>>({});
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (authLoading) return;

    async function loadDeckData() {
      if (!deckId) return;
      const isDaily = deckId === 'daily' || deckId === 'deck-daily';
      const targetDeckId = isDaily ? 'daily' : deckId;

      try {
        const deckData = await api.decks.getById(targetDeckId);
        if (mounted && deckData) {
          let loadedItems: LearningItem[] = deckData.flashcards || deckData.items || [];
          let loadedReasons: Record<string, DailyWordReason> = {};
          let formattedDeck = { ...deckData };

          if (isDaily) {
            const targetCount = !user ? Math.min(5, todayGoal || 5) : (profile?.daily_goal_words || todayGoal || 20);
            const todayStr = getLocalDateStr();
            const colSourceItems = await loadDailyWordsFromCollectionItems();
            const selection = selectDailyWordsWithReasons({
              dateStr: todayStr,
              targetCount,
              sourceItems: colSourceItems,
              user,
            });
            loadedItems = selection.words;
            loadedReasons = selection.reasons;

            // Đồng bộ wordIds và wordReasons của ngày hôm nay vào dailyReviewProgress nếu chưa bắt đầu làm bài
            const storeState = useLearningStore.getState();
            const currentDaily = storeState.dailyReviewProgress[todayStr];
            const hasStarted = Boolean(
              currentDaily &&
                (currentDaily.answeredCount > 0 ||
                  currentDaily.isCompleted ||
                  (currentDaily.flashcardGrades && Object.keys(currentDaily.flashcardGrades).length > 0))
            );
            if (!hasStarted) {
              storeState.saveDailyReviewProgressLocal({
                date: todayStr,
                deckId: 'daily',
                wordIds: loadedItems.map((w) => w.id),
                wordReasons: loadedReasons,
                currentIndex: 0,
                totalQuestions: loadedItems.length * 3,
                answeredCount: 0,
                correctCount: 0,
                isCompleted: false,
                results: {},
                lastUpdated: new Date().toISOString(),
              });
            }

            formattedDeck = {
              ...formattedDeck,
              title: t('home.todaysGoal'),
              description: `${t('home.todaysGoal')} - ${targetCount} ${t('common.words')}`,
            };
          } else {
            // Giới hạn học từ mới cho khách (Guest): Tối đa 5 từ
            const GUEST_WORD_LIMIT = 5;
            if (!user && loadedItems.length > GUEST_WORD_LIMIT) {
              loadedItems = loadedItems.slice(0, GUEST_WORD_LIMIT);
            }
          }

          setDeck(formattedDeck);
          setItems(loadedItems);
          setWordReasons(loadedReasons);
        }
      } catch (err) {
        console.warn('Lỗi khi tải thông tin deck:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDeckData();
    return () => {
      mounted = false;
    };
  }, [deckId, todayGoal, profile?.daily_goal_words, t, user?.id, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deck || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">{t('flashcards.noData')}</p>
        <Link to="/" className="text-blue-600 dark:text-blue-400 font-semibold mt-2 inline-block">
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  const isDaily = deckId === 'daily' || deckId === 'deck-daily';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0F19] py-8 transition-colors">
      {/* Guest Mode Notice */}
      {!user && (
        <div className="max-w-4xl mx-auto mb-4 px-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-800 dark:text-amber-300 font-medium truncate">
                {t('flashcards.guestTrialLimitNotice')}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0 cursor-pointer"
            >
              {t('flashcards.unlockAll')}
            </button>
          </div>
        </div>
      )}

      <FlashcardDeck
        deckTitle={deck.title}
        items={items}
        isDaily={isDaily}
        wordReasons={wordReasons}
      />

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        feature="vocab"
      />
    </div>
  );
}
