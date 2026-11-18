import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck';
import { LearningItem, DeckWithItems } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { useTranslation } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function LearnDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { todayGoal } = useLearningStore();
  const { t } = useTranslation();
  const [deck, setDeck] = useState<DeckWithItems | null>(null);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDeckData() {
      if (!deckId) return;
      const isDaily = deckId === 'daily';
      const targetDeckId = isDaily ? 'daily-conversations' : deckId;

      try {
        const deckData = await api.decks.getById(targetDeckId);
        if (mounted && deckData) {
          let loadedItems: LearningItem[] = deckData.flashcards || deckData.items || [];
          let formattedDeck = { ...deckData };

          if (isDaily) {
            formattedDeck = {
              ...formattedDeck,
              title: t('home.todaysGoal'),
              description: `${t('home.todaysGoal')} - ${todayGoal} ${t('common.words')}`,
            };
            if (loadedItems.length > 0) {
              loadedItems = loadedItems.slice(0, Math.max(todayGoal, 10));
            }
          }

          setDeck(formattedDeck);
          setItems(loadedItems);
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
  }, [deckId, todayGoal, t]);

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

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0B0F19] py-8 transition-colors">
      <FlashcardDeck deckTitle={deck.title} items={items} />
    </div>
  );
}
