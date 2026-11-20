import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  BookOpen,
  Puzzle,
  MessageCircle,
  Headphones,
  Mic,
  Trophy,
  Check,
} from 'lucide-react';
import { DailyLessonContent } from '@/types/database';
import { WarmupStep } from './WarmupStep';
import { VocabularyStep } from './VocabularyStep';
import { GrammarStep } from './GrammarStep';
import { ExpressionsStep } from './ExpressionsStep';
import { ListeningStep } from './ListeningStep';
import { SpeakingStep } from './SpeakingStep';
import { PracticeStep } from './PracticeStep';
import { LessonComplete } from './LessonComplete';
import { useTranslation } from '@/context/LanguageContext';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface LessonStepperProps {
  lessonContent: DailyLessonContent;
}

const steps = [
  { key: 'warmup', label: 'Warm-up', icon: Flame },
  { key: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { key: 'grammar', label: 'Grammar', icon: Puzzle },
  { key: 'expressions', label: 'Expressions', icon: MessageCircle },
  { key: 'listening', label: 'Listening', icon: Headphones },
  { key: 'speaking', label: 'Speaking', icon: Mic },
  { key: 'practice', label: 'Practice', icon: Trophy },
];

export function LessonStepper({ lessonContent }: LessonStepperProps) {
  const { lessonProgress, recordLessonProgress } = useLearningStore();
  const savedProgress = lessonProgress[lessonContent.lesson.id];

  // Khôi phục lại đúng bước học đang dang dở của bài học nếu trước đó đã học (vd: đang học Grammar bước 2)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (savedProgress && !savedProgress.completed && typeof savedProgress.currentStep === 'number') {
      return Math.min(Math.max(0, savedProgress.currentStep), steps.length - 1);
    }
    return 0;
  });

  const [completed, setCompleted] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(lessonContent.practice.length);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isPracticeFinished = totalQuestions > 0 ? answeredQuestions >= totalQuestions : true;

  // Đồng bộ lại khi lessonId thay đổi
  React.useEffect(() => {
    const saved = lessonProgress[lessonContent.lesson.id];
    if (saved && !saved.completed && typeof saved.currentStep === 'number') {
      setCurrentStep(Math.min(Math.max(0, saved.currentStep), steps.length - 1));
    }
  }, [lessonContent.lesson.id]);

  const goToStep = (stepIdx: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(stepIdx);
    recordLessonProgress(lessonContent.lesson.id, {
      currentStep: stepIdx,
      completed: false,
    });
  };

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      recordLessonProgress(lessonContent.lesson.id, {
        currentStep: next,
        completed: false,
      });
    } else {
      setCompleted(true);
      recordLessonProgress(
        lessonContent.lesson.id,
        {
          currentStep: 6,
          completed: true,
          quizScore: practiceScore,
          totalQuestions,
        },
        {
          collectionId: lessonContent.lesson.collection_id || lessonContent.lesson.deck_id,
          sprintDay: lessonContent.lesson.sprint_day || 1,
          wordIds: lessonContent.vocabulary.map((v) => v.id),
          dateStr: new Date().toISOString().split('T')[0],
        }
      );
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const prev = currentStep - 1;
      setCurrentStep(prev);
      recordLessonProgress(lessonContent.lesson.id, {
        currentStep: prev,
        completed: false,
      });
    }
  };

  const handleReviewAgain = () => {
    setCurrentStep(0);
    setCompleted(false);
    setPracticeScore(0);
    recordLessonProgress(lessonContent.lesson.id, {
      currentStep: 0,
      completed: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (completed) {
    return (
      <LessonComplete
        lessonContent={lessonContent}
        score={practiceScore}
        totalQuestions={totalQuestions}
        onReviewAgain={handleReviewAgain}
      />
    );
  }

  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header: Exit, Step Indicator & Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            to="/daily"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('dailyLesson.exit')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('dailyLesson.step')} {currentStep + 1} {t('dailyLesson.of')} {steps.length}:
            </span>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
              {steps[currentStep].label}
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator Pills (scrollable on tiny screens) */}
        <div className="-mx-2 px-2 sm:mx-0 sm:px-0 flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isCurrent = idx === currentStep;
            const isDone = idx < currentStep;

            return (
              <button
                key={st.key}
                onClick={() => goToStep(idx)}
                className={cn(
                  'flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer min-w-[36px] sm:min-w-0',
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
                title={st.label}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Content Area */}
      <div className="min-h-[460px]">
        {currentStep === 0 && (
          <WarmupStep lesson={lessonContent.lesson} warmup={lessonContent.warmup} />
        )}
        {currentStep === 1 && (
          <VocabularyStep vocabulary={lessonContent.vocabulary} />
        )}
        {currentStep === 2 && (
          <GrammarStep grammar={lessonContent.grammar} />
        )}
        {currentStep === 3 && (
          <ExpressionsStep expressions={lessonContent.expressions} />
        )}
        {currentStep === 4 && (
          <ListeningStep listening={lessonContent.listening} />
        )}
        {currentStep === 5 && (
          <SpeakingStep speaking={lessonContent.speaking} />
        )}
        {currentStep === 6 && (
          <PracticeStep
            practice={lessonContent.practice}
            onScoreUpdate={(score, total, answeredCount) => {
              setPracticeScore(score);
              setTotalQuestions(total);
              setAnsweredQuestions(answeredCount);
            }}
          />
        )}
      </div>

      {/* Bottom Sticky/Floating Navigation Controls */}
      <div className="sticky bottom-2 sm:bottom-4 z-20 flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 sm:gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dailyLesson.previous')}</span>
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex-1 sm:flex-none justify-center px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/25 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('dailyLesson.finishLesson')}</span>
            {answeredQuestions > 0 && (
              <span className="text-[11px] opacity-85 font-normal">
                ({answeredQuestions}/{totalQuestions})
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 sm:flex-none justify-center px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-md shadow-blue-500/25 cursor-pointer"
          >
            <span>{t('dailyLesson.continue')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
