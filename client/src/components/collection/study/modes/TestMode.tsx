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
} from 'lucide-react';
import { LearningItem } from '@/types/database';
import { speakText } from '@/lib/speech';
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

  const playAudio = useCallback(
    async (text: string) => {
      if (isPlayingAudio) return;
      setIsPlayingAudio(true);
      try {
        await speakText(text);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [isPlayingAudio]
  );

  useEffect(() => {
    if (currentQuestion && autoPlayAudio && !isSubmitted) {
      if (currentQuestion.audioText) {
        playAudio(currentQuestion.audioText);
      }
    }
  }, [currentIndex, isSubmitted]);

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted || !currentQuestion) return;
    setUserSelections((prev) => ({
      ...prev,
      [currentQuestion.id]: optIdx,
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

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
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-card text-center space-y-5 max-w-lg mx-auto">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span>{t('collectionStudy.guestLoginBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={onSwitchToLearn}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
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

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 1. Header: Quick summary & Submit button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-card flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">
              {t('collectionStudy.testTitle', { total: questions.length })}
            </span>
            {isGuest && (
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                {t('collectionStudy.guestTestNotice')}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
            {t('collectionStudy.answeredCount', { current: answeredCount, total: totalQuestions })}
          </p>
        </div>

        <button
          onClick={handleSubmitTest}
          className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          {t('collectionStudy.submitTest')}
        </button>
      </div>

      {/* 2. Numbered Question Palette / Navigator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-3xl p-2.5 sm:p-4 shadow-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {questions.map((q, idx) => {
            const isAnswered = userSelections[q.id] !== undefined;
            const isCurrent = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold shrink-0 transition-all flex items-center justify-center cursor-pointer',
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-900'
                    : isAnswered
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-card space-y-4 sm:space-y-6">
        {/* Top: Question Number & Audio */}
        <div className="flex items-center justify-between">
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            {t('collectionStudy.questionNumber', { current: currentIndex + 1, total: totalQuestions })}
          </span>

          {currentQuestion.audioText && (
            <button
              onClick={() => playAudio(currentQuestion.audioText!)}
              className="p-1.5 sm:p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors cursor-pointer"
              title={t('collectionStudy.listenAudio')}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Prompt */}
        <div className="text-center py-1 sm:py-2 space-y-1.5 sm:space-y-2 px-1">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {currentQuestion.type === 'vi_to_en'
              ? t('collectionStudy.questionTypeViToEn')
              : currentQuestion.type === 'listening'
              ? t('collectionStudy.questionTypeListening')
              : t('collectionStudy.questionTypeEnToVi')}
          </p>

          <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white break-words">
            {currentQuestion.prompt}
          </h3>

          {formatIpa(currentQuestion.item.phonetic_ipa) && currentQuestion.type === 'en_to_vi' && (
            <p className="text-xs font-mono text-slate-400">
              {formatIpa(currentQuestion.item.phonetic_ipa)}
            </p>
          )}
        </div>

        {/* 4 Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {currentQuestion.options.map((option, optIdx) => {
            const isSelected = selectedOpt === optIdx;

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={cn(
                  'p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2.5 cursor-pointer',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <span className="break-words">{option}</span>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  )}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Buttons: Previous / Next */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('collectionStudy.prevQuestion')}</span>
          </button>

          {currentIndex + 1 < questions.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>{t('collectionStudy.nextQuestion')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
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
