import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Volume2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowRight,
  Headphones,
  Languages,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import { speakText, stopSpeaking } from '@/lib/speech';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  TestQuestion,
  generateCollectionTest,
  evaluateTest,
  TestEvaluation,
} from '@/lib/testQuizGenerator';
import { TestResultReport } from '../summary/TestResultReport';

function formatIpa(ipa?: string): string {
  if (!ipa) return '';
  const trimmed = ipa.replace(/^\/+|\/+$/g, '').trim();
  return trimmed ? `/${trimmed}/` : '';
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

interface TestModeProps {
  items: LearningItem[];
  deckTitle: string;
  autoPlayAudio: boolean;
  onRecordProgress: (wordId: string, grade: 0 | 1 | 2 | 3) => void;
  onSwitchToLearn: () => void;
  isGuest?: boolean;
  hasGuestTakenTest?: boolean;
  onMarkGuestTestTaken?: () => void;
}

export function TestMode({
  items,
  deckTitle,
  autoPlayAudio,
  onRecordProgress,
  onSwitchToLearn,
  isGuest,
  hasGuestTakenTest,
  onMarkGuestTestTaken,
}: TestModeProps) {
  const { t } = useTranslation();

  // 1. Sinh bộ câu hỏi kiểm tra: tối đa 20 câu (hoặc ít hơn nếu items < 20)
  const [questions, setQuestions] = useState<TestQuestion[]>(() => {
    return generateCollectionTest(items, 20);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSelections, setUserSelections] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<TestEvaluation | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentQuestion = questions[currentIndex];

  const answeredCount = Object.keys(userSelections).length;
  const totalQuestions = questions.length;
  const unansweredCount = totalQuestions - answeredCount;
  const isAllAnswered = answeredCount === totalQuestions && totalQuestions > 0;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;
  const answeredPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const playAudio = useCallback(
    async (text: string) => {
      if (!text) return;
      stopSpeaking();
      setIsPlayingAudio(true);
      try {
        await speakText(text);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    []
  );

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (currentQuestion && autoPlayAudio && !isSubmitted) {
      if (currentQuestion.audioText) {
        stopSpeaking();
        const timer = setTimeout(() => {
          playAudio(currentQuestion.audioText!);
        }, 100);
        return () => {
          clearTimeout(timer);
          stopSpeaking();
        };
      }
    }
  }, [currentIndex, isSubmitted, autoPlayAudio, playAudio, currentQuestion?.audioText]);

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted || !currentQuestion) return;
    setUserSelections((prev) => ({
      ...prev,
      [currentQuestion.id]: optIdx,
    }));
  };

  const handleNext = () => {
    stopSpeaking();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Hỗ trợ phím tắt số 1, 2, 3, 4 hoặc A, B, C, D và mũi tên trái/phải
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!isSubmitted && currentQuestion) {
        if (e.key === '1' || e.key.toLowerCase() === 'a') {
          handleSelectOption(0);
        } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
          handleSelectOption(1);
        } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
          handleSelectOption(2);
        } else if (e.key === '4' || e.key.toLowerCase() === 'd') {
          handleSelectOption(3);
        }
      }

      if (e.key === 'ArrowRight') {
        if (currentIndex + 1 < questions.length) {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, currentQuestion, isSubmitted]);

  // Nộp bài kiểm tra
  const handleSubmitTest = () => {
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        t('collectionStudy.submitConfirm', { count: unansweredCount })
      );
      if (!confirmSubmit) return;
    }

    const evalResult = evaluateTest(questions, userSelections);
    setEvaluation(evalResult);
    setIsSubmitted(true);

    if (isGuest && onMarkGuestTestTaken) {
      onMarkGuestTestTaken();
    }

    // Ghi nhận tiến độ cho các từ vựng
    for (const ans of evalResult.correctAnswers) {
      onRecordProgress(ans.question.item.id, 2);
    }
    for (const ans of evalResult.incorrectAnswers) {
      onRecordProgress(ans.question.item.id, 0);
    }
  };

  // Thi lại toàn bộ bài
  const handleRetestAll = () => {
    setQuestions(generateCollectionTest(items, 20));
    setUserSelections({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setEvaluation(null);
  };

  // Thi lại chỉ các câu sai
  const handleRetestWrongOnly = () => {
    if (!evaluation || evaluation.incorrectAnswers.length === 0) return;

    const wrongItems = evaluation.incorrectAnswers.map((ans) => ans.question.item);
    setQuestions(generateCollectionTest(wrongItems, wrongItems.length));
    setUserSelections({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setEvaluation(null);
  };

  // Nếu khách đã làm bài test trước đó và chưa nộp lượt mới, hiển thị màn hình khóa
  if (isGuest && hasGuestTakenTest && !isSubmitted) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-card text-center space-y-5 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
            {t('collectionStudy.guestTestNotice')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {t('collectionStudy.guestTestLimitTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('collectionStudy.guestTestLimitDesc')}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span>{t('collectionStudy.guestLoginBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={onSwitchToLearn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <span>{t('collectionStudy.switchToLearn')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Nếu đã nộp bài, hiển thị Bảng báo cáo kết quả chi tiết
  if (isSubmitted && evaluation) {
    return (
      <TestResultReport
        evaluation={evaluation}
        onRetestAll={handleRetestAll}
        onRetestWrongOnly={evaluation.incorrectCount > 0 ? handleRetestWrongOnly : undefined}
        onSwitchToLearn={onSwitchToLearn}
        deckTitle={deckTitle}
        isGuest={isGuest}
      />
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
        {t('flashcards.noData')}
      </div>
    );
  }

  const selectedOpt = userSelections[currentQuestion.id];

  const getQuestionTypeInfo = () => {
    switch (currentQuestion.type) {
      case 'vi_to_en':
        return {
          icon: Languages,
          label: t('collectionStudy.questionTypeViToEn'),
          color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40',
        };
      case 'listening':
        return {
          icon: Headphones,
          label: t('collectionStudy.questionTypeListening'),
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40',
        };
      case 'en_to_vi':
      default:
        return {
          icon: BookOpen,
          label: t('collectionStudy.questionTypeEnToVi'),
          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40',
        };
    }
  };

  const typeInfo = getQuestionTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* 1. Header: Sleek Progress Bar, Stats & Submit Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-card space-y-3.5 transition-colors">
        <div className="flex items-center justify-between gap-3">
          {/* Question Counter & Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold bg-blue-600 text-white shadow-xs">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden xs:inline-flex items-center gap-1.5">
              <span>Đã trả lời:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {answeredCount}/{totalQuestions}
              </span>
            </span>

            {isGuest && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                {t('collectionStudy.guestTestNotice')}
              </span>
            )}
          </div>

          {/* Submit Test Button */}
          <button
            onClick={handleSubmitTest}
            className={cn(
              'px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs active:scale-95',
              isAllAnswered
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            )}
          >
            {isAllAnswered ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Nộp bài ngay</span>
              </>
            ) : (
              <span>{t('collectionStudy.submitTest')}</span>
            )}
          </button>
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 sm:h-2.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-300 ease-out shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 px-0.5">
            <span>Tiến độ bài thi</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card space-y-6 sm:space-y-7 transition-colors">
        {/* Top bar: Question Type badge & Audio Player */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', typeInfo.color)}>
            <TypeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{typeInfo.label}</span>
          </div>

          {currentQuestion.audioText && (
            <button
              onClick={() => playAudio(currentQuestion.audioText!)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95',
                isPlayingAudio
                  ? 'bg-blue-600 text-white border-blue-600 animate-pulse shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60'
              )}
              title={t('collectionStudy.listenAudio')}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Đang phát...' : 'Phát âm'}</span>
            </button>
          )}
        </div>

        {/* Prompt Section */}
        <div className="text-center py-2 sm:py-4 space-y-2.5 px-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white break-words leading-tight tracking-tight">
            {currentQuestion.prompt}
          </h2>

          {formatIpa(currentQuestion.item.phonetic_ipa) && currentQuestion.type === 'en_to_vi' && (
            <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700 text-xs font-mono text-slate-500 dark:text-slate-400">
              {formatIpa(currentQuestion.item.phonetic_ipa)}
            </div>
          )}
        </div>

        {/* 4 Option Choices (Responsive: 1 col on mobile, 2 col on tablet/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = selectedOpt === optIdx;
            const letter = OPTION_LETTERS[optIdx] || `${optIdx + 1}`;

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={cn(
                  'group relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] select-none',
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 text-blue-900 dark:text-blue-100 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-750 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Option Letter Badge (A, B, C, D) */}
                  <span
                    className={cn(
                      'w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 group-hover:border-slate-400'
                    )}
                  >
                    {letter}
                  </span>

                  {/* Option Text */}
                  <span className="text-xs sm:text-sm font-semibold break-words leading-relaxed">
                    {option}
                  </span>
                </div>

                {/* Right Selection Indicator */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-60 transition-opacity">
                    [{optIdx + 1}]
                  </span>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    )}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Navigation Buttons: Previous / Next / Submit */}
        <div className="flex items-center justify-between gap-3 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('collectionStudy.prevQuestion')}</span>
          </button>

          {/* Quick Counter in Center */}
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline-block">
            {currentIndex + 1} / {totalQuestions}
          </span>

          {/* Next Button or Submit */}
          {currentIndex + 1 < questions.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer select-none"
            >
              <span>{t('collectionStudy.nextQuestion')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitTest}
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer select-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('collectionStudy.submitTest')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
