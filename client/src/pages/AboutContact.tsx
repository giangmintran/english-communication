import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareHeart,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useFeedbackModal } from '@/context/FeedbackModalContext';
import { api } from '@/lib/api';
import { FeedbackCategory } from '@/types/feedback';
import { cn } from '@/lib/utils';

type ContactTopic = 'general' | 'support' | 'content' | 'partnership';

export default function AboutContactPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openFeedback } = useFeedbackModal();
  const location = useLocation();

  const [copiedEmail, setCopiedEmail] = useState(false);

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<ContactTopic>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prefill user name/email when signed in
  useEffect(() => {
    if (user) {
      if (!email && user.email) {
        setEmail(user.email);
      }
      if (!name) {
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metaName) setName(metaName);
      }
    }
  }, [user]);

  // Smoothly scroll to #contact when visiting /contact or /about#contact
  useEffect(() => {
    if (location.pathname === '/contact' || location.hash === '#contact') {
      const el = document.getElementById('contact');
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, location.hash]);

  const supportEmail = t('about.emailValue');

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Fallback ignored if clipboard permission unavailable
    }
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const topicConfig: Record<
    ContactTopic,
    { label: string; category: FeedbackCategory; prefix: string }
  > = {
    general: {
      label: t('about.topicGeneral'),
      category: 'general',
      prefix: '[Contact - General]',
    },
    support: {
      label: t('about.topicSupport'),
      category: 'bug',
      prefix: '[Contact - Support]',
    },
    content: {
      label: t('about.topicContent'),
      category: 'content',
      prefix: '[Contact - Content]',
    },
    partnership: {
      label: t('about.topicPartnership'),
      category: 'feature',
      prefix: '[Contact - Partnership]',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage(t('about.errorEmailInvalid'));
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 5) {
      setErrorMessage(t('about.errorMinLength'));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTopic = topicConfig[topic];
      const formattedTitle = subject.trim()
        ? `${selectedTopic.prefix} ${subject.trim()}`
        : selectedTopic.prefix;

      await api.feedback.submit({
        category: selectedTopic.category,
        title: formattedTitle.slice(0, 200),
        content: trimmedMessage.slice(0, 3000),
        user_email: trimmedEmail,
        user_name: name.trim() || undefined,
        page_url: location.pathname,
        website: honeypot || undefined,
        device_info:
          typeof window !== 'undefined'
            ? {
              source: 'about_contact_page',
              topic,
              screenResolution: `${window.innerWidth}x${window.innerHeight}`,
              language: navigator.language,
            }
            : {},
      });

      setSubmitSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err?.message || t('about.errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { value: t('about.stat1Val'), label: t('about.stat1Label'), color: 'text-blue-600 dark:text-blue-400' },
    { value: t('about.stat2Val'), label: t('about.stat2Label'), color: 'text-indigo-600 dark:text-indigo-400' },
    { value: t('about.stat3Val'), label: t('about.stat3Label'), color: 'text-emerald-600 dark:text-emerald-400' },
    { value: t('about.stat4Val'), label: t('about.stat4Label'), color: 'text-amber-600 dark:text-amber-400' },
  ];

  const pillars = [
    {
      icon: MessageCircle,
      title: t('about.pillar1Title'),
      desc: t('about.pillar1Desc'),
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    },
    {
      icon: Brain,
      title: t('about.pillar2Title'),
      desc: t('about.pillar2Desc'),
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Mic,
      title: t('about.pillar3Title'),
      desc: t('about.pillar3Desc'),
      iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Flame,
      title: t('about.pillar4Title'),
      desc: t('about.pillar4Desc'),
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
  ];

  const ecosystemCards = [
    {
      icon: Target,
      title: t('about.feat1Title'),
      desc: t('about.feat1Desc'),
      cta: t('about.feat1Cta'),
      href: '/placement-test',
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: Calendar,
      title: t('about.feat2Title'),
      desc: t('about.feat2Desc'),
      cta: t('about.feat2Cta'),
      href: '/daily',
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      icon: MessageSquare,
      title: t('about.feat3Title'),
      desc: t('about.feat3Desc'),
      cta: t('about.feat3Cta'),
      href: '/conversations',
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      icon: Mic,
      title: t('about.feat4Title'),
      desc: t('about.feat4Desc'),
      cta: t('about.feat4Cta'),
      href: '/speaking',
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-blue-500/15">
        <div className="relative z-10 max-w-3xl space-y-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.backHome')}</span>
          </Link>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            {t('about.title')}
          </h1>

          <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
            {t('about.subtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/daily"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-colors"
            >
              <span>{t('about.startLearningBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>{t('about.contactJumpBtn')}</span>
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 -bottom-20 w-56 h-56 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
      </section>

      {/* Highlights Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-card space-y-1"
          >
            <p className={cn('text-lg sm:text-xl font-bold tracking-tight', stat.color)}>
              {stat.value}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* Mission & Philosophy */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('about.missionBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('about.missionTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('about.missionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card flex items-start gap-4"
              >
                <div
                  className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
                    pillar.iconBg
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ecosystem Quick Links */}
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('about.featuresTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('about.featuresSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystemCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.href}
                className="group bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-card hover:border-blue-200 dark:hover:border-blue-900/60 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      card.accent
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="scroll-mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-8"
      >
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Mail className="w-3.5 h-3.5" />
            <span>{t('about.contactBadge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('about.contactTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('about.contactSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Support Email Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('about.emailLabel')}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {supportEmail}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('about.emailCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('about.emailCopyBtn')}</span>
                    </>
                  )}
                </button>
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors"
                >
                  <span>{t('about.emailAction')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t('about.hoursLabel')}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('about.hoursValue')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-[52px]">
                {t('about.hoursResponse')}
              </p>
            </div>

            {/* Quick Resources Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('about.quickLinksLabel')}
              </p>
              <div className="space-y-2 text-xs font-medium">
                <Link
                  to="/faq"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {t('about.quickFaqLink')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => openFeedback()}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquareHeart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {t('about.quickFeedbackBtn')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-4 pt-1 px-1 text-slate-500 dark:text-slate-400">
                  <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                    {t('about.quickPrivacyLink')}
                  </Link>
                  <span>·</span>
                  <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                    {t('about.quickTermsLink')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card">
            {submitSuccess ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {t('about.successTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {t('about.successDesc')}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    {t('about.sendAnotherBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot field - Ẩn hoàn toàn với người dùng thật, bẫy spam bot */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                  <label htmlFor="contact-website-hp">Website</label>
                  <input
                    id="contact-website-hp"
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {t('about.formTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('about.formSubtitle')}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('about.nameLabel')}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('about.namePlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('about.emailInputLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('about.emailInputPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-topic"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('about.topicLabel')}
                    </label>
                    <select
                      id="contact-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value as ContactTopic)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                      <option value="general">{t('about.topicGeneral')}</option>
                      <option value="support">{t('about.topicSupport')}</option>
                      <option value="content">{t('about.topicContent')}</option>
                      <option value="partnership">{t('about.topicPartnership')}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('about.subjectLabel')}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('about.subjectPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('about.messageLabel')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('about.messagePlaceholder')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('about.submittingBtn')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('about.submitBtn')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
