'use client';
import { useState, useEffect } from 'react';
import { X, Info, Gift, AlertTriangle, CheckCircle, ExternalLink, Bell } from 'lucide-react';
import { shouldShowAnnouncement, markAnnouncementShown } from '@/lib/designCache';

const typeIcons = {
  info: Info,
  promo: Gift,
  warning: AlertTriangle,
  success: CheckCircle
};

const typeColors = {
  info: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  promo: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  warning: { bg: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  success: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' }
};

/**
 * Banner Style - Appears at top of page
 */
const BannerAnnouncement = ({ announcement, onClose, theme }) => {
  const colors = typeColors[announcement.type] || typeColors.info;
  const Icon = typeIcons[announcement.type] || Info;

  return (
    <div className={`${colors.bg} text-white py-3 px-4 relative animate-slideDown`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            {announcement.title && (
              <span className="font-semibold mr-2">{announcement.title}</span>
            )}
            <span className="text-white/90">{announcement.message}</span>
          </div>
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition whitespace-nowrap"
            >
              {announcement.linkText || 'Learn More'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition"
          aria-label="Close announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Modal Style - Center of screen overlay
 */
const ModalAnnouncement = ({ announcement, onClose, theme }) => {
  const colors = typeColors[announcement.type] || typeColors.info;
  const Icon = typeIcons[announcement.type] || Info;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className={`${colors.bg} px-6 py-4 flex items-center gap-3`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">
              {announcement.title || 'Announcement'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {announcement.message}
          </p>

          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 inline-flex items-center gap-2 ${colors.text} font-medium hover:underline`}
            >
              {announcement.linkText || 'Learn More'}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-medium text-white transition hover:opacity-90 ${colors.bg}`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Slide Style - Slides in from bottom
 */
const SlideAnnouncement = ({ announcement, onClose, theme }) => {
  const colors = typeColors[announcement.type] || typeColors.info;
  const Icon = typeIcons[announcement.type] || Info;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-slideUp">
      <div className={`${colors.light} border ${colors.border} rounded-2xl shadow-lg overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {announcement.title && (
                <h4 className={`font-semibold ${colors.text} mb-1`}>{announcement.title}</h4>
              )}
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {announcement.message}
              </p>
              {announcement.link && (
                <a
                  href={announcement.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex items-center gap-1 ${colors.text} text-sm font-medium hover:underline`}
                >
                  {announcement.linkText || 'Learn More'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Toast Style - Small notification
 */
const ToastAnnouncement = ({ announcement, onClose, theme }) => {
  const colors = typeColors[announcement.type] || typeColors.info;
  const Icon = typeIcons[announcement.type] || Info;

  useEffect(() => {
    // Auto-close after 8 seconds
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-[100] animate-slideInRight">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {announcement.title && <span className="font-semibold">{announcement.title}: </span>}
              {announcement.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full ${colors.bg} animate-shrink`}
            style={{ animationDuration: '8s' }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Main Announcement Popup Component
 */
export default function AnnouncementPopup({ announcement, style = 'banner', theme }) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Check if announcement should be shown
    if (shouldShowAnnouncement(announcement)) {
      // Small delay for better UX
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  const handleClose = () => {
    setVisible(false);
    setClosed(true);

    // Mark as shown if showOnce is enabled
    if (announcement?.showOnce) {
      markAnnouncementShown(announcement);
    }
  };

  if (!visible || closed || !announcement) return null;

  // Render based on style
  switch (style) {
    case 'banner':
      return <BannerAnnouncement announcement={announcement} onClose={handleClose} theme={theme} />;
    case 'modal':
      return <ModalAnnouncement announcement={announcement} onClose={handleClose} theme={theme} />;
    case 'slide':
      return <SlideAnnouncement announcement={announcement} onClose={handleClose} theme={theme} />;
    case 'toast':
      return <ToastAnnouncement announcement={announcement} onClose={handleClose} theme={theme} />;
    default:
      return null;
  }
}
