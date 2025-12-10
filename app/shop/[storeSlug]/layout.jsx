// app/shop/[storeSlug]/layout.jsx - ENHANCED WITH NETWORK LINKS
'use client';
import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, ShoppingCart, Phone, MessageCircle, Clock, MapPin,
  Facebook, Instagram, Twitter, Star, Menu, X, Package,
  ChevronRight, Mail, Globe, Award, Users, Shield, Moon, Sun,
  Search, Zap, Home, Info, Wifi
} from 'lucide-react';

const API_BASE = '/api/proxy/v1';

// Network Icons as SVG components
const MTNIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#ffcc00" stroke="#000" strokeWidth="1"/>
    <path d="M10 16 L16 28 L20 16 L24 28 L30 16" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#fff" stroke="#cc0000" strokeWidth="2"/>
    <text x="20" y="24" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="#cc0000">TEL</text>
  </svg>
);

const AirtelTigoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1"/>
    <text x="20" y="24" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#fff">AT</text>
  </svg>
);

// Network data for quick links
const NETWORKS = [
  { 
    key: 'YELLO', 
    name: 'MTN', 
    icon: MTNIcon,
    color: 'from-yellow-400 to-yellow-500',
    hoverBg: 'hover:bg-yellow-500/20',
    textColor: 'text-yellow-500',
    borderColor: 'border-yellow-500'
  },
  { 
    key: 'TELECEL', 
    name: 'Telecel', 
    icon: TelecelIcon,
    color: 'from-red-500 to-red-600',
    hoverBg: 'hover:bg-red-500/20',
    textColor: 'text-red-500',
    borderColor: 'border-red-500'
  },
  { 
    key: 'AT_PREMIUM', 
    name: 'AirtelTigo', 
    icon: AirtelTigoIcon,
    color: 'from-purple-500 to-purple-600',
    hoverBg: 'hover:bg-purple-500/20',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-500'
  }
];

export default function StoreLayout({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
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
    document.documentElement.classList.toggle('dark', newMode);
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
    { href: `/shop/${params.storeSlug}`, label: 'Home', icon: Home },
    { href: `/shop/${params.storeSlug}/products`, label: 'All Bundles', icon: Package },
    { href: `/shop/${params.storeSlug}/orders/search`, label: 'Track Order', icon: Search },
    { href: `/shop/${params.storeSlug}/about`, label: 'About', icon: Info },
  ];

  const navigateToNetwork = (networkKey) => {
    router.push(`/shop/${params.storeSlug}/products?network=${networkKey}`);
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center px-4">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-yellow-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Loading store...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <Store className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Store Not Found</h1>
          <p className="text-gray-400">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
      
      {/* ===== ENHANCED HEADER ===== */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? isDarkMode 
            ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg shadow-black/20' 
            : 'bg-white/95 backdrop-blur-lg shadow-lg'
          : isDarkMode 
            ? 'bg-gray-900' 
            : 'bg-white'
      }`}>
        
        {/* Top Bar - Store Info */}
        <div className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              
              {/* Logo & Store Name */}
              <div className="flex items-center flex-1 min-w-0">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`lg:hidden p-2 rounded-xl mr-2 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <Link href={`/shop/${params.storeSlug}`} className="flex items-center group">
                  {store.storeLogo ? (
                    <img 
                      src={store.storeLogo} 
                      alt={store.storeName} 
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover ring-2 ring-yellow-500/30 group-hover:ring-yellow-500/60 transition-all" 
                    />
                  ) : (
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center ring-2 ring-yellow-500/30 group-hover:ring-yellow-500/60 transition-all">
                      <Store className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                    </div>
                  )}
                  <div className="ml-3 min-w-0">
                    <h1 className={`text-lg sm:text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {store.storeName}
                    </h1>
                    <div className="flex items-center gap-2">
                      {store.verification?.isVerified && (
                        <span className="flex items-center text-[10px] sm:text-xs text-green-500">
                          <Shield className="w-3 h-3 mr-0.5" />
                          Verified
                        </span>
                      )}
                      <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        isStoreOpen() 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isStoreOpen() ? '● Open' : '● Closed'}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Rating */}
                {store.metrics?.rating > 0 && (
                  <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-xl ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className={`ml-1 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {store.metrics.rating.toFixed(1)}
                    </span>
                    <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      ({store.metrics.totalReviews})
                    </span>
                  </div>
                )}
                
                {/* WhatsApp Quick Link */}
                {store.contactInfo?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-500 rounded-xl hover:bg-green-500/30 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Chat</span>
                  </a>
                )}
                
                {/* Dark Mode Toggle */}
                <button 
                  onClick={toggleDarkMode}
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 text-yellow-500 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {/* Cart */}
                <button className={`relative p-2.5 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                  <ShoppingCart className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== NAVIGATION BAR WITH NETWORK LINKS ===== */}
        <div className={`hidden lg:block border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              
              {/* Main Nav Links */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href.includes('/products') && pathname.includes('/products') && !pathname.includes('network='));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-yellow-500 text-black' 
                          : isDarkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Network Quick Links */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium mr-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Quick Buy:
                </span>
                {NETWORKS.map((network) => {
                  const NetworkIcon = network.icon;
                  const isActive = pathname.includes(`network=${network.key}`);
                  return (
                    <button
                      key={network.key}
                      onClick={() => navigateToNetwork(network.key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        isActive 
                          ? `bg-gradient-to-r ${network.color} text-white border-transparent` 
                          : isDarkMode 
                            ? `border-gray-700 ${network.hoverBg} ${network.textColor} hover:border-transparent` 
                            : `border-gray-300 ${network.hoverBg} ${network.textColor} hover:border-transparent`
                      }`}
                    >
                      <NetworkIcon size={18} />
                      <span className="hidden xl:inline">{network.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileMenuOpen && (
          <div className={`lg:hidden fixed inset-0 top-14 sm:top-16 z-50 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="h-full overflow-y-auto pb-20">
              <div className="px-4 py-4">
                
                {/* Store Status Card */}
                <div className={`p-4 rounded-2xl mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {store.storeLogo ? (
                        <img src={store.storeLogo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                          <Store className="w-6 h-6 text-black" />
                        </div>
                      )}
                      <div>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{store.storeName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isStoreOpen() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isStoreOpen() ? '● Open Now' : '● Closed'}
                          </span>
                          {store.metrics?.rating > 0 && (
                            <span className="flex items-center text-xs text-yellow-500">
                              <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />
                              {store.metrics.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== NETWORK QUICK LINKS - MOBILE ===== */}
                <div className="mb-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Buy Data Bundles
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {NETWORKS.map((network) => {
                      const NetworkIcon = network.icon;
                      return (
                        <button
                          key={network.key}
                          onClick={() => navigateToNetwork(network.key)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2 ${
                            isDarkMode 
                              ? `bg-gray-800 border-gray-700 hover:border-${network.key === 'YELLO' ? 'yellow' : network.key === 'TELECEL' ? 'red' : 'purple'}-500` 
                              : `bg-white border-gray-200 hover:border-${network.key === 'YELLO' ? 'yellow' : network.key === 'TELECEL' ? 'red' : 'purple'}-500`
                          } active:scale-95`}
                        >
                          <div className={`p-2 rounded-xl bg-gradient-to-br ${network.color}`}>
                            <NetworkIcon size={28} />
                          </div>
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {network.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="mb-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                            isActive 
                              ? 'bg-yellow-500 text-black' 
                              : isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-800 active:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="mb-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 px-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    Contact Store
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {store.contactInfo?.whatsappNumber && (
                      <a 
                        href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-xl font-medium active:scale-95 transition-transform"
                      >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp
                      </a>
                    )}
                    {store.contactInfo?.phoneNumber && (
                      <a 
                        href={`tel:${store.contactInfo.phoneNumber}`}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium active:scale-95 transition-transform ${
                          isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <Phone className="w-5 h-5" />
                        Call
                      </a>
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Fast Delivery</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Data delivered in 10min - 1hr</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ===== MOBILE BOTTOM NETWORK BAR ===== */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${
        isDarkMode ? 'bg-gray-900/95 backdrop-blur-lg border-t border-gray-800' : 'bg-white/95 backdrop-blur-lg border-t border-gray-200'
      }`}>
        <div className="px-2 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {/* Home */}
            <Link
              href={`/shop/${params.storeSlug}`}
              className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${
                pathname === `/shop/${params.storeSlug}` && !pathname.includes('/products')
                  ? 'text-yellow-500' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </Link>

            {/* Network Buttons */}
            {NETWORKS.map((network) => {
              const NetworkIcon = network.icon;
              const isActive = pathname.includes(`network=${network.key}`);
              return (
                <button
                  key={network.key}
                  onClick={() => navigateToNetwork(network.key)}
                  className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] transition-all ${
                    isActive 
                      ? network.textColor 
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  <NetworkIcon size={22} />
                  <span className="text-[10px] mt-1 font-medium">{network.name}</span>
                </button>
              );
            })}

            {/* Track */}
            <Link
              href={`/shop/${params.storeSlug}/orders/search`}
              className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${
                pathname.includes('/orders/search')
                  ? 'text-yellow-500' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <Search className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Track</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={`${isDarkMode ? 'bg-black' : 'bg-gray-900'} text-white mt-8 lg:mt-16 pb-20 lg:pb-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Store Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {store.storeLogo ? (
                  <img src={store.storeLogo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Store className="w-5 h-5 text-black" />
                  </div>
                )}
                <h3 className="text-lg font-bold">{store.storeName}</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{store.storeDescription}</p>
              {store.marketing?.referralCode && (
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Referral Code</p>
                  <p className="font-mono font-bold text-yellow-500">{store.marketing.referralCode}</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Networks */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Data Bundles</h3>
              <ul className="space-y-2">
                {NETWORKS.map((network) => (
                  <li key={network.key}>
                    <button 
                      onClick={() => navigateToNetwork(network.key)}
                      className={`text-sm ${network.textColor} hover:underline`}
                    >
                      {network.name} Bundles
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                {store.contactInfo?.phoneNumber && (
                  <a href={`tel:${store.contactInfo.phoneNumber}`} className="flex items-center text-gray-400 hover:text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    {store.contactInfo.phoneNumber}
                  </a>
                )}
                {store.contactInfo?.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                    className="flex items-center text-gray-400 hover:text-green-400"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                )}
                {store.contactInfo?.email && (
                  <a href={`mailto:${store.contactInfo.email}`} className="flex items-center text-gray-400 hover:text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{store.contactInfo.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx global>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 8px);
        }
      `}</style>
    </div>
  );
}