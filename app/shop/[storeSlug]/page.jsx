'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Clock, CheckCircle, ChevronRight, Star, Truck } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Network Logos
const MTNLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#FFCC00"/>
    <path d="M12 18 L18 30 L24 18 L30 30 L36 18" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TelecelLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#DC2626"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="18" fill="#fff">T</text>
  </svg>
);

const ATLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill="#7C3AED"/>
    <text x="24" y="30" textAnchor="middle" fontFamily="system-ui" fontWeight="bold" fontSize="14" fill="#fff">AT</text>
  </svg>
);

// Theme color presets
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

// Get theme colors from store or use default
const getThemeColors = (store) => {
  // Check for custom theme in store settings
  const themeName = store?.theme?.name || store?.settings?.theme || 'dark';
  const customPrimary = store?.theme?.primaryColor || store?.settings?.primaryColor;
  const customSecondary = store?.theme?.secondaryColor || store?.settings?.secondaryColor;
  const customAccent = store?.theme?.accentColor || store?.settings?.accentColor;

  // If custom colors are set, use them
  if (customPrimary) {
    return {
      primary: customPrimary,
      secondary: customSecondary || customPrimary,
      accent: customAccent || '#FACC15',
      text: isLightColor(customPrimary) ? '#000000' : '#FFFFFF'
    };
  }

  // Otherwise use preset theme
  return themePresets[themeName] || themePresets.dark;
};

// Check if a color is light (for text contrast)
const isLightColor = (color) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

export default function StorePage() {
  const params = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.storeSlug]);

  const fetchData = async () => {
    try {
      const [storeRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`),
        fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/products`)
      ]);

      const storeData = await storeRes.json();
      const productsData = await productsRes.json();

      if (storeData.status === 'success') setStore(storeData.data);
      if (productsData.status === 'success') setProducts(productsData.data?.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get theme colors
  const theme = getThemeColors(store);

  // Count products by network
  const mtnCount = products.filter(p => p.network === 'YELLO').length;
  const telecelCount = products.filter(p => p.network === 'TELECEL').length;
  const atCount = products.filter(p => p.network === 'AT_PREMIUM').length;

  // Get popular products (cheapest from each network + sale items)
  const getPopularProducts = () => {
    const popular = [];
    
    // Get cheapest MTN
    const mtn = products.filter(p => p.network === 'YELLO').sort((a, b) => a.sellingPrice - b.sellingPrice)[0];
    if (mtn) popular.push(mtn);
    
    // Get cheapest Telecel
    const telecel = products.filter(p => p.network === 'TELECEL').sort((a, b) => a.sellingPrice - b.sellingPrice)[0];
    if (telecel) popular.push(telecel);
    
    // Get cheapest AT
    const at = products.filter(p => p.network === 'AT_PREMIUM').sort((a, b) => a.sellingPrice - b.sellingPrice)[0];
    if (at) popular.push(at);
    
    // Add sale items
    const saleItems = products.filter(p => p.isOnSale && !popular.includes(p)).slice(0, 3);
    popular.push(...saleItems);
    
    return popular.slice(0, 6);
  };

  const getNetworkStyle = (network) => {
    if (network === 'YELLO') return { 
      bg: 'bg-yellow-400', 
      hover: 'hover:bg-yellow-300',
      text: 'text-black', 
      name: 'MTN',
      logo: <MTNLogo size={32} />
    };
    if (network === 'TELECEL') return { 
      bg: 'bg-red-600', 
      hover: 'hover:bg-red-500',
      text: 'text-white', 
      name: 'Telecel',
      logo: <TelecelLogo size={32} />
    };
    if (network === 'AT_PREMIUM') return { 
      bg: 'bg-purple-600', 
      hover: 'hover:bg-purple-500',
      text: 'text-white', 
      name: 'AirtelTigo',
      logo: <ATLogo size={32} />
    };
    return { bg: 'bg-gray-600', hover: 'hover:bg-gray-500', text: 'text-white', name: network, logo: null };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const popularProducts = getPopularProducts();

  return (
    <div className="space-y-10">
      
      {/* Hero Section - Uses Store Theme Colors */}
      <section 
        className="relative rounded-3xl overflow-hidden animate-fadeIn"
        style={{ backgroundColor: theme.primary }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
          }}
        ></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>
        </div>
        
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <div className="max-w-xl">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4 animate-pulse-slow bg-yellow-400 text-black"
            >
              <Zap className="w-3 h-3" />
              Instant Delivery
            </span>
            
            <h1
              className="text-3xl md:text-4xl font-bold mb-4 leading-tight animate-slideUp"
              style={{ color: theme.text }}
            >
              Buy Data Bundles<br />
              <span className="text-yellow-400">At Unbeatable Prices</span>
            </h1>
            
            <p 
              className="text-lg mb-8 animate-slideUp opacity-80" 
              style={{ color: theme.text, animationDelay: '100ms' }}
            >
              MTN, Telecel & AirtelTigo bundles delivered to your phone within minutes. Safe, fast, and reliable.
            </p>
            
            <div className="flex flex-wrap gap-3 animate-slideUp" style={{ animationDelay: '200ms' }}>
              <Link
                href={`/shop/${params.storeSlug}/products`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href={`/shop/${params.storeSlug}/orders/search`}
                className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all duration-300"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: theme.text
                }}
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: '10-60 Min Delivery', color: 'text-yellow-500' },
          { icon: Shield, label: '100% Secure', color: 'text-green-500' },
          { icon: Clock, label: '24/7 Available', color: 'text-blue-500' },
          { icon: Truck, label: 'All Networks', color: 'text-purple-500' },
        ].map((feature, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
            <feature.icon className={`w-6 h-6 ${feature.color} mx-auto mb-2`} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.label}</p>
          </div>
        ))}
      </section>

      {/* Networks Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose Your Network</h2>
          <Link
            href={`/shop/${params.storeSlug}/products`}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MTN */}
          {mtnCount > 0 && (
            <Link 
              href={`/shop/${params.storeSlug}/products?network=YELLO`}
              className="group bg-yellow-400 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <MTNLogo size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black">MTN</h3>
                  <p className="text-sm text-black/60">{mtnCount} bundles</p>
                </div>
              </div>
              <div className="flex items-center text-black font-medium text-sm">
                View Bundles
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Link>
          )}
          
          {/* Telecel */}
          {telecelCount > 0 && (
            <Link 
              href={`/shop/${params.storeSlug}/products?network=TELECEL`}
              className="group bg-red-600 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <TelecelLogo size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Telecel</h3>
                  <p className="text-sm text-white/60">{telecelCount} bundles</p>
                </div>
              </div>
              <div className="flex items-center text-white font-medium text-sm">
                View Bundles
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Link>
          )}
          
          {/* AirtelTigo */}
          {atCount > 0 && (
            <Link 
              href={`/shop/${params.storeSlug}/products?network=AT_PREMIUM`}
              className="group bg-purple-600 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <ATLogo size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AirtelTigo</h3>
                  <p className="text-sm text-white/60">{atCount} bundles</p>
                </div>
              </div>
              <div className="flex items-center text-white font-medium text-sm">
                View Bundles
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Popular Bundles</h2>
            <Link
              href={`/shop/${params.storeSlug}/products`}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              See All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularProducts.map((product) => {
              const style = getNetworkStyle(product.network);
              const price = product.isOnSale && product.salePrice ? product.salePrice : product.sellingPrice;
              
              return (
                <Link 
                  key={product._id}
                  href={`/shop/${params.storeSlug}/products?network=${product.network}`}
                  className="group"
                >
                  <div className={`${style.bg} ${style.hover} ${style.text} rounded-2xl p-4 transition-all group-hover:shadow-lg group-hover:-translate-y-1 relative`}>
                    {product.isOnSale && (
                      <span className="absolute top-2 right-2 bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">
                        SALE
                      </span>
                    )}
                    <div className="mb-2">{style.logo}</div>
                    <h3 className="text-2xl font-bold">{product.capacity}GB</h3>
                    <p className="text-xs opacity-70 mb-2">{style.name}</p>
                    <p className="text-lg font-bold">₵{price.toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-8">Why Buy From Us?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Guaranteed Delivery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your data is always delivered. If there's any issue, we'll fix it or refund you.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Super Fast</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Most orders are delivered within 10-30 minutes. No long waits.
            </p>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Safe & Secure</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Secure payment processing. Your data and money are always protected.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Uses Store Theme Colors */}
      <section 
        className="rounded-3xl p-8 text-center hover:shadow-2xl transition-shadow duration-500"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
        }}
      >
        <h2 className="text-2xl font-bold mb-3" style={{ color: theme.text }}>Ready to Get Started?</h2>
        <p className="mb-6 opacity-70" style={{ color: theme.text }}>Choose your network and buy data in seconds.</p>
        <Link
          href={`/shop/${params.storeSlug}/products`}
          className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          Buy Data Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slideUp {
          opacity: 0;
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
