/**
 * Design Settings Cache Utility
 * Caches store design settings based on admin-configured duration (in seconds)
 * Duration is fetched from server and cached locally
 */

const CACHE_KEY_PREFIX = 'store_design_';
const CACHE_SETTINGS_KEY = 'design_cache_settings';
const DEFAULT_CACHE_DURATION = 3600 * 1000; // Default 1 hour in milliseconds
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.datamartgh.shop';

/**
 * Get the cache duration from server settings
 * Caches the duration setting itself for 5 minutes (shorter for faster updates during demos)
 * @returns {Promise<number>} - Cache duration in milliseconds
 */
export const getCacheDuration = async () => {
  if (typeof window === 'undefined') return DEFAULT_CACHE_DURATION;

  try {
    // Check if we have cached settings
    const cachedSettings = localStorage.getItem(CACHE_SETTINGS_KEY);
    if (cachedSettings) {
      const { duration, timestamp } = JSON.parse(cachedSettings);
      // Cache the settings themselves for 5 minutes (for faster demo updates)
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return duration;
      }
    }

    // Fetch from server
    const response = await fetch(`${API_BASE}/api/system-settings/agent-store/design-cache`);
    const data = await response.json();

    if (data.success && data.data?.cacheDurationMs) {
      const duration = data.data.cacheDurationMs;
      // Cache the settings
      localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify({
        duration,
        durationSeconds: data.data.cacheDurationSeconds,
        notice: data.data.notice,
        timestamp: Date.now()
      }));
      return duration;
    }

    return DEFAULT_CACHE_DURATION;
  } catch (error) {
    console.error('Error fetching cache duration:', error);
    return DEFAULT_CACHE_DURATION;
  }
};

/**
 * Get cache duration synchronously (from localStorage cache or default)
 * @returns {number} - Cache duration in milliseconds
 */
export const getCacheDurationSync = () => {
  if (typeof window === 'undefined') return DEFAULT_CACHE_DURATION;

  try {
    const cachedSettings = localStorage.getItem(CACHE_SETTINGS_KEY);
    if (cachedSettings) {
      const { duration, timestamp } = JSON.parse(cachedSettings);
      // Settings cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return duration;
      }
    }
    return DEFAULT_CACHE_DURATION;
  } catch (error) {
    return DEFAULT_CACHE_DURATION;
  }
};

/**
 * Get cached design settings for a store
 * @param {string} storeSlug - The store's slug identifier
 * @returns {object|null} - Cached design settings or null if not found/expired
 */
export const getCachedDesign = (storeSlug) => {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${storeSlug}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const cacheDuration = getCacheDurationSync();

    // Check if cache has expired
    if (now - timestamp > cacheDuration) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading design cache:', error);
    return null;
  }
};

/**
 * Cache design settings for a store
 * @param {string} storeSlug - The store's slug identifier
 * @param {object} designSettings - The design settings to cache
 */
export const setCachedDesign = (storeSlug, designSettings) => {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${storeSlug}`;
    const cacheData = {
      data: designSettings,
      timestamp: Date.now()
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting design cache:', error);
  }
};

/**
 * Clear cached design settings for a store
 * @param {string} storeSlug - The store's slug identifier
 */
export const clearCachedDesign = (storeSlug) => {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${storeSlug}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing design cache:', error);
  }
};

/**
 * Get time remaining until cache expires
 * @param {string} storeSlug - The store's slug identifier
 * @returns {number} - Seconds remaining until cache expires, or 0 if expired/not found
 */
export const getCacheTimeRemaining = (storeSlug) => {
  if (typeof window === 'undefined') return 0;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${storeSlug}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return 0;

    const { timestamp } = JSON.parse(cached);
    const elapsed = Date.now() - timestamp;
    const cacheDuration = getCacheDurationSync();
    const remaining = cacheDuration - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0; // Return seconds
  } catch (error) {
    return 0;
  }
};

/**
 * Get the cache notice message (for display to users)
 * @returns {string|null} - Notice message or null
 */
export const getCacheNotice = () => {
  if (typeof window === 'undefined') return null;

  try {
    const cachedSettings = localStorage.getItem(CACHE_SETTINGS_KEY);
    if (cachedSettings) {
      const { notice } = JSON.parse(cachedSettings);
      return notice || null;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Extract design settings from store data
 * @param {object} store - Full store data from API
 * @returns {object} - Design settings object
 */
export const extractDesignSettings = (store) => {
  if (!store) return null;

  return {
    // Basic theme settings
    theme: store.customization?.theme || 'default',
    primaryColor: store.customization?.primaryColor || '#1976d2',
    secondaryColor: store.customization?.secondaryColor || '#dc004e',

    // Section-based design styles
    navStyle: store.customization?.navStyle || 'default',
    heroStyle: store.customization?.heroStyle || 'default',
    packageDisplayStyle: store.customization?.packageDisplayStyle || 'default',
    announcementPopupStyle: store.customization?.announcementPopupStyle || 'none',

    // Announcement settings
    announcement: store.announcement || null,

    // WhatsApp group link
    whatsappGroupLink: store.whatsappSettings?.groupLink || null,

    // Store branding
    storeName: store.storeName,
    storeLogo: store.storeLogo,
    storeDescription: store.storeDescription,

    // Contact info for display
    contactInfo: store.contactInfo,

    // Cache metadata
    cachedAt: new Date().toISOString()
  };
};

/**
 * Check if announcement should be shown
 * @param {object} announcement - Announcement settings from design cache
 * @returns {boolean} - Whether the announcement should be displayed
 */
export const shouldShowAnnouncement = (announcement) => {
  if (!announcement || !announcement.enabled) return false;

  const now = new Date();

  // Check date range if set
  if (announcement.startDate && new Date(announcement.startDate) > now) {
    return false;
  }
  if (announcement.endDate && new Date(announcement.endDate) < now) {
    return false;
  }

  // Check if showOnce and already shown
  if (announcement.showOnce && typeof window !== 'undefined') {
    const shownKey = `announcement_shown_${announcement._id || announcement.title}`;
    if (sessionStorage.getItem(shownKey)) {
      return false;
    }
  }

  return true;
};

/**
 * Mark announcement as shown (for showOnce feature)
 * @param {object} announcement - Announcement settings
 */
export const markAnnouncementShown = (announcement) => {
  if (typeof window === 'undefined' || !announcement) return;

  const shownKey = `announcement_shown_${announcement._id || announcement.title}`;
  sessionStorage.setItem(shownKey, 'true');
};

/**
 * Initialize cache settings by fetching from server
 * Call this on app startup
 */
export const initCacheSettings = async () => {
  await getCacheDuration();
};

/**
 * Force refresh cache settings from server
 * Useful when admin changes cache duration
 */
export const refreshCacheSettings = async () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CACHE_SETTINGS_KEY);
  await getCacheDuration();
};

export default {
  getCachedDesign,
  setCachedDesign,
  clearCachedDesign,
  getCacheTimeRemaining,
  getCacheDuration,
  getCacheDurationSync,
  getCacheNotice,
  extractDesignSettings,
  shouldShowAnnouncement,
  markAnnouncementShown,
  initCacheSettings,
  refreshCacheSettings
};
