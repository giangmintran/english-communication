import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'SpeakUp - Daily English Communication Practice',
  description: 'Master English communication with spaced repetition flashcards, interactive dialogues, and speaking reflex.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased flex flex-row">
        <AuthProvider>
          {/* Left Sidebar */}
          <Sidebar />

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <Header />
            <main className="flex-1 px-8 pb-12 overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
