// app/shop/[storeSlug]/layout.jsx - WITH PROXY API (Original Design Preserved)
'use client';
import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Store, ShoppingCart, Phone, MessageCircle, Clock, MapPin,
  Facebook, Instagram, Twitter, Star, Menu, X, Package,
  Mail, Users, Shield, Moon, Sun, Search
} from 'lucide-react';

// Lottie for loading
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = '/api/proxy/v1';

export default function StoreLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      // Default to dark mode
      const shouldBeDark = storedTheme !== 'light';
      setIsDarkMode(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    fetchStore();
  }, [params.storeSlug]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  // Fetch store using PROXY API
  const fetchStore = async () => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setStore(data.data);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
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

  const navItems = [
    { href: `/shop/${params.storeSlug}`, label: 'Home', icon: Store },
    { href: `/shop/${params.storeSlug}/products`, label: 'Products', icon: Package },
    { href: `/shop/${params.storeSlug}/orders/search`, label: 'Track Order', icon: Search },
    { href: `/shop/${params.storeSlug}/about`, label: 'About', icon: Users },
  ];

  // Loading with Lottie
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="mt-4 text-gray-400 text-sm">Loading store...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Store Not Found</h1>
          <p className="text-gray-400">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors`}>
      {/* Top Banner */}
      {store.storeBanner && (
        <div 
          className="h-32 sm:h-40 md:h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${store.storeBanner})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-40 transition-colors`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Store Name */}
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <Link href={`/shop/${params.storeSlug}`} className="flex items-center ml-2 sm:ml-4 lg:ml-0 min-w-0">
                {store.storeLogo ? (
                  <img 
                    src={store.storeLogo} 
                    alt={store.storeName} 
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mr-2 sm:mr-3 flex-shrink-0 object-cover" 
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-yellow-500 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <Store className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                    {store.storeName}
                  </h1>
                  {store.verification?.isVerified && (
                    <div className="flex items-center text-xs text-green-400">
                      <Shield className="w-3 h-3 mr-1" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-yellow-500 text-black' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Store Status, Dark Mode & Cart */}
            <div className="flex items-center space-x-2">
              <div className={`hidden sm:block px-2 py-1 rounded-full text-xs font-medium ${
                isStoreOpen() 
                  ? 'bg-green-900/50 text-green-400 border border-green-700' 
                  : 'bg-red-900/50 text-red-400 border border-red-700'
              }`}>
                {isStoreOpen() ? 'Open' : 'Closed'}
              </div>
              
              {store.metrics?.rating > 0 && (
                <div className="hidden md:flex items-center text-sm">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {store.metrics.rating.toFixed(1)}
                  </span>
                </div>
              )}
              
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button className={`relative p-2 rounded-lg ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden fixed inset-0 top-14 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* Mobile Store Status */}
              <div className="sm:hidden pb-3 mb-3 border-b border-gray-700">
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  isStoreOpen() 
                    ? 'bg-green-900/50 text-green-400 border border-green-700' 
                    : 'bg-red-900/50 text-red-400 border border-red-700'
                }`}>
                  Store {isStoreOpen() ? 'Open' : 'Closed'}
                </div>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive 
                        ? 'bg-yellow-500 text-black' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Contact */}
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-4 pt-4`}>
                <p className={`px-4 text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-2`}>Contact</p>
                <div className="space-y-1">
                  {store.contactInfo?.phoneNumber && (
                    <a 
                      href={`tel:${store.contactInfo.phoneNumber}`}
                      className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Phone className="w-5 h-5 mr-3 text-yellow-500" />
                      Call Us
                    </a>
                  )}
                  {store.contactInfo?.whatsappNumber && (
                    <a 
                      href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                      className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <MessageCircle className="w-5 h-5 mr-3 text-green-500" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Store Info */}
            <div>
              <div className="flex items-center mb-3">
                {store.storeLogo ? (
                  <img src={store.storeLogo} alt={store.storeName} className="h-8 w-8 rounded-full mr-2" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center mr-2">
                    <Store className="w-4 h-4 text-black" />
                  </div>
                )}
                <h3 className="text-base font-bold">{store.storeName}</h3>
              </div>
              <p className="text-gray-500 text-xs mb-4 line-clamp-2">{store.storeDescription}</p>
              {store.marketing?.referralCode && (
                <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                  <p className="text-[10px] text-gray-500">Referral Code</p>
                  <p className="font-mono font-bold text-yellow-400">{store.marketing.referralCode}</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-yellow-400">Quick Links</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-gray-400 hover:text-white text-xs transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-yellow-400">Contact Us</h3>
              <div className="space-y-2 text-xs">
                {store.contactInfo?.phoneNumber && (
                  <a href={`tel:${store.contactInfo.phoneNumber}`} className="flex items-center text-gray-400 hover:text-white">
                    <Phone className="w-3 h-3 mr-2" />
                    {store.contactInfo.phoneNumber}
                  </a>
                )}
                {store.contactInfo?.whatsappNumber && (
                  <a href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`} className="flex items-center text-gray-400 hover:text-green-400">
                    <MessageCircle className="w-3 h-3 mr-2" />
                    WhatsApp
                  </a>
                )}
                {store.contactInfo?.email && (
                  <a href={`mailto:${store.contactInfo.email}`} className="flex items-center text-gray-400 hover:text-white">
                    <Mail className="w-3 h-3 mr-2" />
                    <span className="truncate">{store.contactInfo.email}</span>
                  </a>
                )}
                {store.contactInfo?.address?.city && (
                  <div className="flex items-start text-gray-400">
                    <MapPin className="w-3 h-3 mr-2 mt-0.5" />
                    <span>{store.contactInfo.address.city}, {store.contactInfo.address.region}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-yellow-400">Hours</h3>
              <div className="space-y-1 text-xs">
                {Object.entries(store.businessHours || {}).slice(0, 7).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-gray-400">
                    <span className="capitalize">{day.slice(0, 3)}</span>
                    <span>{hours.isOpen ? `${hours.open}-${hours.close}` : 'Closed'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social Media */}
          {store.socialMedia && Object.values(store.socialMedia).some(v => v) && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex justify-center space-x-4">
                {store.socialMedia.facebook && (
                  <a href={store.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-500">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {store.socialMedia.instagram && (
                  <a href={store.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-pink-500">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {store.socialMedia.twitter && (
                  <a href={store.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-blue-400">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {store.whatsappSettings?.groupLink && (
                  <a href={store.whatsappSettings.groupLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-green-500">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}