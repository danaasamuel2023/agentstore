'use client';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Phone, MessageCircle, Menu, X, Clock, MapPin, Users, Briefcase, Moon, Sun } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop';

// Theme color presets (same as homepage)
const themePresets = {
  blue: { primary: '#2563EB', secondary: '#1E40AF', accent: '#3B82F6', text: '#FFFFFF' },
  green: { primary: '#059669', secondary: '#047857', accent: '#10B981', text: '#FFFFFF' },
  purple: { primary: '#7C3AED', secondary: '#6D28D9', accent: '#8B5CF6', text: '#FFFFFF' },
  red: { primary: '#DC2626', secondary: '#B91C1C', accent: '#EF4444', text: '#FFFFFF' },
  orange: { primary: '#EA580C', secondary: '#C2410C', accent: '#F97316', text: '#FFFFFF' },
  pink: { primary: '#DB2777', secondary: '#BE185D', accent: '#EC4899', text: '#FFFFFF' },
  teal: { primary: '#0D9488', secondary: '#0F766E', accent: '#14B8A6', text: '#FFFFFF' },
  indigo: { primary: '#4F46E5', secondary: '#4338CA', accent: '#6366F1', text: '#FFFFFF' },
  yellow: { primary: '#FACC15', secondary: '#EAB308', accent: '#FDE047', text: '#000000' },
  dark: { primary: '#1F2937', secondary: '#111827', accent: '#374151', text: '#FFFFFF' },
};

// Get theme colors from store
const getThemeColors = (store) => {
  const themeName = store?.theme?.name || store?.settings?.theme || 'dark';
  const customPrimary = store?.theme?.primaryColor || store?.settings?.primaryColor;
  const customSecondary = store?.theme?.secondaryColor || store?.settings?.secondaryColor;
  const customAccent = store?.theme?.accentColor || store?.settings?.accentColor;

  if (customPrimary) {
    return {
      primary: customPrimary,
      secondary: customSecondary || customPrimary,
      accent: customAccent || '#FACC15',
      text: isLightColor(customPrimary) ? '#000000' : '#FFFFFF'
    };
  }

  return themePresets[themeName] || themePresets.dark;
};

// Check if a color is light
const isLightColor = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

export default function StoreLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subAgentEnabled, setSubAgentEnabled] = useState(false);
  const [activationFee, setActivationFee] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shopDarkMode');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(saved ? saved === 'true' : prefersDark);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
      localStorage.setItem('shopDarkMode', darkMode.toString());
    }
  }, [darkMode]);

  useEffect(() => {
    fetchStore();
    checkSubAgentStatus();
  }, [params.storeSlug]);
  
  const checkSubAgentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sub-agent/store/${params.storeSlug}/join-info`);
      const data = await res.json();
      if (data.status === 'success') {
        setSubAgentEnabled(true);
        setActivationFee(data.data?.settings?.activationFee?.amount || 0);
      }
    } catch (e) {
      setSubAgentEnabled(false);
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/agent-stores/store/${params.storeSlug}`);
      const data = await res.json();
      if (data.status === 'success') {
        setStore(data.data);
        // Store slug for other pages
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOpen = () => {
    if (!store?.isOpen) return false;
    if (!store.autoCloseOutsideHours) return true;
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toTimeString().slice(0, 5);
    const hours = store.businessHours?.[day];
    return hours?.isOpen && time >= hours.open && time <= hours.close;
  };

  const isActive = (path) => {
    if (path === '') return pathname === `/shop/${params.storeSlug}` || pathname === `/shop/${params.storeSlug}/`;
    return pathname.includes(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-500">This shop doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { path: '', label: 'Home' },
    { path: '/products', label: 'Buy Data' },
    { path: '/orders/search', label: 'Track Order' },
    { path: '/about', label: 'About' },
  ];

  // Get theme colors
  const theme = getThemeColors(store);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      
      {/* Top Info Bar - Uses Store Theme */}
      <div 
        className="text-xs"
        style={{ backgroundColor: theme.primary, color: theme.text }}
      >
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 opacity-80">
              <Clock className="w-3 h-3" />
              Delivery: 10min - 1hr
            </span>
            <span className={`hidden sm:flex items-center gap-1.5 ${isOpen() ? 'text-green-400' : 'text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOpen() ? 'bg-green-400' : 'bg-red-400'}`}></span>
              {isOpen() ? 'Open Now' : 'Closed'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {store.contactInfo?.phoneNumber && (
              <a href={`tel:${store.contactInfo.phoneNumber}`} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">{store.contactInfo.phoneNumber}</span>
              </a>
            )}
            {store.contactInfo?.whatsappNumber && (
              <a 
                href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition"
              >
                <MessageCircle className="w-3 h-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Store Name */}
            <Link href={`/shop/${params.storeSlug}`} className="flex items-center gap-3">
              {store.storeLogo ? (
                <img src={store.storeLogo} alt={store.storeName} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                  }}
                >
                  <span style={{ color: theme.text }} className="font-bold text-lg">{store.storeName?.charAt(0)}</span>
                </div>
              )}
              <span className="font-bold text-gray-900 dark:text-white text-lg hidden sm:block">{store.storeName}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={`/shop/${params.storeSlug}${link.path}`}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path) 
                      ? 'shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  style={isActive(link.path) ? { 
                    backgroundColor: theme.primary,
                    color: theme.text 
                  } : {}}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <span 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    ></span>
                  )}
                </Link>
              ))}
              
              {/* Become a Reseller - Show if enabled */}
              {subAgentEnabled && (
                <Link
                  href={`/shop/${params.storeSlug}/join`}
                  className="ml-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  Become a Reseller
                </Link>
              )}
              
              {/* Dark Mode Toggle - Desktop */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="ml-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </nav>

            {/* Dark Mode Toggle - Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  menuOpen 
                    ? 'shadow-lg' 
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-300 hover:shadow-md'
                }`}
                style={menuOpen ? { backgroundColor: theme.primary, color: theme.text } : {}}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                <div className="relative w-6 h-6">
                  {/* Hamburger to X animation */}
                  <span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    menuOpen ? 'top-[11px] rotate-45' : 'top-1'
                  }`}></span>
                  <span className={`absolute left-0 top-[11px] w-6 h-0.5 bg-current transition-all duration-200 ${
                    menuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                  }`}></span>
                  <span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    menuOpen ? 'top-[11px] -rotate-45' : 'top-5'
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-400 ease-out ${
          menuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.path}
                  href={`/shop/${params.storeSlug}${link.path}`}
                  className={`block px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive(link.path) 
                      ? 'shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98]'
                  }`}
                  style={{ 
                    transform: menuOpen ? 'translateX(0)' : 'translateX(-20px)',
                    opacity: menuOpen ? 1 : 0,
                    transition: `all 0.3s ease-out ${index * 0.05}s`,
                    ...(isActive(link.path) ? { backgroundColor: theme.primary, color: theme.text } : {})
                  }}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Become a Reseller - Mobile */}
              {subAgentEnabled && (
                <>
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reseller Program</p>
                  </div>
                  <Link
                    href={`/shop/${params.storeSlug}/join`}
                    className="block px-4 py-3.5 rounded-xl font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 transition-all duration-200 active:scale-[0.98] shadow-lg"
                    style={{ 
                      transform: menuOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: menuOpen ? 1 : 0,
                      transition: 'all 0.3s ease-out 0.2s'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-semibold">Become a Reseller</span>
                        <span className="text-xs text-green-200">
                          {activationFee > 0 ? `GH₵${activationFee} to start` : 'Free to join'}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href={`/shop/${params.storeSlug}/agent-login`}
                    className="block px-4 py-3.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-[0.98]"
                    style={{ 
                      transform: menuOpen ? 'translateX(0)' : 'translateX(-20px)',
                      opacity: menuOpen ? 1 : 0,
                      transition: 'all 0.3s ease-out 0.25s'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                      </div>
                      <span>Reseller Login</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {store.storeLogo ? (
                  <img src={store.storeLogo} alt={store.storeName} className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
                    }}
                  >
                    <span style={{ color: theme.text }} className="font-bold">{store.storeName?.charAt(0)}</span>
                  </div>
                )}
                <span className="font-bold text-lg text-gray-900 dark:text-white">{store.storeName}</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm">
                {store.storeDescription || 'Your trusted source for affordable data bundles. Fast delivery, best prices, all networks supported.'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    href={`/shop/${params.storeSlug}${link.path}`} 
                    className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Reseller / Contact */}
            <div>
              {subAgentEnabled ? (
                <>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Sell With Us</h4>
                  <div className="space-y-3">
                    <Link 
                      href={`/shop/${params.storeSlug}/join`}
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"
                    >
                      <Users className="w-4 h-4" />
                      Become a Reseller
                    </Link>
                    <Link 
                      href={`/shop/${params.storeSlug}/agent-login`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
                    >
                      <Briefcase className="w-4 h-4" />
                      Reseller Login
                    </Link>
                    <p className="text-xs text-gray-400">
                      {activationFee > 0 ? `Start with GH₵${activationFee}` : 'Free to join'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-gray-900 mb-4">Contact Us</h4>
                  <div className="space-y-3">
                    {store.contactInfo?.phoneNumber && (
                      <a href={`tel:${store.contactInfo.phoneNumber}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition">
                        <Phone className="w-4 h-4" />
                        {store.contactInfo.phoneNumber}
                      </a>
                    )}
                    {store.contactInfo?.whatsappNumber && (
                      <a 
                        href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp Us
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {store.storeName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {store.contactInfo?.whatsappNumber && (
        <a
          href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}?text=Hi, I'd like to buy data bundles`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 hover:shadow-xl transition-all duration-300 z-40 animate-bounce-slow group"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
        </a>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        /* Custom transition duration */
        .duration-400 {
          transition-duration: 400ms;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.4s ease-out forwards;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        /* Smooth page transitions */
        .page-transition {
          animation: fadeInUp 0.3s ease-out;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Better tap feedback on mobile */
        @media (hover: none) {
          button:active, a:active {
            transform: scale(0.97);
            transition: transform 0.1s;
          }
        }
      `}</style>
    </div>
  );
}
