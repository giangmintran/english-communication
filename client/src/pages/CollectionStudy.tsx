import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, Layers, Clock, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { DeckWithItems, LearningItem } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { categorizeDeckItems, isItemDue, isItemMastered } from '@/lib/srs';
import { generateDailyReviewQuestions } from '@/lib/quizGenerator';
import { ReviewQuestion } from '@/types/quiz';
import { SessionHeader } from '@/components/collection/session/SessionHeader';
import { NewWordStudyCard } from '@/components/collection/session/NewWordStudyCard';
import { ImmediateCheckCard } from '@/components/collection/session/ImmediateCheckCard';
import { SRSReviewCard } from '@/components/collection/session/SRSReviewCard';
import { SessionSummary } from '@/components/collection/session/SessionSummary';
import { cn } from '@/lib/utils';

type StudyMode = 'adaptive' | 'new_only' | 'due_only';

interface LearningQueueItem {
  type: 'due_review' | 'new_word_study' | 'new_word_check';
  word: LearningItem;
  reviewQuestion?: ReviewQuestion;
}

export default function CollectionStudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { collectionReviews, collectionProgress, recordCollectionPhraseProgress } = useLearningStore();

  const colId = deckId || 'collection';
  const currentColProgress = collectionProgress[colId];
  const phraseStates = currentColProgress?.phrase_states || collectionReviews;

  // Sử dụng riêng tiến độ của Collection (hoàn toàn không liên quan đến decks/items/reviews)
  const effectiveReviews = useMemo(() => {
    return phraseStates;
  }, [phraseStates]);

  const [deck, setDeck] = useState<any>(null);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode>('adaptive');

  // Session state
  const [sessionQueue, setSessionQueue] = useState<LearningQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Stats for this session
  const [sessionNewWordsLearned, setSessionNewWordsLearned] = useState<Set<string>>(new Set());
  const [sessionWordsReviewed, setSessionWordsReviewed] = useState<Set<string>>(new Set());
  const [sessionWordsMastered, setSessionWordsMastered] = useState<Set<string>>(new Set());

  // 1. Tải thông tin deck và danh sách items
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

  // Phân loại từ vựng trong deck
  const categorized = useMemo(() => {
    return categorizeDeckItems(items, effectiveReviews);
  }, [items, effectiveReviews]);

  // Khởi tạo hàng đợi phiên học (Session Queue)
  const initializeSession = useCallback(
    (mode: StudyMode = 'adaptive') => {
      if (items.length === 0) return;

      const queue: LearningQueueItem[] = [];

      // A. Lấy từ đến hạn ôn tập (Due items)
      const dueToReview = mode === 'new_only' ? [] : categorized.dueItems;

      // Sinh câu hỏi ôn tập cho các từ đến hạn (1 câu hỏi chất lượng/từ để giữ nhịp học)
      if (dueToReview.length > 0) {
        const generatedQuestions = generateDailyReviewQuestions(
          dueToReview,
          dueToReview.length,
          'shuffled'
        );
        // Lấy 1 câu hỏi ngẫu nhiên cho mỗi từ đến hạn
        const seenWords = new Set<string>();
        for (const q of generatedQuestions) {
          if (!seenWords.has(q.wordId)) {
            const wordItem = dueToReview.find((w) => w.id === q.wordId);
            if (wordItem) {
              queue.push({
                type: 'due_review',
                word: wordItem,
                reviewQuestion: q,
              });
              seenWords.add(q.wordId);
            }
          }
        }
      }

      // B. Lấy tối đa 5 từ mới chưa từng học
      const newToLearn =
        mode === 'due_only'
          ? []
          : categorized.newItems.slice(0, 5);

      newToLearn.forEach((word) => {
        // Mỗi từ mới sẽ có 1 bước Học -> 1 bước Kiểm tra ngay
        queue.push({
          type: 'new_word_study',
          word,
        });
        queue.push({
          type: 'new_word_check',
          word,
        });
      });

      // Nếu không có cả từ due và từ new (ví dụ đã học hết và chưa đến hạn)
      if (queue.length === 0 && items.length > 0) {
        // Cho phép ôn tập 5 từ bất kỳ trong deck để củng cố
        const sampleWords = items.slice(0, 5);
        const fallbackQs = generateDailyReviewQuestions(sampleWords, sampleWords.length, 'shuffled');
        const seenWords = new Set<string>();
        for (const q of fallbackQs) {
          if (!seenWords.has(q.wordId)) {
            const wordItem = sampleWords.find((w) => w.id === q.wordId);
            if (wordItem) {
              queue.push({
                type: 'due_review',
                word: wordItem,
                reviewQuestion: q,
              });
              seenWords.add(q.wordId);
            }
          }
        }
      }

      setSessionQueue(queue);
      setCurrentIndex(0);
      setCorrectCount(0);
      setIsCompleted(false);
      setSessionNewWordsLearned(new Set());
      setSessionWordsReviewed(new Set());
      setSessionWordsMastered(new Set());
    },
    [items, categorized]
  );

  // Khởi tạo phiên khi nạp xong dữ liệu items
  useEffect(() => {
    if (items.length > 0 && sessionQueue.length === 0 && !isCompleted) {
      initializeSession(studyMode);
    }
  }, [items, studyMode, initializeSession, sessionQueue.length, isCompleted]);

  // Mục hiện tại trong hàng đợi
  const currentQueueItem = sessionQueue[currentIndex];

  // 2. Chuyển từ "Học từ mới" sang "Kiểm tra ngay"
  const handleProceedToCheck = () => {
    // Mục tiếp theo trong hàng đợi chính là 'new_word_check' của từ này
    if (currentIndex + 1 < sessionQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // 3. Kết quả "Kiểm tra ngay" cho từ mới
  const handleImmediateCheckResult = (isCorrect: boolean) => {
    if (!currentQueueItem) return;
    const word = currentQueueItem.word;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setSessionNewWordsLearned((prev) => new Set(prev).add(word.id));

      // Ghi nhận tiến độ riêng cho Collection (lưu bảng riêng collection_reviews)
      recordCollectionPhraseProgress(colId, word.id, 2, items.length, user?.id);
    } else {
      // Nếu trả lời sai: Đẩy cặp (học lại + kiểm tra lại) vào cuối hàng đợi phiên này
      setSessionQueue((prev) => [
        ...prev,
        { type: 'new_word_study', word },
        { type: 'new_word_check', word },
      ]);
    }
  };

  // 4. Kết quả ôn tập từ đến hạn (SRS Review)
  const handleSRSReviewAnswer = (isCorrect: boolean, userAnswer: string) => {
    if (!currentQueueItem) return;
    const word = currentQueueItem.word;

    const currentSRS = effectiveReviews[word.id];
    const prevRepetitions = currentSRS?.repetitions || 0;

    // Ghi nhận tiến độ SM-2 riêng cho Collection
    recordCollectionPhraseProgress(colId, word.id, isCorrect ? 2 : 0, items.length, user?.id);

    setSessionWordsReviewed((prev) => new Set(prev).add(word.id));

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // Nếu đúng liên tiếp lần 3 trở lên thì thăng hạng "Đã thuộc"
      if (prevRepetitions + 1 >= 3) {
        setSessionWordsMastered((prev) => new Set(prev).add(word.id));
      }
    }
  };

  // 5. Chuyển sang bước tiếp theo
  const handleNextStep = () => {
    if (currentIndex + 1 < sessionQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Học tiếp 5 từ mới
  const handleLearnMore = () => {
    initializeSession('new_only');
  };

  // Ôn lại phiên này
  const handleRestartSession = () => {
    initializeSession(studyMode);
  };

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  // Giao diện khi lỗi
  if (error || !deck || items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-base">
          {error || t('flashcards.noData')}
        </h3>
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('collectionDetail.back')}</span>
        </Link>
      </div>
    );
  }

  const targetDeckSlug = deck.slug || deck.id;

  // Giao diện khi hoàn thành phiên học
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <SessionSummary
          deckTitle={deck.title}
          deckSlugOrId={targetDeckSlug}
          newWordsLearned={sessionNewWordsLearned.size}
          wordsReviewed={sessionWordsReviewed.size}
          wordsMastered={sessionWordsMastered.size}
          totalDeckWords={items.length}
          hasMoreNewWords={categorized.newItems.length > sessionNewWordsLearned.size}
          onLearnMore={handleLearnMore}
          onRestart={handleRestartSession}
        />
      </div>
    );
  }

  // Nhãn giai đoạn hiện tại
  let stageLabel = t('collectionStudy.modeAdaptive');
  if (currentQueueItem) {
    if (currentQueueItem.type === 'due_review') {
      stageLabel = t('collectionStudy.stageDueReview');
    } else if (currentQueueItem.type === 'new_word_study') {
      stageLabel = t('collectionStudy.stageLearnNew');
    } else if (currentQueueItem.type === 'new_word_check') {
      stageLabel = t('collectionStudy.stageImmediateCheck');
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-5 sm:space-y-6">
      {/* 1. Header Navigation & Progress Bar */}
      <SessionHeader
        deckTitle={deck.title}
        deckSlugOrId={targetDeckSlug}
        currentStep={currentIndex + 1}
        totalSteps={sessionQueue.length || 1}
        autoPlayAudio={autoPlayAudio}
        onToggleAudio={() => setAutoPlayAudio(!autoPlayAudio)}
        stageLabel={stageLabel}
        correctCount={correctCount}
      />

      {/* 2. Main Interactive Learning Card */}
      {currentQueueItem && currentQueueItem.type === 'new_word_study' && (
        <NewWordStudyCard
          key={`study-${currentQueueItem.word.id}-${currentIndex}`}
          item={currentQueueItem.word}
          onProceedToCheck={handleProceedToCheck}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {currentQueueItem && currentQueueItem.type === 'new_word_check' && (
        <ImmediateCheckCard
          key={`check-${currentQueueItem.word.id}-${currentIndex}`}
          item={currentQueueItem.word}
          deckItems={items}
          onResult={handleImmediateCheckResult}
          onNext={handleNextStep}
          autoPlayAudio={autoPlayAudio}
        />
      )}

      {currentQueueItem && currentQueueItem.type === 'due_review' && currentQueueItem.reviewQuestion && (
        <SRSReviewCard
          key={`review-${currentQueueItem.reviewQuestion.id}-${currentIndex}`}
          question={currentQueueItem.reviewQuestion}
          reviewState={effectiveReviews[currentQueueItem.word.id]}
          onAnswer={handleSRSReviewAnswer}
          onNext={handleNextStep}
          autoPlayAudio={autoPlayAudio}
        />
      )}
    </div>
  );
}
