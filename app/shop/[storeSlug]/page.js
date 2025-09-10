// app/shop/[storeSlug]/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag, Star, TrendingUp, Clock, Shield, Award,
  ChevronRight, Package, Zap, Users, Heart, ArrowRight,
  Wifi, Smartphone, Globe, CheckCircle, MessageCircle,
  Moon, Sun, AlertTriangle, Phone, Mail, MapPin,
  Facebook, Instagram, Twitter, Send, DollarSign,
  Sparkles, Gift, Crown, Rocket, Timer, CreditCard
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Network Logo Components (same as before)
const MTNLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ customers: 0, orders: 0, rating: 0 });
  const [customColors, setCustomColors] = useState({
    primary: '#1976d2',
    secondary: '#dc004e'
  });

  useEffect(() => {
    // Store the storeSlug in localStorage whenever params.storeSlug is available
    if (params.storeSlug && typeof window !== 'undefined') {
      try {
        localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
        console.log('Stored storeSlug in localStorage:', params.storeSlug);
      } catch (error) {
        console.error('Error storing storeSlug in localStorage:', error);
      }
    }
  }, [params.storeSlug]);

  useEffect(() => {
    // Check for dark mode preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const storedTheme = localStorage.getItem('theme');
      const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
      setIsDarkMode(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [params.storeSlug]);

  // Animate stats on load
  useEffect(() => {
    if (store?.metrics) {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setAnimatedStats({
          customers: Math.floor((store.metrics.totalCustomers || 100) * progress),
          orders: Math.floor((store.metrics.totalOrders || 50) * progress),
          rating: ((store.metrics.rating || 4.5) * progress).toFixed(1)
        });
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [store]);

  const fetchStoreData = async () => {
    try {
      // Get storeSlug from params or localStorage as fallback
      const storeSlug = params.storeSlug || localStorage.getItem('lastVisitedStoreSlug');
      
      if (!storeSlug) {
        console.error('No store slug available');
        setLoading(false);
        return;
      }

      const storeResponse = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`);
      const storeData = await storeResponse.json();
      
      if (storeData.status === 'success') {
        setStore(storeData.data);
        
        // Set custom colors
        if (storeData.data.customization) {
          setCustomColors({
            primary: storeData.data.customization.primaryColor || '#1976d2',
            secondary: storeData.data.customization.secondaryColor || '#dc004e'
          });
          
          // Apply colors to CSS variables
          document.documentElement.style.setProperty('--primary-color', storeData.data.customization.primaryColor || '#1976d2');
          document.documentElement.style.setProperty('--secondary-color', storeData.data.customization.secondaryColor || '#dc004e');
        }
        
        const productsResponse = await fetch(`${API_BASE}/agent-stores/stores/${storeSlug}/products`);
        const productsData = await productsResponse.json();
        
        if (productsData.status === 'success') {
          setProducts(productsData.data?.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get storeSlug from localStorage (can be used elsewhere in your app)
  const getStoredStoreSlug = () => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('lastVisitedStoreSlug');
      } catch (error) {
        console.error('Error getting storeSlug from localStorage:', error);
        return null;
      }
    }
    return null;
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

  const formatCurrency = (amount) => {
    return `GH₵ ${(amount || 0).toFixed(2)}`;
  };

  const isStoreOpen = () => {
    if (!store || !store.isOpen) return false;
    
    if (!store.autoCloseOutsideHours) return true;
    
    const now = new Date();
    const dayName = now.toLocaleLowerCase('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = store.businessHours?.[dayName];
    if (!todayHours || !todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

  // Helper function to lighten/darken colors
  const adjustColor = (color, amount) => {
    const clamp = (num) => Math.min(255, Math.max(0, num));
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };

  const featuredProducts = products.filter(p => p.featured || p.isOnSale).slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
               style={{ borderColor: customColors.primary }}></div>
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-b from-blue-50 via-white to-purple-50'} min-h-screen transition-all duration-300`}>
      {/* Animated Background Shapes with custom colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 animate-blob"
             style={{ backgroundColor: customColors.primary }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 animate-blob animation-delay-2000"
             style={{ backgroundColor: customColors.secondary }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-30 animate-blob animation-delay-4000"
             style={{ backgroundColor: adjustColor(customColors.primary, 40) }}></div>
      </div>

      <div className="relative z-10 space-y-8 md:space-y-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        {/* Dark Mode Toggle - Fixed Position */}
        <button 
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? 
            <Sun className="w-5 h-5 text-yellow-500" /> : 
            <Moon className="w-5 h-5 text-gray-700" />
          }
        </button>

        {/* Hero Section with custom colors */}
        <section 
          className="relative rounded-3xl overflow-hidden text-white shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
          }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="relative z-10 px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                {/* Store Logo and Name */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-6">
                  {store?.storeLogo && (
                    <img 
                      src={store.storeLogo} 
                      alt={store.storeName} 
                      className="h-20 w-20 rounded-2xl border-4 border-white/30 shadow-xl animate-float"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 animate-slide-in">
                      {store?.storeName}
                    </h1>
                    {store?.verification?.isVerified && (
                      <div className="inline-flex items-center bg-green-500/20 backdrop-blur px-3 py-1 rounded-full">
                        <Shield className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Verified Store</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-white/90 animate-fade-in">
                  {store?.storeDescription || 'Your trusted source for affordable data bundles'}
                </p>
                
                {/* Store Status and Rating */}
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-8">
                  <span className={`px-4 py-2 rounded-full font-bold text-sm sm:text-base animate-pulse ${
                    isStoreOpen() 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                      : 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  }`}>
                    {isStoreOpen() ? '🟢 Store Open' : '🔴 Store Closed'}
                  </span>
                  
                  {store?.metrics?.rating > 0 && (
                    <div className="flex items-center bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                      <Star className="w-5 h-5 text-yellow-400 mr-1 fill-current" />
                      <span className="font-bold">{animatedStats.rating}</span>
                      <span className="ml-1 text-white/80 text-sm">({store.metrics.totalReviews} reviews)</span>
                    </div>
                  )}
                </div>
                
                {/* CTA Buttons with custom colors */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link 
                    href={`/shop/${params.storeSlug}/products`}
                    className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    style={{ color: customColors.primary }}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Shop Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  {store?.whatsappSettings?.communityLink && (
                    <a 
                      href={store.whatsappSettings.communityLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                      Join Community
                    </a>
                  )}
                </div>
              </div>
              
              {/* Hero Image/Graphic */}
              <div className="flex-1 flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse"
                       style={{ background: `linear-gradient(to right, ${customColors.primary}, ${customColors.secondary})` }}></div>
                  <div className="relative grid grid-cols-2 gap-4 p-4">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 transform hover:scale-105 transition-transform">
                      <Zap className="w-8 h-8 mb-2 text-yellow-300" />
                      <p className="font-bold text-2xl">{animatedStats.orders}+</p>
                      <p className="text-sm opacity-90">Orders Delivered</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 transform hover:scale-105 transition-transform">
                      <Users className="w-8 h-8 mb-2 text-green-300" />
                      <p className="font-bold text-2xl">{animatedStats.customers}+</p>
                      <p className="text-sm opacity-90">Happy Customers</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 transform hover:scale-105 transition-transform">
                      <Timer className="w-8 h-8 mb-2 text-blue-300" />
                      <p className="font-bold text-2xl">10-60</p>
                      <p className="text-sm opacity-90">Min Delivery</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 transform hover:scale-105 transition-transform">
                      <Shield className="w-8 h-8 mb-2 text-purple-300" />
                      <p className="font-bold text-2xl">100%</p>
                      <p className="text-sm opacity-90">Secure</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop by Network - Enhanced Cards */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Choose Your Network</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Select your preferred network for the best deals</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { network: 'YELLO', name: 'MTN', logo: <MTNLogo />, color: 'from-yellow-400 to-yellow-600' },
              { network: 'TELECEL', name: 'Telecel', logo: <TelecelLogo />, color: 'from-red-400 to-red-600' },
              { network: 'AT_PREMIUM', name: 'AirtelTigo', logo: <AirtelTigoLogo />, color: 'from-purple-400 to-purple-600' },
              { network: 'at', name: 'AirtelTigo', logo: <AirtelTigoLogo />, color: 'from-blue-400 to-blue-600' }
            ].map(({ network, name, logo, color }) => {
              const networkProducts = products.filter(p => p.network === network);
              
              if (networkProducts.length === 0) return null;
              
              return (
                <Link
                  key={network}
                  href={`/shop/${params.storeSlug}/products?network=${network}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className={`bg-gradient-to-br ${color} p-6 sm:p-8 h-40 sm:h-48 flex flex-col justify-between`}>
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity">
                      <Wifi className="w-20 h-20 text-white" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="mb-3">{logo}</div>
                      <h3 className="text-white font-bold text-xl sm:text-2xl mb-1">{name}</h3>
                      <p className="text-white/90 text-sm">
                        {networkProducts.length} bundles
                      </p>
                    </div>
                    
                    <div className="flex items-center text-white font-medium">
                      <span className="text-sm">Shop Now</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Products - Enhanced with custom colors */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  <Sparkles className="inline w-8 h-8 mr-2 text-yellow-500" />
                  Hot Deals
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Limited time offers you can't miss!</p>
              </div>
              <Link 
                href={`/shop/${params.storeSlug}/products`}
                className="inline-flex items-center px-6 py-3 text-white font-bold rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
                }}
              >
                View All
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  storeSlug={params.storeSlug} 
                  isDarkMode={isDarkMode}
                  customColors={customColors}
                />
              ))}
            </div>
          </section>
        )}

        {/* Final CTA with custom colors */}
        <section className="text-center py-12 px-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Save on Data? 🚀
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join {animatedStats.customers}+ happy customers enjoying affordable bundles
          </p>
          <Link
            href={`/shop/${params.storeSlug}/products`}
            className="inline-flex items-center justify-center px-10 py-5 text-white font-bold text-lg rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
            }}
          >
            <Rocket className="w-6 h-6 mr-3 animate-bounce" />
            Start Shopping Now
            <ArrowRight className="w-6 h-6 ml-3" />
          </Link>
        </section>
      </div>

      {/* Add CSS for animations and custom properties */}
      <style jsx>{`
        :root {
          --primary-color: ${customColors.primary};
          --secondary-color: ${customColors.secondary};
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0% {
            transform: translatey(0px);
          }
          50% {
            transform: translatey(-20px);
          }
          100% {
            transform: translatey(0px);
          }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}

// Enhanced Product Card Component with custom colors
function ProductCard({ product, storeSlug, isDarkMode, customColors }) {
  const router = useRouter();
  
  const formatCurrency = (amount) => {
    return `GH₵ ${(amount || 0).toFixed(2)}`;
  };
  
  const getNetworkColor = (network) => {
    switch(network) {
      case 'YELLO': return 'from-yellow-400 to-yellow-600';
      case 'TELECEL': return 'from-red-400 to-red-600';
      case 'AT_PREMIUM': return 'from-purple-400 to-purple-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };
  
  return (
    <div 
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 overflow-hidden"
      onClick={() => router.push(`/shop/${storeSlug}/products`)}
    >
      {/* Sale Badge */}
      {product.isOnSale && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            SALE
          </span>
        </div>
      )}
      
      {/* Featured Star */}
      {product.featured && (
        <div className="absolute top-3 right-3 z-10">
          <Star className="w-6 h-6 text-yellow-500 fill-current drop-shadow-lg" />
        </div>
      )}
      
      {/* Network Banner */}
      <div className={`h-2 bg-gradient-to-r ${getNetworkColor(product.network)}`}></div>
      
      <div className="p-6">
        {/* Network & Capacity */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 bg-gradient-to-r ${getNetworkColor(product.network)} text-white text-xs font-bold rounded-full mb-3`}>
            {product.network === 'YELLO' ? 'MTN' : product.network === 'AT_PREMIUM' ? 'AirtelTigo' : product.network}
          </span>
          
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {product.capacity}GB
          </h3>
          
          {product.displayName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{product.displayName}</p>
          )}
        </div>
        
        {/* Price */}
        <div className="mb-4">
          {product.isOnSale && product.salePrice ? (
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(product.salePrice)}
              </span>
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatCurrency(product.sellingPrice)}
              </span>
              <div className="mt-1">
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  Save {formatCurrency(product.sellingPrice - product.salePrice)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.sellingPrice)}
            </span>
          )}
        </div>
        
        {/* Features */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>30 days</span>
          </div>
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            <span>10-60min</span>
          </div>
        </div>
        
        {/* Action Button with custom color */}
        <button 
          className="w-full py-3 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
          }}
        >
          Buy Now
        </button>
        
        {/* Out of Stock Overlay */}
        {product.inStock === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">Out of Stock</span>
          </div>
        )}
      </div>
    </div>
  );
}