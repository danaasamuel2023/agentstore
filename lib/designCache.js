/**
 * Design Settings Cache Utility
 * Caches store design settings for 1 hour to reduce API calls
 * Agent store owners are informed that design changes may take up to 1 hour to reflect
 */

const CACHE_KEY_PREFIX = 'store_design_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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

    // Check if cache has expired (1 hour)
    if (now - timestamp > CACHE_DURATION) {
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
 * @returns {number} - Minutes remaining until cache expires, or 0 if expired/not found
 */
export const getCacheTimeRemaining = (storeSlug) => {
  if (typeof window === 'undefined') return 0;

  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${storeSlug}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return 0;

    const { timestamp } = JSON.parse(cached);
    const elapsed = Date.now() - timestamp;
    const remaining = CACHE_DURATION - elapsed;

    return remaining > 0 ? Math.ceil(remaining / 60000) : 0; // Return minutes
  } catch (error) {
    return 0;
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

export default {
  getCachedDesign,
  setCachedDesign,
  clearCachedDesign,
  getCacheTimeRemaining,
  extractDesignSettings,
  shouldShowAnnouncement,
  markAnnouncementShown
};
