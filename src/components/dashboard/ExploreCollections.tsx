'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  MessageSquare,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { initialDecks } from '@/data/mockData';

const iconMap: Record<string, React.ElementType> = {
  Utensils,
  Plane,
  ShoppingBag,
  Briefcase,
  MessageSquare,
};

export function ExploreCollections() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Explore Collections
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {initialDecks.map((deck) => {
          const Icon = iconMap[deck.icon_name] || BookOpen;

          return (
            <Link
              key={deck.id}
              href={`/learn/${deck.id}`}
              className="group bg-white rounded-3xl p-3 border border-slate-100 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                {/* Image Card with Word count badge */}
                <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5">
                  <Image
                    src={deck.image_url}
                    alt={deck.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 200px"
                  />
                  {/* Word count pill */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-bold text-slate-800 shadow-xs">
                    {deck.total_words} words
                  </div>
                </div>

                {/* Category Icon & Title */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate">
                    {deck.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 px-1 line-clamp-1 mb-2">
                  {deck.description}
                </p>
              </div>

              {/* Bottom Arrow Action */}
              <div className="flex justify-end pt-2 border-t border-slate-50 px-1">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
