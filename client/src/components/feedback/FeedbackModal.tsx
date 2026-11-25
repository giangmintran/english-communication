import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bug,
  Lightbulb,
  BookOpen,
  Sparkles,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  MessageSquareHeart,
  Laptop,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFeedbackModal } from '@/context/FeedbackModalContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { FeedbackCategory, FeedbackItem, FeedbackStatus } from '@/types/feedback';
import { api } from '@/lib/api';

export function FeedbackModal() {
  const { isOpen, closeFeedback, options } = useFeedbackModal();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [showContextDetails, setShowContextDetails] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<FeedbackItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Apply initial options when opened
  useEffect(() => {
    if (isOpen) {
      setSubmitSuccess(false);
      setErrorMessage(null);
      if (options.category) setCategory(options.category);
      if (options.title) setTitle(options.title);
      if (options.content) setContent(options.content);
      if (options.activeTab) {
        setActiveTab(options.activeTab);
      } else {
        setActiveTab('form');
      }
    }
  }, [isOpen, options]);

  // Context metadata collector
  const contextData = useMemo(() => {
    if (typeof window === 'undefined') return {};
    return {
      pathname: window.location.pathname + window.location.search,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      userAgent: navigator.userAgent,
    };
  }, [isOpen]);

  // Fetch history when history tab is activated
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const data = await api.feedback.getMyFeedbacks();
      setHistoryList(data);
    } catch (err) {
      console.warn('Failed to fetch feedback history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab, fetchHistory]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const categories: {
    id: FeedbackCategory;
    icon: typeof Bug;
    label: string;
    description: string;
    color: string;
    bgColor: string;
    badgeBorder: string;
  }[] = [
      {
        id: 'general',
        icon: Sparkles,
        label: t('feedback.catGeneral') || 'Trải nghiệm chung',
        description: t('feedback.catGeneralDesc') || 'Đánh giá & cảm nhận tổng quan',
        color: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        badgeBorder: 'border-amber-200 dark:border-amber-800',
      },
      {
        id: 'bug',
        icon: Bug,
        label: t('feedback.catBug') || 'Báo lỗi kỹ thuật',
        description: t('feedback.catBugDesc') || 'Âm thanh, giao diện, trang trắng',
        color: 'text-rose-500 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        badgeBorder: 'border-rose-200 dark:border-rose-800',
      },
      {
        id: 'feature',
        icon: Lightbulb,
        label: t('feedback.catFeature') || 'Góp ý tính năng',
        description: t('feedback.catFeatureDesc') || 'Đề xuất cải tiến & ý tưởng mới',
        color: 'text-blue-500 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        badgeBorder: 'border-blue-200 dark:border-blue-800',
      },
      {
        id: 'content',
        icon: BookOpen,
        label: t('feedback.catContent') || 'Lỗi từ vựng / bài học',
        description: t('feedback.catContentDesc') || 'Sai phiên âm, nghĩa tiếng Việt',
        color: 'text-purple-500 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/40',
        badgeBorder: 'border-purple-200 dark:border-purple-800',
      },
    ];

  const ratingLabels: Record<number, string> = {
    1: t('feedback.rating1') || 'Rất tệ',
    2: t('feedback.rating2') || 'Cần cải thiện',
    3: t('feedback.rating3') || 'Bình thường',
    4: t('feedback.rating4') || 'Tốt',
    5: t('feedback.rating5') || 'Tuyệt vời!',
  };

  const getPlaceholder = () => {
    switch (category) {
      case 'bug':
        return t('feedback.placeholderBug') || 'Mô tả chi tiết lỗi bạn gặp phải: đã xảy ra ở bước nào, lỗi hiển thị ra sao...';
      case 'feature':
        return t('feedback.placeholderFeature') || 'Bạn muốn SpeakUp có thêm tính năng gì để giúp việc học giao tiếp thuận tiện và hiệu quả hơn?...';
      case 'content':
        return t('feedback.placeholderContent') || 'Từ vựng, mẫu câu hay phiên âm nào bị chưa chuẩn? Bạn gợi ý chỉnh sửa ra sao?...';
      case 'general':
      default:
        return t('feedback.placeholderGeneral') || 'Chia sẻ trải nghiệm, cảm nghĩ hoặc lời động viên của bạn dành cho đội ngũ phát triển SpeakUp...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 5) {
      setErrorMessage(t('feedback.contentMinLength') || 'Vui lòng nhập nội dung tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.feedback.submit({
        category,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        user_email: user?.email || (guestEmail.trim() ? guestEmail.trim() : undefined),
        user_name: user?.user_metadata?.full_name || (guestName.trim() ? guestName.trim() : undefined),
        page_url: contextData.pathname,
        device_info: contextData,
        website: honeypot || undefined,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          zIndex: 9999,
        });
      } catch (_) { }

      setSubmitSuccess(true);
      setContent('');
      setTitle('');
    } catch (err: any) {
      console.error('Feedback submit error:', err);
      setErrorMessage(
        err.message || t('feedback.submitError') || 'Không thể gửi phản hồi. Vui lòng thử lại sau.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3" />
            {t('feedback.statusResolved') || 'Đã giải quyết'}
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            <Info className="w-3 h-3" />
            {t('feedback.statusReviewed') || 'Đã ghi nhận'}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {t('feedback.statusClosed') || 'Đã đóng'}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t('feedback.statusPending') || 'Đang chờ xử lý'}
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: FeedbackCategory) => {
    switch (cat) {
      case 'bug':
        return <Bug className="w-4 h-4 text-rose-500" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'content':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'general':
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  const getCategoryLabel = (cat: FeedbackCategory) => {
    const item = categories.find((c) => c.id === cat);
    return item ? item.label : cat;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeFeedback}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-auto z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-transparent to-amber-50/30 dark:from-blue-950/20 dark:to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {t('feedback.modalTitle') || 'Góp ý & Báo lỗi'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('feedback.modalSubtitle') || 'Ý kiến của bạn giúp SpeakUp ngày càng hoàn thiện hơn'}
                </p>
              </div>
            </div>

            <button
              onClick={closeFeedback}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector (Gửi góp ý / Lịch sử) */}
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'form'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {t('feedback.tabSend') || 'Gửi phản hồi'}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
              >
                <History className="w-4 h-4" />
                <span>{t('feedback.tabHistory') || 'Lịch sử của bạn'}</span>
                {historyList.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-bold">
                    {historyList.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Modal Content */}
          {activeTab === 'form' ? (
            submitSuccess ? (
              /* Success screen */
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t('feedback.successTitle') || 'Cảm ơn bạn rất nhiều!'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {t('feedback.successDesc') ||
                        'Đội ngũ SpeakUp đã nhận được phản hồi và sẽ sớm xem xét để nâng cấp chất lượng ứng dụng tốt nhất.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(false)}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                    >
                      {t('feedback.btnAnother') || 'Gửi thêm góp ý khác'}
                    </button>
                    <button
                      type="button"
                      onClick={closeFeedback}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
                    >
                      {t('common.close') || 'Đóng'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Form with Scrollable Inputs and Sticky Bottom Action Footer */
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Honeypot field - Ẩn hoàn toàn với người dùng thật, bẫy spam bot */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                  <label htmlFor="fb-website-hp">Website</label>
                  <input
                    id="fb-website-hp"
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
                  {/* Category Grid */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
                      {t('feedback.chooseCategory') || '1. Thể loại phản hồi'}
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bgColor} ${cat.color}`}
                              >
                                <Icon className="w-4 h-4" />
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {cat.label}
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {cat.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating Selector */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {t('feedback.ratingTitle') || 'Đánh giá mức độ hài lòng:'}
                      </span>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {ratingLabels[hoverRating || rating]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 rounded-lg hover:scale-115 transition-transform cursor-pointer"
                            aria-label={`${star} sao`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${isFilled
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                                }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      {t('feedback.titleLabel') || 'Tiêu đề tóm tắt (không bắt buộc)'}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        t('feedback.titlePlaceholder') || 'Ví dụ: Đề xuất thêm phát âm giọng Anh-Anh, Lỗi bài 3...'
                      }
                      maxLength={150}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Content (Required) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t('feedback.contentLabel') || 'Chi tiết phản hồi'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {content.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder={getPlaceholder()}
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Contact Email / User Identity */}
                  {user ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="truncate">
                        {t('feedback.signedInAs') || 'Gửi từ tài khoản:'}{' '}
                        <strong>{user.email}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t('feedback.guestEmailLabel') || 'Email liên hệ (nếu bạn muốn nhận phản hồi)'}
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  )}

                  {/* Context preview collapsible */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowContextDetails(!showContextDetails)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>
                        {showContextDetails
                          ? t('feedback.hideContext') || 'Ẩn thông tin kỹ thuật đính kèm'
                          : t('feedback.showContext') || 'Xem thông tin kỹ thuật tự động đính kèm (URL, thiết bị)'}
                      </span>
                    </button>

                    {showContextDetails && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                        <div>URL: {contextData.pathname}</div>
                        <div>Màn hình: {contextData.screenResolution} ({contextData.platform})</div>
                        <div className="truncate">Trình duyệt: {contextData.userAgent}</div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer - Luôn hiển thị cố định ở chân modal */}
                <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md flex items-center justify-end gap-3 shrink-0 z-20 shadow-xs">
                  <button
                    type="button"
                    onClick={closeFeedback}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    {t('common.cancel') || 'Hủy'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold rounded-2xl shadow-sm shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('feedback.submitting') || 'Đang gửi...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t('feedback.submitBtn') || 'Gửi góp ý'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* History Tab */
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('feedback.historySubtitle') || 'Danh sách phản hồi bạn đã gửi:'}
                </span>
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={isLoadingHistory}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">{t('common.loading') || 'Đang tải...'}</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquareHeart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('feedback.historyEmpty') || 'Bạn chưa gửi góp ý nào'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {t('feedback.historyEmptyDesc') ||
                      'Hãy gửi phản hồi nếu bạn gặp lỗi hoặc có ý tưởng tính năng mới cho SpeakUp.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="mt-3 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    {t('feedback.tabSend') || 'Gửi phản hồi ngay'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {getCategoryIcon(item.category)}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {item.title && (
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>

                      {/* Admin note reply */}
                      {item.admin_notes && (
                        <div className="mt-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                            {/* <Sparkles className="w-3.5 h-3.5" /> */}
                            <span>{t('feedback.adminReply') || 'Phản hồi từ đội ngũ SpeakUp:'}</span>
                          </div>
                          <p className="leading-relaxed">{item.admin_notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>
                          {new Date(item.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.rating && (
                          <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {item.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
