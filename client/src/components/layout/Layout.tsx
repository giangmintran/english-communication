import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { DailyReminderModal } from '@/components/daily/DailyReminderModal';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Tự động bật pop-up nhắc nhở học mỗi ngày khi vào web lần đầu tiên trong ngày
  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastPopupDate = localStorage.getItem('last_daily_reminder_date');

      if (lastPopupDate !== todayStr) {
        const timer = setTimeout(() => {
          setIsReminderOpen(true);
          localStorage.setItem('last_daily_reminder_date', todayStr);
        }, 800);

        return () => clearTimeout(timer);
      }
    } catch {
      // Bỏ qua nếu localStorage bị vô hiệu hóa
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      <div className="flex min-h-screen">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenReminder={() => setIsReminderOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-8 sm:pb-8 transition-all">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer (Single point of navigation for mobile) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Daily Study Reminder Modal */}
      <DailyReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />
    </div>
  );
}
