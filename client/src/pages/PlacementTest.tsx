import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Award,
  BookOpen,
  Compass,
  Mic,
  Clock,
  ChevronDown,
  ChevronUp,
  Headphones,
  FileText,
  Layers,
  HelpCircle,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/context/LanguageContext';
import { useLearningStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { speakText, stopSpeaking, calculateSimilarity } from '@/lib/speech';
import { cn } from '@/lib/utils';
import {
  PlacementQuestion,
  PlacementTestResult,
  TestSkillType,
} from '@/types/database';
import {
  generatePlacementTestSession,
  calculatePlacementResults,
  saveGuestPlacementResult,
  UserAnswerInput,
} from '@/lib/placementEngine';

export default function PlacementTestPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { updateProfile } = useLearningStore();
  const navigate = useNavigate();

  // Trạng thái bài thi
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerInput>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<PlacementTestResult | null>(null);
  const [applied, setApplied] = useState(false);
  const [showReviewAccordion, setShowReviewAccordion] = useState(false);

  // Bộ đếm thời gian (Timer)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Trạng thái âm thanh & Thu âm Speaking
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Khởi tạo bài thi mới
  const initTestSession = () => {
    stopSpeaking();
    const session = generatePlacementTestSession();
    setQuestions(session);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setApplied(false);
    setElapsedSeconds(0);
    setShowReviewAccordion(false);
    setSpokenTranscript('');
    setRecordingError(null);
  };

  useEffect(() => {
    initTestSession();
  }, []);

  // Quản lý đồng hồ bấm giờ khi bài thi bắt đầu
  useEffect(() => {
    if (hasStarted && !isSubmitted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isSubmitted]);

  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length || 30;

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Phát âm thanh câu hỏi (Listening / Speaking)
  const handlePlayAudio = async (text: string) => {
    setIsPlayingAudio(true);
    await speakText(text);
    setIsPlayingAudio(false);
  };

  // Chọn đáp án trắc nghiệm
  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        userAnswer: optionIndex,
        scoreEarned: optionIndex === currentQ.correctIndex ? 1 : 0,
        isSkipped: false,
      },
    }));
  };

  // Bỏ qua câu Speaking nếu không tiện dùng mic
  const handleSkipSpeaking = () => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        userAnswer: t('placementTest.skippedSpeakingLabel'),
        scoreEarned: 0,
        isSkipped: true,
      },
    }));
  };

  // Thu âm phát âm qua Web Speech API
  const handleStartSpeaking = () => {
    if (!currentQ || !currentQ.targetSentence) return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordingError(t('placementTest.micUnsupported'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      setRecordingError(null);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenTranscript(transcript);
        const similarity = calculateSimilarity(transcript, currentQ.targetSentence!);
        const earned = similarity >= 0.8 ? 1 : similarity >= 0.5 ? 0.5 : 0;

        setUserAnswers((prev) => ({
          ...prev,
          [currentQ.id]: {
            questionId: currentQ.id,
            userAnswer: transcript,
            scoreEarned: earned,
            isSkipped: false,
          },
        }));
        setIsRecording(false);
      };

      recognition.onerror = (e: any) => {
        setIsRecording(false);
        if (e.error === 'not-allowed') {
          setRecordingError(t('placementTest.micPermissionDenied'));
        } else {
          setRecordingError(t('placementTest.micNoAudio'));
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setRecordingError(t('placementTest.micUnsupported'));
    }
  };

  // Nộp bài và hiển thị kết quả chẩn đoán
  const handleSubmitTest = async () => {
    stopSpeaking();
    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const calculated = calculatePlacementResults(questions, userAnswers);
    setResult(calculated);

    // Kích hoạt pháo hoa ăn mừng
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (_) { }

    // Lưu trữ
    if (user) {
      // Người dùng đã đăng nhập: Gửi API lưu vào Supabase
      try {
        await api.placementTest.submit(calculated);
      } catch (err) {
        console.warn('Lỗi khi đồng bộ kết quả lên máy chủ:', err);
      }
    } else {
      // Lưu vào localStorage
      saveGuestPlacementResult(calculated);
    }
  };

  // Chuyển câu hỏi
  const handleNext = () => {
    stopSpeaking();
    setSpokenTranscript('');
    setRecordingError(null);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    setSpokenTranscript('');
    setRecordingError(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Áp dụng trình độ vào Profile
  const handleApplyLevel = async () => {
    if (!result) return;
    updateProfile({ current_level: result.overall_level });

    if (user) {
      try {
        await api.profile.updateMe({ current_level: result.overall_level });
      } catch (err) {
        console.warn('Lỗi cập nhật level profile:', err);
      }
    }
    setApplied(true);
  };

  // Tên hiển thị kỹ năng theo i18n
  const getSkillLabel = (skill: TestSkillType) => {
    switch (skill) {
      case 'listening':
        return t('placementTest.skillListening');
      case 'vocabulary':
        return t('placementTest.skillVocabulary');
      case 'grammar':
        return t('placementTest.skillGrammar');
      case 'speaking':
        return t('placementTest.skillSpeaking');
      default:
        return skill;
    }
  };

  // Màu sắc badge kỹ năng
  const getSkillBadgeColor = (skill: TestSkillType) => {
    switch (skill) {
      case 'listening':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'vocabulary':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'grammar':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'speaking':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    }
  };

  const isCurrentAnswered =
    currentQ &&
    userAnswers[currentQ.id] !== undefined &&
    (userAnswers[currentQ.id].userAnswer !== -1 || userAnswers[currentQ.id].isSkipped);

  // Hiển thị điểm mạnh / yếu song ngữ
  const displayStrengths = useMemo(() => {
    if (!result) return [];
    if (language === 'en' && result.strengths_en && result.strengths_en.length > 0) {
      return result.strengths_en;
    }
    return result.strengths || [];
  }, [result, language]);

  const displayWeaknesses = useMemo(() => {
    if (!result) return [];
    if (language === 'en' && result.weaknesses_en && result.weaknesses_en.length > 0) {
      return result.weaknesses_en;
    }
    return result.weaknesses || [];
  }, [result, language]);

  const displayRecommendedTopic = useMemo(() => {
    if (!result) return '';
    if (language === 'en' && result.recommended_daily_topic_en) {
      return result.recommended_daily_topic_en;
    }
    return result.recommended_daily_topic || '';
  }, [result, language]);

  // ==========================================
  // RENDER: GIAO DIỆN
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 space-y-6">
      {/* 1. MÀN HÌNH KHỞI ĐỘNG (INTRO) */}
      {!hasStarted && !isSubmitted ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/40">
              {/* <Sparkles className="w-3.5 h-3.5" /> */}
              <span>{t('placementTest.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('placementTest.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('placementTest.subtitle')}
            </p>
          </div>

          {/* Test Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto py-2 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400">{t('placementTest.specsTotal')}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('placementTest.specsQuestionsVal')}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400">{t('placementTest.specsDuration')}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('placementTest.specsTimeVal')}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400">{t('placementTest.specsStandard')}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">CEFR A1 – B2</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-medium text-slate-400">{t('placementTest.specsSkills')}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t('placementTest.specsSkillsVal')}</p>
            </div>
          </div>



          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                initTestSession();
                setHasStarted(true);
              }}
              className="w-full sm:w-auto py-3.5 px-10 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 mx-auto transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <span>{t('placementTest.startBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : !isSubmitted ? (
        /* 2. MÀN HÌNH LÀM BÀI (TEST RUNNER - 30 CÂU) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card space-y-6">
          {/* Header tiến độ & Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">
                  {t('placementTest.questionOf', { current: currentIndex + 1, total: totalQuestions })}
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', getSkillBadgeColor(currentQ.skill))}>
                  {getSkillLabel(currentQ.skill)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-[11px]">
                  CEFR {currentQ.level}
                </span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Nội dung câu hỏi */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.prompt}
              </h2>
              {language === 'vi' && currentQ.promptVi && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  ({currentQ.promptVi})
                </p>
              )}
            </div>

            {/* Audio Prompt Button (Cho phần Listening hoặc Speaking) */}
            {currentQ.hasAudio && currentQ.audioText && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(currentQ.audioText!)}
                  disabled={isPlayingAudio}
                  className="inline-flex items-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <Volume2 className={cn('w-4 h-4', isPlayingAudio && 'animate-bounce')} />
                  <span>{isPlayingAudio ? t('placementTest.playingAudio') : t('placementTest.playAudio')}</span>
                </button>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {t('placementTest.repeatAudioHint')}
                </span>
              </div>
            )}
          </div>

          {/* Khu vực trả lời: Trắc nghiệm HOẶC Thu âm Speaking */}
          {currentQ.skill !== 'speaking' ? (
            /* Trắc nghiệm lựa chọn A, B, C, D */
            <div className="space-y-2.5">
              {currentQ.options?.map((opt, oIdx) => {
                const isSelected = userAnswers[currentQ.id]?.userAnswer === oIdx;

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(oIdx)}
                    className={cn(
                      'w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between gap-3 border',
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        )}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Phần thi Speaking & Phát âm phản xạ */
            <div className="space-y-5 p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {t('placementTest.readSentenceAloud')}
                </p>
                <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  "{currentQ.targetSentence}"
                </p>
              </div>

              {/* Nút Mic thu âm */}
              <div className="flex flex-col items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartSpeaking}
                  disabled={isRecording}
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md',
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-300/40'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30 hover:scale-105'
                  )}
                >
                  <Mic className="w-7 h-7" />
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isRecording ? t('placementTest.listeningMicrophone') : t('placementTest.clickToSpeak')}
                </span>
              </div>

              {/* Lỗi thu âm nếu có */}
              {recordingError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
                  {recordingError}
                </div>
              )}

              {/* Kết quả chữ nhận diện được */}
              {userAnswers[currentQ.id] && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1">
                  <p className="font-semibold text-slate-500">{t('placementTest.recognizedVoice')}</p>
                  <p className="font-bold text-slate-900 dark:text-white">
                    "{userAnswers[currentQ.id].userAnswer}"
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {t('placementTest.speechAccuracy')} {Math.round(userAnswers[currentQ.id].scoreEarned * 100)}%
                  </p>
                </div>
              )}

              {/* Nút Bỏ qua Speaking */}
              <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30 flex justify-center">
                <button
                  type="button"
                  onClick={handleSkipSpeaking}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline font-medium cursor-pointer"
                >
                  {t('placementTest.skipSpeaking')}
                </button>
              </div>
            </div>
          )}

          {/* Điều hướng Next / Back */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('placementTest.prevQuestion')}</span>
            </button>

            <button
              type="button"
              disabled={!isCurrentAnswered}
              onClick={handleNext}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{currentIndex === totalQuestions - 1 ? t('placementTest.submitTest') : t('placementTest.nextQuestion')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 3. MÀN HÌNH BÁO CÁO KẾT QUẢ CHẨN ĐOÁN & LỘ TRÌNH (RESULT REPORT) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-8">
          {/* Header kết quả */}
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {t('placementTest.resultTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t('placementTest.testCompletedIn', { time: formatTime(elapsedSeconds || 900) })}
              </p>
            </div>
          </div>

          {/* Level Hero Card */}
          <div className="max-w-lg mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-800/40 border-2 border-blue-500 shadow-md space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('placementTest.yourLevel')}
            </p>
            <div className="text-5xl sm:text-6xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {result?.overall_level || 'A2'}
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {t('placementTest.totalScore', { score: result?.overall_score || 0, total: 30, percent: result?.percentage || 0 })}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {result?.overall_level === 'A1' && t('placementTest.levelA1Desc')}
              {result?.overall_level === 'A2' && t('placementTest.levelA2Desc')}
              {result?.overall_level === 'B1' && t('placementTest.levelB1Desc')}
              {result?.overall_level === 'B2' && t('placementTest.levelB2Desc')}
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={applied}
                onClick={handleApplyLevel}
                className={cn(
                  'w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs',
                  applied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                )}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('placementTest.appliedSuccess')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('placementTest.applyLevelBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4 Skills Breakdown Cards */}
          <div className="space-y-3 max-w-2xl mx-auto text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('placementTest.skillsSummaryTitle')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Listening */}
              <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4" />
                    <span>{t('placementTest.skillListening')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    CEFR {result?.skill_scores?.listening?.level || 'A2'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-purple-100 dark:bg-purple-900/30 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${result?.skill_scores?.listening?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {result?.skill_scores?.listening?.score || 0}/{result?.skill_scores?.listening?.total || 8} pts ({result?.skill_scores?.listening?.percentage || 0}%)
                </p>
              </div>

              {/* Vocabulary */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>{t('placementTest.skillVocabulary')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    CEFR {result?.skill_scores?.vocabulary?.level || 'A2'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${result?.skill_scores?.vocabulary?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {result?.skill_scores?.vocabulary?.score || 0}/{result?.skill_scores?.vocabulary?.total || 8} pts ({result?.skill_scores?.vocabulary?.percentage || 0}%)
                </p>
              </div>

              {/* Grammar */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>{t('placementTest.skillGrammar')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    CEFR {result?.skill_scores?.grammar?.level || 'A2'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${result?.skill_scores?.grammar?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {result?.skill_scores?.grammar?.score || 0}/{result?.skill_scores?.grammar?.total || 8} pts ({result?.skill_scores?.grammar?.percentage || 0}%)
                </p>
              </div>

              {/* Speaking */}
              <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <Mic className="w-4 h-4" />
                    <span>{t('placementTest.skillSpeaking')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                    CEFR {result?.skill_scores?.speaking?.level || 'A2'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-rose-100 dark:bg-rose-900/30 overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full"
                    style={{ width: `${result?.skill_scores?.speaking?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {result?.skill_scores?.speaking?.score || 0}/{result?.skill_scores?.speaking?.total || 6} pts ({result?.skill_scores?.speaking?.percentage || 0}%)
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-2">
              <p className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('placementTest.strengthsTitle')}</span>
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                {displayStrengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 space-y-2">
              <p className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{t('placementTest.weaknessesTitle')}</span>
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                {displayWeaknesses.map((wk, idx) => (
                  <li key={idx}>{wk}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Lộ trình học tập cơ bản đề xuất (Roadmap recommendation) */}
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
              <Compass className="w-4 h-4" />
              <span>{t('placementTest.roadmapTitle', { level: result?.overall_level || 'A2' })}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('placementTest.roadmapDesc', { topic: displayRecommendedTopic })}
            </p>
            <div>
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('placementTest.exploreLevelCollections', { level: result?.overall_level || 'A2' })}</span>
              </Link>
            </div>
          </div>

          {/* Xem lại đáp án & Giải thích chi tiết */}
          <div className="max-w-2xl mx-auto text-left space-y-3">
            <button
              type="button"
              onClick={() => setShowReviewAccordion((prev) => !prev)}
              className="w-full py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>{t('placementTest.reviewQuestionsToggle')}</span>
              {showReviewAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showReviewAccordion && (
              <div className="space-y-3 pt-2">
                {questions.map((q, idx) => {
                  const ans = result?.answers?.find((a) => a.questionId === q.id);
                  const isCorrect = ans?.isCorrect;

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'p-4 rounded-2xl border text-xs space-y-2',
                        isCorrect
                          ? 'bg-emerald-50/30 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-red-50/30 border-red-200 dark:border-red-900/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {t('placementTest.questionNumber', { number: idx + 1 })} ({getSkillLabel(q.skill)} - CEFR {q.level})
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-md font-bold text-[10px]',
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          )}
                        >
                          {isCorrect
                            ? t('placementTest.correctScore')
                            : ans?.scoreEarned
                              ? t('placementTest.partialScore', { score: ans.scoreEarned })
                              : t('placementTest.incorrectScore')}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900 dark:text-white">
                        {currentQ.prompt} {q.targetSentence && `"${q.targetSentence}"`}
                      </p>

                      {q.options && (
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <p>
                            {t('placementTest.correctAnswerLabel')} <strong className="text-emerald-600">{q.options[q.correctIndex || 0]}</strong>
                          </p>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {t('placementTest.explanationLabel')} {language === 'vi' ? q.explanationVi : q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons (Làm lại bài kiểm tra) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                initTestSession();
                setHasStarted(true);
              }}
              className="w-full sm:w-auto py-2.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('placementTest.retakeTest')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
