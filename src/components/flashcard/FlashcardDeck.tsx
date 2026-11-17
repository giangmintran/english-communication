'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, Mic, RotateCw, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LearningItem, ReviewGrade } from '@/types/database';
import { useLearningStore } from '@/lib/store';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { cn } from '@/lib/utils';

interface FlashcardDeckProps {
  deckTitle: string;
  items: LearningItem[];
}

export function FlashcardDeck({ deckTitle, items }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; spoken: string } | null>(null);
  const [completed, setCompleted] = useState(false);

  const { recordReview, addSpeakingTime } = useLearningStore();

  const currentItem = items[currentIndex];

  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSpeaking(true);
    await speakText(text);
    setIsSpeaking(false);
  };

  const handleSpeechRecognition = (targetText: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSpeechResult(null);

    // Check Web Speech API support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Trình duyệt hiện tại chưa hỗ trợ Web Speech API. Bạn vui lòng sử dụng Google Chrome hoặc Microsoft Edge trên máy tính!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsRecording(true);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const score = calculateSimilarity(spokenText, targetText);
        setSpeechResult({ score, spoken: spokenText });
        setIsRecording(false);
        addSpeakingTime(1);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        alert('Không nhận diện được giọng nói. Xin hãy thử lại và kiểm tra quyền microphone!');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleRate = (grade: ReviewGrade) => {
    if (!currentItem) return;

    recordReview(currentItem.id, grade);
    setIsFlipped(false);
    setSpeechResult(null);

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  if (completed) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-100 shadow-card text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Xuất sắc! Bạn đã hoàn thành bài học
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Các từ và câu hôm nay đã được cập nhật vào chu kỳ lặp lại ngắt quãng (SM-2).
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-blue-500/25 transition-all"
          >
            Về trang chủ
          </Link>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setCompleted(false);
              setIsFlipped(false);
            }}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-2xl transition-all"
          >
            Ôn lại lần nữa
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="text-center p-8">
        <p className="text-slate-500">Không có dữ liệu cho bộ thẻ này.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 font-semibold">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Top bar with back and progress */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {items.length}
          </span>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FLASHCARD CONTAINER */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[380px] bg-white rounded-3xl p-8 border border-slate-100 shadow-card cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between relative group select-none"
      >
        {/* Top Card Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
              {deckTitle}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium uppercase">
              {currentItem.type}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
              {currentItem.difficulty_level}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 font-medium transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Lật thẻ</span>
          </button>
        </div>

        {/* Center Content */}
        {!isFlipped ? (
          // CARD FRONT: English & Pronunciation
          <div className="py-6 text-center my-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {currentItem.english_text}
            </h2>
            <p className="text-slate-400 font-mono text-sm tracking-wide mb-6">
              {currentItem.phonetic_ipa}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => handlePlayAudio(currentItem.english_text, e)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm rounded-2xl transition-colors shadow-xs"
              >
                <Volume2 className={cn('w-4 h-4', isSpeaking && 'animate-pulse')} />
                <span>Nghe phát âm</span>
              </button>

              <button
                onClick={(e) => handleSpeechRecognition(currentItem.english_text, e)}
                disabled={isRecording}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-2xl transition-colors shadow-xs',
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                )}
              >
                <Mic className="w-4 h-4" />
                <span>{isRecording ? 'Đang lắng nghe...' : 'Luyện nói'}</span>
              </button>
            </div>

            {speechResult && (
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs inline-block">
                <span className="font-semibold text-slate-700">Bạn đã nói: </span>
                <span className="text-slate-900 font-medium">"{speechResult.spoken}"</span>
                <span
                  className={cn(
                    'ml-2 font-bold px-2 py-0.5 rounded-full text-white',
                    speechResult.score >= 80 ? 'bg-green-500' : speechResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                >
                  {speechResult.score}% khớp
                </span>
              </div>
            )}
          </div>
        ) : (
          // CARD BACK: Meaning & Examples
          <div className="py-6 text-center my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Ý nghĩa tiếng Việt
            </div>
            <h2 className="text-2xl font-bold text-blue-600 mb-6">
              {currentItem.vietnamese_meaning}
            </h2>

            {currentItem.example_sentence && (
              <div className="bg-slate-50/80 rounded-2xl p-4 text-left border border-slate-100 mb-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500">Ví dụ ngữ cảnh:</span>
                  <button
                    onClick={(e) => handlePlayAudio(currentItem.example_sentence, e)}
                    className="p-1 text-slate-400 hover:text-blue-600"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-900 font-semibold text-sm mb-1">
                  {currentItem.example_sentence}
                </p>
                <p className="text-slate-500 text-xs">
                  {currentItem.example_meaning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Hint */}
        <div className="text-center text-xs text-slate-400">
          {!isFlipped ? 'Nhấn vào thẻ để xem nghĩa & ví dụ' : 'Chọn mức độ ghi nhớ bên dưới để tiếp tục'}
        </div>
      </div>

      {/* SM-2 RATING BUTTONS */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => handleRate(0)}
          className="p-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95"
        >
          <span>Quên</span>
          <span className="text-[11px] font-normal text-red-400">&lt; 1 ngày</span>
        </button>

        <button
          onClick={() => handleRate(1)}
          className="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95"
        >
          <span>Mơ hồ</span>
          <span className="text-[11px] font-normal text-amber-500">1 ngày</span>
        </button>

        <button
          onClick={() => handleRate(2)}
          className="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/80 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95"
        >
          <span>Nhớ</span>
          <span className="text-[11px] font-normal text-blue-400">3 ngày</span>
        </button>

        <button
          onClick={() => handleRate(3)}
          className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 rounded-2xl font-semibold text-sm transition-all flex flex-col items-center gap-1 active:scale-95"
        >
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rất dễ</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-500">7 ngày</span>
        </button>
      </div>
    </div>
  );
}
