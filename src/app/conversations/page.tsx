import React from 'react';
import Link from 'next/link';
import { MessageSquare, Play, Sparkles } from 'lucide-react';

const sampleDialogues = [
  {
    id: 'dia-1',
    title: 'Traveling Abroad',
    level: 'A2',
    scenario: 'Làm thủ tục tại sân bay & hỏi đường khi du lịch nước ngoài',
    deckId: 'deck-travel',
  },
  {
    id: 'dia-2',
    title: 'Dining at a Restaurant',
    level: 'A2',
    scenario: 'Gọi món, hỏi về dị ứng và yêu cầu chia hóa đơn',
    deckId: 'deck-restaurant',
  },
  {
    id: 'dia-3',
    title: 'Workplace Sync-up',
    level: 'B1',
    scenario: 'Trao đổi tiến độ dự án và đàm phán deadline gấp',
    deckId: 'deck-workplace',
  },
];

export default function ConversationsPage() {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2.5">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <span>Conversations</span>
        </h1>
        <p className="text-slate-500 text-sm">
          Hội thoại mẫu theo các tình huống giao tiếp đời thực kèm audio và bài tập phản xạ.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sampleDialogues.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs mb-3">
                Level {item.level}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">{item.scenario}</p>
            </div>

            <Link
              href={`/learn/${item.deckId}`}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Bắt đầu hội thoại</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
