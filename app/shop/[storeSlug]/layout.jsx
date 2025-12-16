// app/shop/[storeSlug]/layout.jsx - FIXED MOBILE NAV
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, ShoppingCart, Phone, MessageCircle, MapPin,
  Facebook, Instagram, Twitter, Star, Menu, X, Package,
  ChevronRight, Mail, Shield, Moon, Sun, Search, Home, Info
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Compact Network Icons
const MTNIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#ffcc00"/>
    <path d="M12 16 L17 26 L20 16 L23 26 L28 16" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#cc0000"/>
    <text x="20" y="24" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#fff">T</text>
  </svg>
);

const ATIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#7c3aed"/>
    <text x="20" y="25" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="#fff">AT</text>
  </svg>
);

const NETWORKS = [
  { key: 'YELLO', name: 'MTN', icon: MTNIcon, bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { key: 'TELECEL', name: 'Telecel', icon: TelecelIcon, bg: 'bg-red-500', text: 'text-red-500' },
  { key: 'AT_PREMIUM', name: 'AT', icon: ATIcon, bg: 'bg-purple-500', text: 'text-purple-500' }
];

export default function StoreLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
  }, []);

  useEffect(() => {
    fetchStore();
  }, [params.storeSlug]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const fetchStore = async () => {
    try {
      const response = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const data = await response.json();
      if (data.status === 'success') setStore(data.data);
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
    document.documentElement.classList.toggle('dark', newMode);
  };

  const isStoreOpen = () => {
    if (!store?.isOpen) return false;
    if (!store.autoCloseOutsideHours) return true;
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toTimeString().slice(0, 5);
    const hours = store.businessHours?.[day];
    return hours?.isOpen && time >= hours.open && time <= hours.close;
  };

  // Fast navigation - useCallback to prevent re-renders
  const goToNetwork = useCallback((network) => {
    router.push(`/shop/${params.storeSlug}/products?network=${network}`);
  }, [router, params.storeSlug]);

  const goToPage = useCallback((path) => {
    router.push(`/shop/${params.storeSlug}${path}`);
  }, [router, params.storeSlug]);

  const navItems = [
    { path: '', label: 'Home', icon: Home },
    { path: '/products', label: 'Bundles', icon: Package },
    { path: '/orders/search', label: 'Track', icon: Search },
    { path: '/about', label: 'About', icon: Info },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-3 border-gray-700 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center">
          <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Store Not Found</h1>
        </div>
      </div>
    );
  }

  const isActive = (path) => {
    if (path === '') return pathname === `/shop/${params.storeSlug}`;
    return pathname.includes(path);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* ===== HEADER ===== */}
      <header className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} border-b backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14">
            
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 -ml-2 rounded-lg ${isDarkMode ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <Link href={`/shop/${params.storeSlug}`} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  {store.storeLogo ? (
                    <img src={store.storeLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <Store className="w-4 h-4 text-black" />
                  )}
                </div>
                <span className="font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
                  {store.storeName}
                </span>
              </Link>
            </div>

            {/* Center: Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={`/shop/${params.storeSlug}${item.path}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-yellow-500 text-black'
                      : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="w-px h-6 bg-gray-700 mx-2" />
              {NETWORKS.map((n) => (
                <button
                  key={n.key}
                  onClick={() => goToNetwork(n.key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  } ${n.text}`}
                >
                  <n.icon size={18} />
                  {n.name}
                </button>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {store.contactInfo?.whatsappNumber && (
                <a
                  href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Chat</span>
                </a>
              )}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${isDarkMode ? 'text-yellow-500 active:bg-gray-800' : 'text-gray-600 active:bg-gray-100'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU - Cleaner & Compact ===== */}
      {mobileMenuOpen && (
        <div className={`lg:hidden fixed inset-0 top-14 z-40 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="p-4 space-y-4 overflow-y-auto h-full pb-32">
            
            {/* Store Status */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isStoreOpen() ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">{isStoreOpen() ? 'Open' : 'Closed'}</span>
              </div>
              {store.metrics?.rating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{store.metrics.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Network Quick Links - Compact Row */}
            <div>
              <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                BUY DATA
              </p>
              <div className="flex gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => {
                      goToNetwork(n.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white ${n.bg} active:opacity-80`}
                  >
                    <n.icon size={20} />
                    {n.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Links - Compact */}
            <div>
              <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                MENU
              </p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={`/shop/${params.storeSlug}${item.path}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive(item.path)
                          ? 'bg-yellow-500 text-black'
                          : isDarkMode ? 'text-gray-300 active:bg-gray-800' : 'text-gray-700 active:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Contact - Compact */}
            <div className="flex gap-2">
              {store.contactInfo?.whatsappNumber && (
                <a
                  href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {store.contactInfo?.phoneNumber && (
                <a
                  href={`tel:${store.contactInfo.phoneNumber}`}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== BOTTOM NAV - Fixed Touch Issues ===== */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-50 ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } border-t`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-14">
          {/* Home */}
          <button
            onClick={() => goToPage('')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${
              isActive('') && !pathname.includes('/products') ? 'text-yellow-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Networks */}
          {NETWORKS.map((n) => (
            <button
              key={n.key}
              onClick={() => goToNetwork(n.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${
                pathname.includes(`network=${n.key}`) ? n.text : isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              <n.icon size={20} />
              <span className="text-[10px] font-medium">{n.name}</span>
            </button>
          ))}

          {/* Track */}
          <button
            onClick={() => goToPage('/orders/search')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${
              isActive('/orders') ? 'text-yellow-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Track</span>
          </button>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 lg:pb-8">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={`${isDarkMode ? 'bg-black' : 'bg-gray-900'} text-white mt-8 pb-20 lg:pb-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Store */}
            <div className="col-span-2 lg:col-span-1">
              <h3 className="font-bold mb-3">{store.storeName}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{store.storeDescription}</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link key={item.path} href={`/shop/${params.storeSlug}${item.path}`} className="block text-gray-400 text-sm hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Networks */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Data Bundles</h4>
              <div className="space-y-2">
                {NETWORKS.map((n) => (
                  <button key={n.key} onClick={() => goToNetwork(n.key)} className={`block text-sm ${n.text}`}>
                    {n.name} Bundles
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <div className="space-y-2 text-sm">
                {store.contactInfo?.phoneNumber && (
                  <a href={`tel:${store.contactInfo.phoneNumber}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
                    <Phone className="w-4 h-4" />
                    {store.contactInfo.phoneNumber}
                  </a>
                )}
                {store.contactInfo?.whatsappNumber && (
                  <a href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`} className="flex items-center gap-2 text-gray-400 hover:text-green-400">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {store.storeName}
          </div>
        </div>
      </footer>
    </div>
  );
}