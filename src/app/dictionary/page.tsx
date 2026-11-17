'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Volume2 } from 'lucide-react';
import { speakText } from '@/lib/speech';

const sampleWords = [
  { word: 'Collocation', ipa: '/ˌkɒləˈkeɪʃn/', meaning: 'Cụm từ thường đi liền với nhau một cách tự nhiên trong tiếng Anh', example: 'Fast food, make an effort, take a shower' },
  { word: 'Touch base', ipa: '/tʌtʃ beɪs/', meaning: 'Liên lạc nhanh để cập nhật tình hình công việc', example: 'Let us touch base tomorrow afternoon.' },
  { word: 'Recommend', ipa: '/ˌrekəˈmend/', meaning: 'Gợi ý, khuyên dùng', example: 'What do you recommend for dinner?' },
  { word: 'Allergic', ipa: '/əˈlɜːdʒɪk/', meaning: 'Dị ứng với một loại thức ăn hoặc phấn hoa', example: 'I am allergic to peanuts.' },
  { word: 'Split the bill', ipa: '/splɪt ðə bɪl/', meaning: 'Chia tiền hóa đơn công bằng', example: 'Can we split the bill please?' },
];

export default function DictionaryPage() {
  const [query, setQuery] = useState('');
  const filtered = sampleWords.filter((w) =>
    w.word.toLowerCase().includes(query.toLowerCase()) ||
    w.meaning.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2.5">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <span>AI Dictionary</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Tra cứu nhanh từ vựng, cụm từ giao tiếp kèm phát âm IPA và câu ví dụ thực tế.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm từ vựng, thành ngữ hoặc nghĩa tiếng Việt..."
          className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Word list */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.word}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-slate-900">{item.word}</h3>
                <span className="text-xs font-mono text-slate-400">{item.ipa}</span>
                <button
                  onClick={() => speakText(item.word)}
                  className="p-1 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-blue-700 mb-2">{item.meaning}</p>
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{item.example}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
