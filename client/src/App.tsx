import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import HomePage from '@/pages/Home';
import CollectionsPage from '@/pages/Collections';
import LearnDeckPage from '@/pages/LearnDeck';
import SpeakingPracticePage from '@/pages/Speaking';
import LoginPage from '@/pages/Login';
import AuthCallbackPage from '@/pages/AuthCallback';
import ConversationsPage from '@/pages/Conversations';
import DailyLearningPage from '@/pages/Daily';
import DictionaryPage from '@/pages/Dictionary';
import LeaderboardPage from '@/pages/Leaderboard';
import SettingsPage from '@/pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/learn/:deckId" element={<LearnDeckPage />} />
                <Route path="/speaking" element={<SpeakingPracticePage />} />
                <Route path="/conversations" element={<ConversationsPage />} />
                <Route path="/daily" element={<DailyLearningPage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>
              {/* OAuth Callback route outside or inside layout */}
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
