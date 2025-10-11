// app/shop/[storeSlug]/layout.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Store, ShoppingCart, Phone, MessageCircle, Clock, MapPin,
  Facebook, Instagram, Twitter, Star, Menu, X, Package,
  ChevronRight, Mail, Globe, Award, Users, Shield, Moon, Sun,
  Search  // Add Search icon
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

export default function StoreLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference on mount
    if (typeof window !== 'undefined') {
      // Check for system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Check for stored preference
      const storedTheme = localStorage.getItem('theme');
      const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
      setIsDarkMode(shouldBeDark);
      
      // Apply dark class to document
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (!localStorage.getItem('theme')) {
          setIsDarkMode(e.matches);
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    fetchStore();
  }, [params.storeSlug]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setStore(data.data);
        applyStoreTheme(data.data);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyStoreTheme = (storeData) => {
    if (storeData.customization) {
      const { primaryColor, secondaryColor, theme } = storeData.customization;
      
      // Apply theme colors to CSS variables
      document.documentElement.style.setProperty('--primary-color', primaryColor || '#1976d2');
      document.documentElement.style.setProperty('--secondary-color', secondaryColor || '#dc004e');
      
      // Apply custom CSS if provided
      if (storeData.customization.customCSS) {
        const styleElement = document.createElement('style');
        styleElement.textContent = storeData.customization.customCSS;
        document.head.appendChild(styleElement);
      }
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isStoreOpen = () => {
    if (!store || !store.isOpen) return false;
    
    if (!store.autoCloseOutsideHours) return true;
    
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = store.businessHours?.[dayName];
    if (!todayHours || !todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  // Updated navItems with Track Order link
  const navItems = [
    { href: `/shop/${params.storeSlug}`, label: 'Home', icon: Store },
    { href: `/shop/${params.storeSlug}/products`, label: 'Products', icon: Package },
    { href: `/shop/${params.storeSlug}/orders/search`, label: 'Track Order', icon: Search }, // Added this line
    { href: `/shop/${params.storeSlug}/about`, label: 'About', icon: Users },
    // { href: `/shop/${params.storeSlug}/contact`, label: 'Contact', icon: Phone }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 transition-colors px-4">
        <div className="text-center max-w-md">
          <Store className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Store Not Found</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Banner - Responsive height */}
      {store.storeBanner && (
        <div 
          className="h-32 sm:h-40 md:h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${store.storeBanner})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 dark:bg-opacity-60" />
        </div>
      )}

      {/* Header - Sticky with responsive padding */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Store Name - Responsive sizing */}
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              
              <Link href={`/shop/${params.storeSlug}`} className="flex items-center ml-2 sm:ml-4 lg:ml-0 min-w-0">
                {store.storeLogo ? (
                  <img 
                    src={store.storeLogo} 
                    alt={store.storeName} 
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mr-2 sm:mr-3 flex-shrink-0 object-cover" 
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <Store className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {store.storeName}
                  </h1>
                  {store.verification?.isVerified && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <Shield className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="hidden xs:inline">Verified Store</span>
                      <span className="xs:hidden">Verified</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-4 xl:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Store Status, Dark Mode & Cart - Responsive */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Store Status - Hidden on very small screens */}
              <div className={`hidden sm:block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                isStoreOpen() 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              }`}>
                {isStoreOpen() ? 'Open' : 'Closed'}
              </div>
              
              {/* Rating - Hidden on mobile */}
              {store.metrics?.rating > 0 && (
                <div className="hidden md:flex items-center text-sm">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="font-medium text-gray-900 dark:text-white">{store.metrics.rating.toFixed(1)}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({store.metrics.totalReviews})</span>
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-1.5 sm:p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              {/* Cart Button */}
              <button className="relative p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors touch-manipulation">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Full height overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-14 sm:top-16 z-50 bg-white dark:bg-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Store Status */}
              <div className="sm:hidden px-3 py-2">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  isStoreOpen() 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}>
                  Store {isStoreOpen() ? 'Open' : 'Closed'}
                </div>
              </div>

              {/* Mobile Rating */}
              {store.metrics?.rating > 0 && (
                <div className="md:hidden px-3 py-2">
                  <div className="flex items-center text-sm">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium text-gray-900 dark:text-white">{store.metrics.rating.toFixed(1)}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">({store.metrics.totalReviews} reviews)</span>
                  </div>
                </div>
              )}

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors touch-manipulation ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Contact Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="px-3 space-y-3">
                  {store.contactInfo?.phoneNumber && (
                    <a 
                      href={`tel:${store.contactInfo.phoneNumber}`}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Phone className="w-5 h-5 mr-3" />
                      Call Us
                    </a>
                  )}
                  {store.contactInfo?.whatsappNumber && (
                    <a 
                      href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                    >
                      <MessageCircle className="w-5 h-5 mr-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Responsive padding */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {children}
      </main>

      {/* Footer - Responsive grid and padding */}
      <footer className="bg-gray-900 dark:bg-black text-white mt-8 sm:mt-12 md:mt-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Store Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{store.storeName}</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-4 line-clamp-3">
                {store.storeDescription}
              </p>
              {store.marketing?.referralCode && (
                <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-2 sm:p-3 border border-gray-700 dark:border-gray-800">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Referral Code</p>
                  <p className="font-mono font-bold text-sm sm:text-base text-white">{store.marketing.referralCode}</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 text-xs sm:text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Us</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                {store.contactInfo?.phoneNumber && (
                  <a 
                    href={`tel:${store.contactInfo.phoneNumber}`}
                    className="flex items-center text-gray-400 dark:text-gray-500 hover:text-white transition-colors"
                  >
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{store.contactInfo.phoneNumber}</span>
                  </a>
                )}
                {store.contactInfo?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                    className="flex items-center text-gray-400 dark:text-gray-500 hover:text-green-400 dark:hover:text-green-500 transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    WhatsApp
                  </a>
                )}
                {store.contactInfo?.email && (
                  <a 
                    href={`mailto:${store.contactInfo.email}`}
                    className="flex items-center text-gray-400 dark:text-gray-500 hover:text-white transition-colors"
                  >
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{store.contactInfo.email}</span>
                  </a>
                )}
                {store.contactInfo?.address?.city && (
                  <div className="flex items-start text-gray-400 dark:text-gray-500">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm">
                      {store.contactInfo.address.city}, {store.contactInfo.address.region}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Business Hours</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                {Object.entries(store.businessHours || {}).slice(0, 7).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-gray-400 dark:text-gray-500">
                    <span className="capitalize">{day.slice(0, 3)}:</span>
                    <span className="text-right">
                      {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Media - Responsive spacing */}
          {store.socialMedia && Object.values(store.socialMedia).some(v => v) && (
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 dark:border-gray-900">
              <div className="flex justify-center space-x-4 sm:space-x-6">
                {store.socialMedia.facebook && (
                  <a 
                    href={store.socialMedia.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors touch-manipulation"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                )}
                {store.socialMedia.instagram && (
                  <a 
                    href={store.socialMedia.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-pink-500 dark:hover:text-pink-400 transition-colors touch-manipulation"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                )}
                {store.socialMedia.twitter && (
                  <a 
                    href={store.socialMedia.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-400 dark:hover:text-blue-300 transition-colors touch-manipulation"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                )}
                {store.whatsappSettings?.groupLink && (
                  <a 
                    href={store.whatsappSettings.groupLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors touch-manipulation"
                    aria-label="WhatsApp Group"
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Copyright - Responsive text */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 dark:border-gray-900 text-center text-xs sm:text-sm text-gray-400 dark:text-gray-500">
            <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
            {/* <p className="mt-2">Powered by DataMart</p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}