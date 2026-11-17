import React from 'react';
import { initialDecks, sampleLearningItems } from '@/data/mockData';
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck';

interface PageProps {
  params: Promise<{ deckId: string }>;
}

export default async function LearnDeckPage({ params }: PageProps) {
  const { deckId } = await params;
  const deck = initialDecks.find((d) => d.id === deckId) || initialDecks[0];
  const items = sampleLearningItems[deck.id] || sampleLearningItems['deck-restaurant'] || [];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <FlashcardDeck deckTitle={deck.title} items={items} />
    </div>
  );
}
