'use client';

import React, { useState } from 'react';
import { Mic, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { sampleLearningItems } from '@/data/mockData';
import { speakText, calculateSimilarity } from '@/lib/speech';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function SpeakingPracticePage() {
  const allItems = Object.values(sampleLearningItems).flat();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{ score: number; spoken: string } | null>(null);

  const { addSpeakingTime } = useLearningStore();
  const currentItem = allItems[currentIndex];

  const handleListen = () => {
    if (currentItem) {
      speakText(currentItem.english_text);
    }
  };

  const handleStartSpeaking = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Vui lòng mở trên trình duyệt Google Chrome hoặc Microsoft Edge để sử dụng micro!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsRecording(true);
      setResult(null);

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        const score = calculateSimilarity(spoken, currentItem.english_text);
        setResult({ score, spoken });
        setIsRecording(false);
        addSpeakingTime(1);
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

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          Speaking Practice 🎙️
        </h1>
        <p className="text-slate-500 text-sm">
          Nghe phát âm chuẩn, nhấn giữ micro để nói và nhận điểm phản xạ tức thì.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
          Câu {currentIndex + 1} / {allItems.length}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {currentItem.english_text}
          </h2>
          <p className="text-slate-400 font-mono text-sm">
            {currentItem.phonetic_ipa}
          </p>
          <p className="text-blue-600 font-medium text-base pt-2">
            "{currentItem.vietnamese_meaning}"
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={handleListen}
            className="px-5 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm flex items-center gap-2 transition-colors shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
            <span>Nghe mẫu</span>
          </button>

          <button
            onClick={handleStartSpeaking}
            disabled={isRecording}
            className={cn(
              'px-6 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all shadow-md',
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/25'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            )}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecording ? 'Đang lắng nghe...' : 'Bấm để nói'}</span>
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Kết quả nhận diện:
              </span>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold text-white',
                  result.score >= 80 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                )}
              >
                {result.score}% Khớp
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              "{result.spoken}"
            </p>
            {result.score >= 80 && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tuyệt vời! Bạn phát âm rất chuẩn và tự nhiên.
              </p>
            )}
          </div>
        )}

        {/* Next Question */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              setResult(null);
              setCurrentIndex((prev) => (prev + 1) % allItems.length);
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Câu tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
