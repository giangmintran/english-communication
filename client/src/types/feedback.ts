export type FeedbackCategory = 'bug' | 'feature' | 'content' | 'general';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'closed';

export interface FeedbackItem {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  category: FeedbackCategory;
  rating?: number | null;
  title?: string | null;
  content: string;
  page_url?: string | null;
  device_info?: Record<string, any>;
  screenshot_url?: string | null;
  status: FeedbackStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SubmitFeedbackPayload {
  category: FeedbackCategory;
  rating?: number | null;
  title?: string | null;
  content: string;
  user_email?: string | null;
  user_name?: string | null;
  page_url?: string | null;
  device_info?: Record<string, any>;
  screenshot_url?: string | null;
  website?: string; // Honeypot field bẫy spam bot
}
