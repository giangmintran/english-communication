'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ArrowRight, MessageSquare } from 'lucide-react';

export function ContinueLearningCard() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Continue Learning
          </h2>
        </div>
        <Link
          href="/collections"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>See all</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col md:flex-row items-center gap-6">
        {/* Media Thumbnail with Play Overlay */}
        <div className="relative w-full md:w-72 h-44 rounded-2xl overflow-hidden shrink-0 group cursor-pointer shadow-inner">
          <Image
            src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=700&q=80"
            alt="Traveling Abroad - London Big Ben"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
            <div className="w-13 h-13 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-blue-600 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Content details */}
        <div className="flex-1 w-full flex flex-col justify-between py-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-3 border border-blue-100/60">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Conversation</span>
              <span>•</span>
              <span>Level A2</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
              Traveling Abroad
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Useful phrases for your next trip overseas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-64">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: '60%' }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500">60%</span>
            </div>

            <Link
              href="/learn/deck-travel"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0"
            >
              <span>Resume Lesson</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
