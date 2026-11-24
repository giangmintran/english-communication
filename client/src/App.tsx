import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { FeedbackModalProvider } from '@/context/FeedbackModalContext';
import { Layout } from '@/components/layout/Layout';
import HomePage from '@/pages/Home';
import CollectionsPage from '@/pages/Collections';
import CollectionDetailPage from '@/pages/CollectionDetail';
import CollectionStudyPage from '@/pages/CollectionStudy';
import LearnDeckPage from '@/pages/LearnDeck';
import SpeakingPracticePage from '@/pages/Speaking';
import LoginPage from '@/pages/Login';
import AuthCallbackPage from '@/pages/AuthCallback';
import ConversationsPage from '@/pages/Conversations';
import DailyLearningPage from '@/pages/Daily';
import DailyLessonPage from '@/pages/DailyLesson';
import DailyReviewPage from '@/pages/DailyReview';
import DictionaryPage from '@/pages/Dictionary';
import LeaderboardPage from '@/pages/Leaderboard';
import SettingsPage from '@/pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <FeedbackModalProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/collections/:deckId" element={<CollectionDetailPage />} />
                  <Route path="/collections/:deckId/learn" element={<CollectionStudyPage />} />
                  <Route path="/collections/:deckId/study" element={<CollectionStudyPage />} />
                  <Route path="/learn/:deckId" element={<LearnDeckPage />} />
                  <Route path="/speaking" element={<SpeakingPracticePage />} />
                  <Route path="/conversations" element={<ConversationsPage />} />
                  <Route path="/daily" element={<DailyLearningPage />} />
                  <Route path="/daily/review" element={<DailyReviewPage />} />
                  <Route path="/daily/lesson/:lessonId" element={<DailyLessonPage />} />
                  <Route path="/dictionary" element={<DictionaryPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                {/* OAuth Callback route outside or inside layout */}
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
              </Routes>
            </BrowserRouter>
          </FeedbackModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
