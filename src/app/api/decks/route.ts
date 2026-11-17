import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initialDecks } from '@/data/mockData';

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ decks: initialDecks });
  }

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('order_index', { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ decks: initialDecks });
  }

  return NextResponse.json({ decks: data });
}
