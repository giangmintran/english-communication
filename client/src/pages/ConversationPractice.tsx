import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Volume2,
  Mic,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  SkipForward,
  Play,
  Users,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/context/LanguageContext';
import { useLearningStore } from '@/lib/store';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Import realistic lesson dialogue datasets
import restaurant01 from '@/data/lessons/restaurant-lesson-01.json';
import restaurant02 from '@/data/lessons/restaurant-lesson-02.json';
import shopping01 from '@/data/lessons/shopping-lesson-01.json';
import travel01 from '@/data/lessons/travel-lesson-01.json';
import travel02 from '@/data/lessons/travel-lesson-02.json';
import workplace01 from '@/data/lessons/workplace-lesson-01.json';
import daily01 from '@/data/lessons/daily-lesson-01.json';

interface DialogueLine {
  speaker: string;
  text: string;
  vietnamese: string;
}

interface ConversationData {
  id: string;
  title: string;
  level: string;
  scenario: string;
  partnerName: string;
  partnerRole: string;
  dialogue: DialogueLine[];
}

const fallbackConversations: Record<string, ConversationData> = {
  'restaurant': {
    id: 'conv-deck-restaurant',
    title: 'Ordering Food at a Restaurant',
    level: 'A2',
    scenario: restaurant01.warmup.situation,
    partnerName: 'Waiter Marco',
    partnerRole: 'Nhân viên phục vụ bàn',
    dialogue: restaurant01.listening[0].dialogue,
  },
  'deck-restaurant': {
    id: 'conv-deck-restaurant',
    title: 'Ordering Food at a Restaurant',
    level: 'A2',
    scenario: restaurant01.warmup.situation,
    partnerName: 'Waiter Marco',
    partnerRole: 'Nhân viên phục vụ bàn',
    dialogue: restaurant01.listening[0].dialogue,
  },
  'travel': {
    id: 'conv-deck-travel',
    title: 'Airport Check-in & Hotel',
    level: 'A2',
    scenario: travel01.warmup?.situation || 'Bạn đang làm thủ tục tại quầy check-in sân bay quốc tế.',
    partnerName: 'Agent Sarah',
    partnerRole: 'Nhân viên hãng hàng không',
    dialogue: travel01.listening[0].dialogue,
  },
  'deck-travel': {
    id: 'conv-deck-travel',
    title: 'Airport Check-in & Hotel',
    level: 'A2',
    scenario: travel01.warmup?.situation || 'Bạn đang làm thủ tục tại quầy check-in sân bay quốc tế.',
    partnerName: 'Agent Sarah',
    partnerRole: 'Nhân viên hãng hàng không',
    dialogue: travel01.listening[0].dialogue,
  },
  'shopping': {
    id: 'conv-deck-shopping',
    title: 'Shopping & Asking for Discounts',
    level: 'A2',
    scenario: shopping01.warmup?.situation || 'Bạn đang mua sắm tại một cửa hàng thời trang nước ngoài.',
    partnerName: 'Clerk Emily',
    partnerRole: 'Nhân viên bán hàng',
    dialogue: shopping01.listening[0].dialogue,
  },
  'deck-shopping': {
    id: 'conv-deck-shopping',
    title: 'Shopping & Asking for Discounts',
    level: 'A2',
    scenario: shopping01.warmup?.situation || 'Bạn đang mua sắm tại một cửa hàng thời trang nước ngoài.',
    partnerName: 'Clerk Emily',
    partnerRole: 'Nhân viên bán hàng',
    dialogue: shopping01.listening[0].dialogue,
  },
  'workplace': {
    id: 'conv-deck-workplace',
    title: 'Office Collaboration & Meeting',
    level: 'B1',
    scenario: workplace01.warmup?.situation || 'Trao đổi công việc và thảo luận tiến độ dự án với đồng nghiệp.',
    partnerName: 'Colleague David',
    partnerRole: 'Đồng nghiệp quản lý dự án',
    dialogue: workplace01.listening[0].dialogue,
  },
  'deck-workplace': {
    id: 'conv-deck-workplace',
    title: 'Office Collaboration & Meeting',
    level: 'B1',
    scenario: workplace01.warmup?.situation || 'Trao đổi công việc và thảo luận tiến độ dự án với đồng nghiệp.',
    partnerName: 'Colleague David',
    partnerRole: 'Đồng nghiệp quản lý dự án',
    dialogue: workplace01.listening[0].dialogue,
  },
  'daily': {
    id: 'conv-daily',
    title: 'Daily Casual Conversations',
    level: 'A1',
    scenario: 'Những câu giao tiếp chào hỏi, làm quen và trò chuyện thường ngày.',
    partnerName: 'Friend Jessica',
    partnerRole: 'Bạn bè quốc tế',
    dialogue: daily01.listening[0].dialogue,
  },
};

export default function ConversationPracticePage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addSpeakingTime } = useLearningStore();

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [turnScores, setTurnScores] = useState<Record<number, { score: number; spoken: string }>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [learnerSpeaker, setLearnerSpeaker] = useState<string>('Customer');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load conversation dataset
  useEffect(() => {
    let cleanId = (conversationId || 'restaurant').replace(/^conv-/, '');
    const matched =
      fallbackConversations[cleanId] ||
      fallbackConversations[cleanId.toLowerCase()] ||
      fallbackConversations['restaurant'];

    setConversation(matched);
    setCurrentTurnIndex(0);
    setTurnScores({});
    setIsCompleted(false);

    // Determine learner character name
    if (matched.dialogue && matched.dialogue.length > 1) {
      const speakers = Array.from(new Set(matched.dialogue.map((d) => d.speaker)));
      setLearnerSpeaker(speakers[1] || 'Customer');
    }
  }, [conversationId]);

  // Auto-scroll chat on turn change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTurnIndex, isCompleted]);

  // Auto-play partner speech when it's partner's turn
  useEffect(() => {
    if (!conversation || isCompleted) return;
    const currentLine = conversation.dialogue[currentTurnIndex];
    if (currentLine && currentLine.speaker !== learnerSpeaker) {
      // Auto speak partner line
      const timer = setTimeout(() => {
        speakText(currentLine.text);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentTurnIndex, conversation, learnerSpeaker, isCompleted]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentLine = conversation.dialogue[currentTurnIndex];
  const isLearnerTurn = currentLine && currentLine.speaker === learnerSpeaker;

  const handleNextTurn = () => {
    if (currentTurnIndex < conversation.dialogue.length - 1) {
      setCurrentTurnIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      addSpeakingTime(2);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  const handleStartSpeaking = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('conversationPractice.micError'));
      return;
    }

    if (!currentLine) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const score = calculateSimilarity(spoken, currentLine.text);
        setTurnScores((prev) => ({
          ...prev,
          [currentTurnIndex]: { score, spoken },
        }));
        setIsRecording(false);
        addSpeakingTime(1);

        // If score is decent, advance after short delay
        if (score >= 60) {
          setTimeout(() => {
            handleNextTurn();
          }, 1200);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleSwitchRoles = () => {
    const speakers = Array.from(new Set(conversation.dialogue.map((d) => d.speaker)));
    const nextSpeaker = speakers.find((s) => s !== learnerSpeaker) || speakers[0];
    setLearnerSpeaker(nextSpeaker);
    setCurrentTurnIndex(0);
    setTurnScores({});
    setIsCompleted(false);
  };

  const currentScore = turnScores[currentTurnIndex];

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <Link
            to="/conversations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('conversationPractice.backToConversations')}</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {conversation.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/40">
              {t('conversationPractice.levelBadge', { level: conversation.level })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSwitchRoles}
            className="py-2 px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Đổi sang vai nhân vật khác"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('conversationPractice.switchRole')}</span>
          </button>
        </div>
      </div>

      {/* Scenario Brief */}
      <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1">
        <p className="font-bold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">
          {t('conversationPractice.scenarioTitle')}
        </p>
        <p className="leading-relaxed">{conversation.scenario}</p>
      </div>

      {/* Main Dialogue Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-4 min-h-[380px]">
        {conversation.dialogue.slice(0, currentTurnIndex + 1).map((line, idx) => {
          const isUser = line.speaker === learnerSpeaker;
          const isLatest = idx === currentTurnIndex;
          const scoreObj = turnScores[idx];

          return (
            <div
              key={idx}
              className={cn(
                'flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200',
                isUser ? 'items-end' : 'items-start'
              )}
            >
              {/* Speaker Label */}
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1 px-1">
                {isUser ? `Bạn (${line.speaker})` : `${conversation.partnerName} (${line.speaker})`}
              </span>

              {/* Chat Bubble */}
              <div
                className={cn(
                  'max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-1.5 relative shadow-2xs',
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm sm:text-base font-semibold leading-relaxed">
                    {line.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => speakText(line.text)}
                    className={cn(
                      'p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer',
                      isUser
                        ? 'hover:bg-blue-700 text-blue-200 hover:text-white'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                    )}
                    title={t('conversationPractice.listenPrompt')}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {line.vietnamese}
                </p>

                {/* Score badge if evaluated */}
                {scoreObj && (
                  <div className="pt-1.5 border-t border-white/20 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
                    <span className="font-bold">
                      {t('conversationPractice.scoreLabel', { score: scoreObj.score })}
                    </span>
                    <span className="opacity-90">"{scoreObj.spoken}"</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={chatBottomRef} />
      </div>

      {/* Interactive Turn Action Dock */}
      {!isCompleted ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => speakText(currentLine.text)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Nghe phát âm chuẩn"
            >
              <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isLearnerTurn ? t('conversationPractice.yourTurn') : t('conversationPractice.partnerTurn')}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                {currentLine.text}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isLearnerTurn ? (
              <>
                <button
                  type="button"
                  onClick={handleStartSpeaking}
                  disabled={isRecording}
                  className={cn(
                    'flex-1 sm:flex-none py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm',
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-[1.02]'
                  )}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecording
                      ? t('conversationPractice.recordingText')
                      : t('conversationPractice.micBtn')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Bỏ qua hoặc sang câu tiếp theo"
                >
                  <SkipForward className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('conversationPractice.skipBtn')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNextTurn}
                className="w-full sm:w-auto py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
              >
                <span>Tiếp tục sang lượt bạn</span>
                <Play className="w-4 h-4 fill-white" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Completion Card */
        <div className="bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 rounded-3xl p-8 border border-emerald-200/80 dark:border-emerald-900/60 shadow-card text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t('conversationPractice.completedTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {t('conversationPractice.completedDesc')}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40">
            {/* <Sparkles className="w-3.5 h-3.5" /> */}
            <span>{t('conversationPractice.pointsEarned', { count: 2 })}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setCurrentTurnIndex(0);
                setTurnScores({});
                setIsCompleted(false);
              }}
              className="w-full sm:w-auto py-2.5 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('conversationPractice.practiceAgain')}</span>
            </button>

            <Link
              to="/conversations"
              className="w-full sm:w-auto py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
            >
              {t('conversationPractice.backToConversations')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
