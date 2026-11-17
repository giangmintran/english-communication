import React from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { initialDecks } from '@/data/mockData';

export default function DailyLearningPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2.5">
          <Calendar className="w-8 h-8 text-blue-600" />
          <span>Daily Learning</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Lộ trình ôn tập 10-15 phút mỗi ngày theo chu kỳ lặp lại ngắt quãng SM-2.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Nhiệm vụ cần ôn hôm nay</h2>
        <div className="space-y-3">
          {initialDecks.slice(0, 3).map((deck, idx) => (
            <div
              key={deck.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{deck.title}</h3>
                  <p className="text-xs text-slate-500">{deck.description}</p>
                </div>
              </div>

              <Link
                href={`/learn/${deck.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>Bắt đầu ôn</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
