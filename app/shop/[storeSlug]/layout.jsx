// app/shop/[storeSlug]/page.jsx - Store Home Page
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Package, Zap, Shield, Clock, ChevronRight, Star,
  Phone, MessageCircle, TrendingUp, Users, Award,
  ArrowRight, Sparkles, Gift, Moon, Sun
} from 'lucide-react';

// Lottie for loading
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

const API_BASE = '/api/proxy/v1';

// Network Logos
const MTNLogo = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
  </svg>
);

const AirtelTigoLogo = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="85" fill="#fff" stroke="#7c3aed" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28" fill="#7c3aed">AT</text>
    <text x="100" y="140" textAnchor="middle" fontFamily="Arial" fontSize="18" fill="#7c3aed">PREMIUM</text>
  </svg>
);

export default function StoreHomePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    fetchStoreData();
    
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      setIsDarkMode(storedTheme !== 'light');
    }
  }, [params.storeSlug]);

  const fetchStoreData = async () => {
    try {
      // Fetch store info
      const storeRes = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const storeData = await storeRes.json();
      
      if (storeData.status === 'success') {
        setStore(storeData.data);
      }

      // Fetch products for featured section
      const productsRes = await fetch(`${API_BASE}/agent-stores/stores/${params.storeSlug}/products`);
      const productsData = await productsRes.json();
      
      if (productsData.status === 'success') {
        // Get featured products (first 6, prioritizing in-stock and different networks)
        const products = productsData.data?.products || [];
        const featured = products
          .filter(p => p.inStock)
          .sort((a, b) => a.sellingPrice - b.sellingPrice)
          .slice(0, 6);
        setFeaturedProducts(featured);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const getNetworkLogo = (network, size = 50) => {
    if (network === 'YELLO') return <MTNLogo size={size} />;
    if (network === 'TELECEL') return <TelecelLogo size={size} />;
    if (network === 'AT_PREMIUM') return <AirtelTigoLogo size={size} />;
    return <Package className="w-12 h-12" />;
  };

  const getCardColors = (network) => {
    if (network === 'YELLO') return {
      card: 'bg-gradient-to-br from-yellow-400 to-yellow-500',
      text: 'text-black',
      subtext: 'text-black/70'
    };
    if (network === 'TELECEL') return {
      card: 'bg-gradient-to-br from-red-600 to-red-700',
      text: 'text-white',
      subtext: 'text-white/70'
    };
    if (network === 'AT_PREMIUM') return {
      card: 'bg-gradient-to-br from-purple-600 to-purple-700',
      text: 'text-white',
      subtext: 'text-white/70'
    };
    return {
      card: 'bg-gradient-to-br from-blue-600 to-blue-700',
      text: 'text-white',
      subtext: 'text-white/70'
    };
  };

  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    if (network === 'AT_PREMIUM') return 'AT Premium';
    return network;
  };

  // Get unique networks from featured products
  const availableNetworks = [...new Set(featuredProducts.map(p => p.network))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="text-gray-400 text-sm mt-2">Loading store...</p>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
      {/* Hero Section */}
      <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              Fast & Reliable Data
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Get Affordable Data Bundles
          </h1>
          
          <p className={`text-sm sm:text-base mb-6 max-w-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Purchase data bundles for MTN, Telecel & AirtelTigo at the best prices. 
            Instant delivery, secure payments.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <Zap className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Delivery</p>
                <p className="font-semibold text-sm">10min - 1hr</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment</p>
                <p className="font-semibold text-sm">100% Secure</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Validity</p>
                <p className="font-semibold text-sm">Up to 90 Days</p>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <Link
            href={`/shop/${params.storeSlug}/products`}
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/30 active:scale-95"
          >
            Browse All Bundles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Network Quick Links */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-4">Shop by Network</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { network: 'YELLO', name: 'MTN', color: 'from-yellow-400 to-yellow-500', textColor: 'text-black' },
            { network: 'TELECEL', name: 'Telecel', color: 'from-red-600 to-red-700', textColor: 'text-white' },
            { network: 'AT_PREMIUM', name: 'AirtelTigo', color: 'from-purple-600 to-purple-700', textColor: 'text-white' }
          ].map((item) => (
            <Link
              key={item.network}
              href={`/shop/${params.storeSlug}/products?network=${item.network}`}
              className={`bg-gradient-to-br ${item.color} ${item.textColor} rounded-xl p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95`}
            >
              <div className="flex justify-center mb-2">
                {getNetworkLogo(item.network, 40)}
              </div>
              <p className="font-bold text-sm">{item.name}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Featured Bundles</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Best value data packages</p>
          </div>
          <Link
            href={`/shop/${params.storeSlug}/products`}
            className={`flex items-center gap-1 text-sm font-medium ${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products Grid - 1 per row on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProducts.map((product) => {
            const colors = getCardColors(product.network);
            
            return (
              <Link
                key={product._id}
                href={`/shop/${params.storeSlug}/products?network=${product.network}`}
                className={`${colors.card} ${colors.text} rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all`}
              >
                {/* Card Content - Horizontal layout */}
                <div className="flex items-center p-4">
                  <div className="w-12 h-12 flex-shrink-0">
                    {getNetworkLogo(product.network, 48)}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-2xl font-bold">{product.capacity}GB</h3>
                    <p className={`text-xs ${colors.subtext}`}>
                      {getNetworkName(product.network)} Bundle
                    </p>
                  </div>
                  <div className="text-right">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <p className="text-xl font-bold">₵{product.salePrice.toFixed(2)}</p>
                        <p className="text-xs line-through opacity-70">₵{product.sellingPrice.toFixed(2)}</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold">₵{product.sellingPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className={`px-4 py-2 ${product.network === 'YELLO' ? 'bg-black/20' : 'bg-black/30'} flex items-center justify-between`}>
                  <span className="text-xs opacity-80">90 Days Validity</span>
                  <span className="text-xs font-medium flex items-center gap-1">
                    Buy Now <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* See All Products Button */}
        <div className="mt-6 text-center">
          <Link
            href={`/shop/${params.storeSlug}/products`}
            className={`inline-flex items-center gap-2 py-3 px-8 rounded-xl font-bold transition-all active:scale-95 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' 
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
            }`}
          >
            <Package className="w-5 h-5" />
            See All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mb-6`}>
        <h2 className="text-lg font-bold mb-4 text-center">Why Choose Us?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Zap, title: 'Fast Delivery', desc: '10min - 1 hour', color: 'text-yellow-500' },
            { icon: Shield, title: 'Secure', desc: '100% Safe', color: 'text-green-500' },
            { icon: Award, title: 'Best Prices', desc: 'Guaranteed', color: 'text-blue-500' },
            { icon: Users, title: 'Support', desc: '24/7 Help', color: 'text-purple-500' }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mb-6`}>
        <h2 className="text-lg font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Select Bundle', desc: 'Choose your preferred network and data size' },
            { step: '2', title: 'Enter Number', desc: 'Provide the phone number to receive data' },
            { step: '3', title: 'Pay Securely', desc: 'Complete payment via Mobile Money' },
            { step: '4', title: 'Receive Data', desc: 'Data is delivered within 10min - 1 hour' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-black">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Need Help?</h2>
            <p className="text-sm text-black/70">Contact us for any questions or support</p>
          </div>
          <div className="flex gap-3">
            <a
              href={`tel:${store?.contactInfo?.phoneNumber || ''}`}
              className="flex items-center gap-2 bg-black text-yellow-400 py-2 px-4 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
            <a
              href={`https://wa.me/${store?.contactInfo?.whatsappNumber?.replace(/\D/g, '') || ''}`}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}