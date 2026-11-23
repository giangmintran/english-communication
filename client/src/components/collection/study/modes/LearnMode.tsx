import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  HelpCircle,
  PenTool,
  Trophy,
  Eye,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Lock,
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import { SRSItemState } from '@/lib/srs';
import { speakText, stopSpeaking } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  LearnMasteryLevel,
  LearnWordProgress,
  LearnQueueItem,
  selectLearnBatch,
  initializeLearnWordStates,
  buildInitialLearnQueue,
  processLearnAnswer,
  isLearnBatchComplete,
} from '@/lib/adaptiveLearnEngine';

interface LearnModeProps {
  allItems: LearningItem[];
  reviews: Record<string, SRSItemState>;
  onRecordProgress: (wordId: string, grade: 0 | 1 | 2 | 3) => void;
  autoPlayAudio: boolean;
  onLearnNextBatch?: () => void;
  onRestartBatch?: () => void;
  isGuest?: boolean;
  totalCollectionWords?: number;
}

const FALLBACK_DISTRACTORS_VI = [
  'Xin lỗi, bạn có thể nhắc lại được không?',
  'Tôi muốn thanh toán bằng thẻ tín dụng',
  'Làm ơn cho tôi hỏi đường đến ga tàu điện ngầm',
  'Tôi cần sự giúp đỡ của bạn một chút',
  'Hẹn gặp lại bạn vào tuần tới nhé',
  'Rất vui được gặp bạn hôm nay',
  'Cho tôi xin thêm một chút thời gian',
  'Bạn có gợi ý món nào ngon không?',
];

const FALLBACK_DISTRACTORS_EN = [
  'Could you please repeat that?',
  'I would like to pay by credit card',
  'Excuse me, where is the subway station?',
  'I need a little help from you',
  'See you next week',
  'Nice to meet you today',
  'Give me a moment, please',
  'Do you have any recommendations?',
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function cleanAnswer(str: string): string {
  return str
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatIpa(ipa?: string): string {
  if (!ipa) return '';
  const trimmed = ipa.replace(/^\/+|\/+$/g, '').trim();
  return trimmed ? `/${trimmed}/` : '';
}

export function LearnMode({
  allItems,
  reviews,
  onRecordProgress,
  autoPlayAudio,
  onLearnNextBatch,
  onRestartBatch,
  isGuest,
  totalCollectionWords,
}: LearnModeProps) {
  const { t } = useTranslation();

  // 1. Chọn tối đa 10 từ mục tiêu cho phiên học hôm nay theo thuật toán cá nhân hóa
  const targetBatch = useMemo(() => {
    return selectLearnBatch(allItems, reviews, 10);
  }, [allItems, reviews]);

  // 2. Trạng thái độ thành thạo của các từ trong batch
  const [wordStates, setWordStates] = useState<Record<string, LearnWordProgress>>(() => {
    return initializeLearnWordStates(targetBatch, reviews);
  });

  // 3. Hàng đợi câu hỏi thích ứng (Dynamic Queue)
  const [queue, setQueue] = useState<LearnQueueItem[]>(() => {
    const initialStates = initializeLearnWordStates(targetBatch, reviews);
    return buildInitialLearnQueue(targetBatch, initialStates);
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Giai đoạn học: 'preview' (xem qua 1 lượt từ mới) hoặc 'quiz' (kiểm tra thích ứng)
  const [stage, setStage] = useState<'preview' | 'quiz'>('preview');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewViewMode, setPreviewViewMode] = useState<'card' | 'list'>('card');

  // Trạng thái trả lời câu hỏi hiện tại
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [typingInput, setTypingInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Thống kê phiên học
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Đếm số từ theo cấp độ
  const stats = useMemo(() => {
    const values = Object.values(wordStates);
    const unfamiliar = values.filter((w) => w.level === 0).length;
    const familiar = values.filter((w) => w.level === 1).length;
    const mastered = values.filter((w) => w.level === 2).length;
    return {
      total: values.length,
      unfamiliar,
      familiar,
      mastered,
      percent: values.length > 0 ? Math.round((mastered / values.length) * 100) : 0,
    };
  }, [wordStates]);

  const currentQueueItem = queue[currentIndex];

  const playAudio = useCallback(
    async (text: string) => {
      if (!text) return;
      stopSpeaking();
      setIsSpeaking(true);
      try {
        await speakText(text);
      } finally {
        setIsSpeaking(false);
      }
    },
    []
  );

  // Dừng phát âm thanh khi component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Tự động phát âm thanh nếu autoPlayAudio được bật
  useEffect(() => {
    if (stage === 'preview' && previewViewMode === 'card' && autoPlayAudio && targetBatch[previewIndex]) {
      stopSpeaking();
      const timer = setTimeout(() => {
        playAudio(targetBatch[previewIndex].english_text);
      }, 100);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [stage, previewIndex, previewViewMode, targetBatch, autoPlayAudio, playAudio]);

  useEffect(() => {
    if (stage === 'quiz' && currentQueueItem && autoPlayAudio && !isSessionFinished) {
      stopSpeaking();
      setIsSpeaking(false);
      const timer = setTimeout(() => {
        playAudio(currentQueueItem.item.english_text);
      }, 100);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [stage, currentIndex, currentQueueItem?.id, autoPlayAudio, isSessionFinished, playAudio]);

  // Focus ô gõ từ khi chuyển sang câu hỏi dạng typing
  useEffect(() => {
    if (currentQueueItem?.questionType === 'typing' && !isAnswered) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQueueItem?.questionType, isAnswered]);

  // Sinh 4 phương án trắc nghiệm cho câu hỏi dạng choice
  const options = useMemo(() => {
    if (!currentQueueItem || currentQueueItem.questionType !== 'choice') return [];

    const item = currentQueueItem.item;
    const format = currentQueueItem.choiceFormat || 'en_to_vi';

    if (format === 'vi_to_en') {
      const correctEnglish = item.english_text;
      const otherEn = allItems
        .filter((d) => d.id !== item.id && d.english_text !== correctEnglish)
        .map((d) => d.english_text);
      const pool = otherEn.length >= 3 ? otherEn : [...otherEn, ...FALLBACK_DISTRACTORS_EN];
      const uniquePool = Array.from(new Set(pool.filter((m) => m !== correctEnglish)));
      const chosenDistractors = shuffle(uniquePool).slice(0, 3);
      return shuffle([correctEnglish, ...chosenDistractors]);
    }

    // en_to_vi hoặc listening: chọn nghĩa tiếng Việt
    const correctMeaning = item.vietnamese_meaning;
    const otherVi = allItems
      .filter((d) => d.id !== item.id && d.vietnamese_meaning !== correctMeaning)
      .map((d) => d.vietnamese_meaning);
    const pool = otherVi.length >= 3 ? otherVi : [...otherVi, ...FALLBACK_DISTRACTORS_VI];
    const uniquePool = Array.from(new Set(pool.filter((m) => m !== correctMeaning)));
    const chosenDistractors = shuffle(uniquePool).slice(0, 3);
    return shuffle([correctMeaning, ...chosenDistractors]);
  }, [currentQueueItem?.id, allItems]);

  // Xử lý chọn đáp án trắc nghiệm
  const handleSelectChoice = (option: string, idx: number) => {
    if (isAnswered || !currentQueueItem) return;

    setSelectedChoiceIdx(idx);
    setIsAnswered(true);
    setTotalAttempts((prev) => prev + 1);

    const item = currentQueueItem.item;
    const format = currentQueueItem.choiceFormat || 'en_to_vi';
    const isRight =
      format === 'vi_to_en'
        ? option.trim().toLowerCase() === item.english_text.trim().toLowerCase()
        : option.trim().toLowerCase() === item.vietnamese_meaning.trim().toLowerCase();

    setIsCorrect(isRight);
    if (isRight) setCorrectAttempts((prev) => prev + 1);

    // Ghi nhận tiến độ vào SM-2
    onRecordProgress(item.id, isRight ? 2 : 0);

    // Cập nhật Dynamic Queue thích ứng
    const result = processLearnAnswer({
      currentQueue: queue,
      currentIndex,
      wordStates,
      wordId: item.id,
      isCorrect: isRight,
    });

    setQueue(result.updatedQueue);
    setWordStates(result.updatedWordStates);

    if (!isRight) {
      playAudio(item.english_text);
    }
  };

  // Xử lý nộp đáp án gõ từ
  const handleCheckTyping = () => {
    if (isAnswered || !currentQueueItem || !typingInput.trim()) return;

    setIsAnswered(true);
    setTotalAttempts((prev) => prev + 1);

    const item = currentQueueItem.item;
    const userClean = cleanAnswer(typingInput);
    const correctClean = cleanAnswer(item.english_text);
    const isRight = userClean === correctClean;

    setIsCorrect(isRight);
    if (isRight) setCorrectAttempts((prev) => prev + 1);

    onRecordProgress(item.id, isRight ? 3 : 0);

    const result = processLearnAnswer({
      currentQueue: queue,
      currentIndex,
      wordStates,
      wordId: item.id,
      isCorrect: isRight,
    });

    setQueue(result.updatedQueue);
    setWordStates(result.updatedWordStates);

    if (!isRight) {
      playAudio(item.english_text);
    }
  };

  // Nút "Tôi không biết / Xem đáp án" khi người dùng bí
  const handleGiveUpTyping = () => {
    if (isAnswered || !currentQueueItem) return;

    setIsAnswered(true);
    setIsCorrect(false);
    setTotalAttempts((prev) => prev + 1);

    const item = currentQueueItem.item;
    onRecordProgress(item.id, 0);

    const result = processLearnAnswer({
      currentQueue: queue,
      currentIndex,
      wordStates,
      wordId: item.id,
      isCorrect: false,
    });

    setQueue(result.updatedQueue);
    setWordStates(result.updatedWordStates);
    playAudio(item.english_text);
  };

  // Chuyển sang câu hỏi kế tiếp trong hàng đợi
  const handleNextQuestion = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setSelectedChoiceIdx(null);
    setTypingInput('');
    setIsAnswered(false);
    setIsCorrect(false);

    // Kiểm tra xem đã hoàn thành toàn bộ batch chưa
    const isBatchDone = isLearnBatchComplete(wordStates);
    if (isBatchDone) {
      setIsSessionFinished(true);
      return;
    }

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Nếu hết câu hỏi hiện tại nhưng vẫn còn từ chưa mastered (chẳng hạn retry vừa được add)
      // Tiếp tục kiểm tra
      if (!isBatchDone) {
        // Tái tạo hàng đợi cho các từ chưa đạt Level 2
        const remainingItems = targetBatch.filter((it) => wordStates[it.id]?.level !== 2);
        if (remainingItems.length > 0) {
          const newQueue = buildInitialLearnQueue(remainingItems, wordStates);
          setQueue((prev) => [...prev, ...newQueue]);
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsSessionFinished(true);
        }
      } else {
        setIsSessionFinished(true);
      }
    }
  };

  // Keyboard shortcut Enter để tiếp tục khi đã trả lời xong
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered && e.key === 'Enter') {
        e.preventDefault();
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered]);

  // ================= MÀN HÌNH HOÀN THÀNH BƯỚC HỌC =================
  if (isSessionFinished) {
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-5 sm:space-y-6 shadow-card max-w-lg mx-auto">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
          <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
            {t('daily.completedToday')}
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('collectionStudy.learnBatchCompleted', { total: stats.total })}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-2">
            {t('collectionStudy.learnBatchCompletedDesc', { total: stats.total })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 py-1">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">{t('collectionStudy.wordsMasteredTitle')}</span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.mastered} / {stats.total}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">{t('collectionStudy.accuracy')}</span>
            <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {accuracy}%
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1">
          <button
            onClick={() => {
              if (onRestartBatch) {
                onRestartBatch();
              } else {
                const initialStates = initializeLearnWordStates(targetBatch, reviews);
                setWordStates(initialStates);
                setQueue(buildInitialLearnQueue(targetBatch, initialStates));
                setCurrentIndex(0);
                setSelectedChoiceIdx(null);
                setTypingInput('');
                setIsAnswered(false);
                setIsSessionFinished(false);
                setStage('preview');
                setPreviewIndex(0);
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('collectionStudy.studyAgain')}</span>
          </button>

          {isGuest && totalCollectionWords && totalCollectionWords > 10 ? (
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{t('collectionStudy.loginToUnlockRemaining', { count: totalCollectionWords - 10 })}</span>
            </Link>
          ) : (
            allItems.length > 10 && onLearnNextBatch && (
              <button
                onClick={onLearnNextBatch}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>{t('collectionStudy.studyNextBatch')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // ================= MÀN HÌNH XEM QUA TỪ MỚI (PREVIEW STAGE) =================
  if (stage === 'preview') {
    const currentPreviewWord = targetBatch[previewIndex];
    const previewPercent = targetBatch.length > 0 ? Math.round(((previewIndex + 1) / targetBatch.length) * 100) : 0;

    return (
      <div className="space-y-3 sm:space-y-5 animate-in fade-in duration-200">
        {/* Top Header: Badge, Title & Mode Toggle / Skip Button */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                  <BookOpen className="w-3 h-3" />
                  <span>{t('collectionStudy.previewStage')}</span>
                </span>
                {isGuest && totalCollectionWords && totalCollectionWords > targetBatch.length && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                    {t('collectionStudy.guestTrialBadge', { current: targetBatch.length, total: totalCollectionWords })}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('collectionStudy.previewCardOfTotal', { current: previewIndex + 1, total: targetBatch.length })}
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                {t('collectionStudy.previewStageTitle', { count: targetBatch.length })}
              </h2>
            </div>

            {/* Quick Actions: View Toggle + Skip / Start Quiz */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('card')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
                    previewViewMode === 'card'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                  title={t('collectionStudy.previewViewCards')}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('collectionStudy.previewViewCards')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewMode('list')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
                    previewViewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  )}
                  title={t('collectionStudy.previewViewList')}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('collectionStudy.previewViewList')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStage('quiz')}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <span>{t('collectionStudy.startQuizQuickBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar in Card view */}
          {previewViewMode === 'card' && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${previewPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* PREVIEW VIEW MODE: CARD */}
        {previewViewMode === 'card' && currentPreviewWord && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card space-y-5 text-center">
            {/* Word details */}
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-center gap-2">
                {currentPreviewWord.difficulty_level && (
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentPreviewWord.difficulty_level}
                  </span>
                )}
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 capitalize">
                  {currentPreviewWord.type || 'từ vựng'}
                </span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words px-2">
                {currentPreviewWord.english_text}
              </h3>

              {formatIpa(currentPreviewWord.phonetic_ipa) && (
                <p className="text-xs sm:text-sm font-mono text-slate-400 dark:text-slate-500">
                  {formatIpa(currentPreviewWord.phonetic_ipa)}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => playAudio(currentPreviewWord.english_text)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{t('collectionStudy.listenAudio')}</span>
                </button>
              </div>
            </div>

            {/* Meaning & Example Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/60 max-w-xl mx-auto space-y-2 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {t('flashcards.vietnameseMeaning')}
                </span>
                <p className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {currentPreviewWord.vietnamese_meaning}
                </p>
              </div>

              {currentPreviewWord.example_sentence && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t('collectionStudy.exampleSentence')}
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                      "{currentPreviewWord.example_sentence}"
                    </p>
                    <button
                      type="button"
                      onClick={() => playAudio(currentPreviewWord.example_sentence!)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {currentPreviewWord.example_meaning && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      → {currentPreviewWord.example_meaning}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Card Navigator */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                disabled={previewIndex === 0}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('collectionStudy.previewPrevWord')}</span>
              </button>

              {previewIndex + 1 < targetBatch.length ? (
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => prev + 1)}
                  className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>{t('collectionStudy.previewNextWord')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStage('quiz')}
                  className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('collectionStudy.startQuizQuickBtn')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PREVIEW VIEW MODE: LIST */}
        {previewViewMode === 'list' && (
          <div className="space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {targetBatch.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {item.english_text}
                        </h4>
                      </div>
                      {formatIpa(item.phonetic_ipa) && (
                        <p className="text-[11px] font-mono text-slate-400">
                          {formatIpa(item.phonetic_ipa)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => playAudio(item.english_text)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                    {item.vietnamese_meaning}
                  </p>

                  {item.example_sentence && (
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      "{item.example_sentence}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTA to start quiz */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-card text-center">
              <button
                type="button"
                onClick={() => setStage('quiz')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('collectionStudy.startQuizBtn', { count: targetBatch.length })}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQueueItem) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
        {t('common.loading')}
      </div>
    );
  }

  const currentItem = currentQueueItem.item;
  const isLevel1Typing = currentQueueItem.questionType === 'typing';

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 1. Header Progress Bar & Mastery Counter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-card space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('collectionStudy.learnGoalTitle', { total: stats.total })}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setStage('preview')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              title={t('collectionStudy.reviewWordsBtn')}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('collectionStudy.reviewWordsBtn')}</span>
            </button>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {t('collectionStudy.learnMasteredCount', { mastered: stats.mastered, total: stats.total, percent: stats.percent })}
            </span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden flex">
          {/* Mastered (Green) */}
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(stats.mastered / (stats.total || 1)) * 100}%` }}
          />
          {/* Familiar (Yellow) */}
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${(stats.familiar / (stats.total || 1)) * 100}%` }}
          />
        </div>

        {/* Status badges */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>{t('collectionStudy.unfamiliarBadge', { count: stats.unfamiliar })}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
            <span>{t('collectionStudy.familiarBadge', { count: stats.familiar })}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
            <span>{t('collectionStudy.masteredBadge', { count: stats.mastered })}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-card space-y-4 sm:space-y-6">
        {/* Step indicator & Audio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLevel1Typing ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                <PenTool className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t('collectionStudy.level1Badge')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t('collectionStudy.level0Badge')}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => playAudio(currentItem.english_text)}
            className="p-1.5 sm:p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors cursor-pointer"
            title={t('collectionStudy.listenAudio')}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Question */}
        <div className="space-y-1.5 sm:space-y-2 text-center py-1 sm:py-2 px-1">
          {isLevel1Typing ? (
            <>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('collectionStudy.typePrompt')}
              </p>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 break-words">
                {currentItem.vietnamese_meaning}
              </h3>
              {formatIpa(currentItem.phonetic_ipa) && (
                <p className="text-[11px] sm:text-xs font-mono text-slate-400">
                  {t('collectionStudy.typeHint', { ipa: formatIpa(currentItem.phonetic_ipa) })}
                </p>
              )}
            </>
          ) : currentQueueItem.choiceFormat === 'vi_to_en' ? (
            <>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('collectionStudy.questionTypeViToEn')}
              </p>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400 break-words">
                {currentItem.vietnamese_meaning}
              </h3>
            </>
          ) : currentQueueItem.choiceFormat === 'listening' ? (
            <>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('collectionStudy.questionTypeListening')}
              </p>
              <button
                onClick={() => playAudio(currentItem.english_text)}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm hover:bg-blue-100 transition-colors cursor-pointer my-1 sm:my-2"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t('collectionStudy.playListeningPrompt')}</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('collectionStudy.questionTypeEnToVi')}
              </p>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                {currentItem.english_text}
              </h3>
              {formatIpa(currentItem.phonetic_ipa) && (
                <p className="text-xs font-mono text-slate-400">
                  {formatIpa(currentItem.phonetic_ipa)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Interaction Form: Choice or Typing */}
        {!isLevel1Typing ? (
          /* Multiple Choice Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {options.map((option, idx) => {
              const isSelected = selectedChoiceIdx === idx;
              const format = currentQueueItem.choiceFormat || 'en_to_vi';
              const isOptionCorrect =
                format === 'vi_to_en'
                  ? option.trim().toLowerCase() === currentItem.english_text.trim().toLowerCase()
                  : option.trim().toLowerCase() === currentItem.vietnamese_meaning.trim().toLowerCase();

              let btnStyle =
                'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/40';

              if (isAnswered) {
                if (isOptionCorrect) {
                  btnStyle =
                    'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else if (isSelected && !isOptionCorrect) {
                  btnStyle =
                    'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 line-through';
                } else {
                  btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectChoice(option, idx)}
                  className={cn(
                    'p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2.5 cursor-pointer disabled:cursor-default',
                    btnStyle
                  )}
                >
                  <span className="break-words">{option}</span>
                  {isAnswered && isOptionCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isOptionCorrect && (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Typing Form */
          <div className="max-w-md mx-auto space-y-2.5 sm:space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                disabled={isAnswered}
                value={typingInput}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setTypingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAnswered && typingInput.trim()) {
                    e.preventDefault();
                    handleCheckTyping();
                  }
                }}
                placeholder={t('collectionStudy.typeLetterPlaceholder', { letter: currentItem.english_text[0] })}
                className={cn(
                  'w-full px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border text-center text-sm sm:text-base font-bold transition-all outline-none',
                  isAnswered
                    ? isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 shadow-xs'
                )}
              />
            </div>

            {!isAnswered && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGiveUpTyping}
                  className="px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  title={t('collectionStudy.dontKnow')}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  <span>{t('collectionStudy.dontKnow')}</span>
                </button>

                <button
                  disabled={!typingInput.trim()}
                  onClick={handleCheckTyping}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {t('collectionStudy.checkAnswer')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Banner when Answered */}
        {isAnswered && (
          <div
            className={cn(
              'p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border space-y-2.5 sm:space-y-3 animate-in fade-in duration-200',
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-extrabold text-xs sm:text-sm">
                  {isCorrect
                    ? isLevel1Typing
                      ? t('collectionStudy.correctMasteredToast')
                      : t('collectionStudy.correctLevel1Toast')
                    : t('collectionStudy.incorrectToast')}
                </span>
              </div>
            </div>

            {!isCorrect && (
              <div className="text-xs space-y-1 bg-white/60 dark:bg-slate-900/60 p-2.5 sm:p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                <p>
                  {t('collectionStudy.correctAnswerLabel')}{' '}
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {currentItem.english_text}
                  </span>{' '}
                  ({currentItem.vietnamese_meaning})
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] sm:text-xs">
                  {t('collectionStudy.retryNotice')}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-0.5">
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>{t('collectionStudy.continueEnter')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
