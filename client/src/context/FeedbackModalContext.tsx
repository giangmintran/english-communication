import React, { createContext, useContext, useState, useCallback } from 'react';
import { FeedbackCategory } from '@/types/feedback';

export interface OpenFeedbackOptions {
  category?: FeedbackCategory;
  title?: string;
  content?: string;
  activeTab?: 'form' | 'history';
}

interface FeedbackModalContextType {
  isOpen: boolean;
  options: OpenFeedbackOptions;
  openFeedback: (opts?: OpenFeedbackOptions) => void;
  closeFeedback: () => void;
}

const FeedbackModalContext = createContext<FeedbackModalContextType | undefined>(undefined);

export function FeedbackModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenFeedbackOptions>({});

  const openFeedback = useCallback((opts?: OpenFeedbackOptions) => {
    setOptions(opts || {});
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FeedbackModalContext.Provider
      value={{
        isOpen,
        options,
        openFeedback,
        closeFeedback,
      }}
    >
      {children}
    </FeedbackModalContext.Provider>
  );
}

export function useFeedbackModal() {
  const context = useContext(FeedbackModalContext);
  if (!context) {
    throw new Error('useFeedbackModal must be used within a FeedbackModalProvider');
  }
  return context;
}
