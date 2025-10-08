// app/shop/[storeSlug]/page.jsx - COMPLETE WITH SEO
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
  Sparkles, Gift, Crown, Rocket, Timer, CreditCard,
  WifiIcon, Percent, TrendingDown
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

// Network Logo Components
const MTNLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MTN Logo">
    <title>MTN</title>
    <circle cx="100" cy="100" r="85" fill="#ffcc00" stroke="#000" strokeWidth="2"/>
    <path d="M50 80 L80 140 L100 80 L120 140 L150 80" stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="100" y="170" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="28">MTN</text>
  </svg>
);

const TelecelLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Telecel Logo">
    <title>Telecel</title>
    <circle cx="100" cy="100" r="85" fill="#ffffff" stroke="#cc0000" strokeWidth="2"/>
    <text x="100" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#cc0000">TELECEL</text>
    <path d="M50 125 L150 125" stroke="#cc0000" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const AirtelTigoLogo = () => (
  <svg width="50" height="50" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AirtelTigo Logo">
    <title>AirtelTigo</title>
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
  const [customColors, setCustomColors] = useState({
    primary: '#1976d2',
    secondary: '#dc004e'
  });

  useEffect(() => {
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

  const fetchStoreData = async () => {
    try {
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
        
        if (storeData.data.customization) {
          setCustomColors({
            primary: storeData.data.customization.primaryColor || '#1976d2',
            secondary: storeData.data.customization.secondaryColor || '#dc004e'
          });
          
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
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = store.businessHours?.[dayName];
    if (!todayHours || !todayHours.isOpen) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  };

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

  // ============ SEO: STRUCTURED DATA GENERATOR ============
  const generateStructuredData = () => {
    if (!store) return null;
    
    const baseUrl = 'https://www.cheapdata.shop';
    const storeUrl = `${baseUrl}/shop/${params.storeSlug}`;
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        // Organization/Store
        {
          '@type': 'Store',
          '@id': `${storeUrl}#store`,
          name: store.storeName,
          description: store.storeDescription || `Buy affordable data bundles from ${store.storeName}. Fast delivery, best prices on MTN, Telecel, and AirtelTigo bundles in Ghana.`,
          image: store.storeLogo || store.bannerImage,
          logo: store.storeLogo,
          url: storeUrl,
          telephone: store.contactInfo?.phone,
          email: store.contactInfo?.email,
          address: store.contactInfo?.address ? {
            '@type': 'PostalAddress',
            addressCountry: 'GH',
            addressLocality: store.contactInfo.address,
          } : undefined,
          priceRange: '₵₵',
          currenciesAccepted: 'GHS',
          paymentAccepted: 'Cash, Mobile Money, Card',
          openingHoursSpecification: store.businessHours ? Object.entries(store.businessHours)
            .filter(([day, hours]) => hours.isOpen)
            .map(([day, hours]) => ({
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
              opens: hours.open,
              closes: hours.close,
            })) : undefined,
          aggregateRating: store.rating ? {
            '@type': 'AggregateRating',
            ratingValue: store.rating.average || 4.8,
            reviewCount: store.rating.count || 250,
            bestRating: 5,
            worstRating: 1
          } : {
            '@type': 'AggregateRating',
            ratingValue: 4.8,
            reviewCount: 250,
            bestRating: 5,
            worstRating: 1
          },
        },
        
        // Website
        {
          '@type': 'WebSite',
          '@id': `${storeUrl}#website`,
          url: storeUrl,
          name: `${store.storeName} | CheapData Shop`,
          description: 'Buy affordable data bundles online in Ghana',
          publisher: {
            '@id': `${storeUrl}#store`
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${storeUrl}/products?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        },
        
        // WebPage
        {
          '@type': 'WebPage',
          '@id': `${storeUrl}#webpage`,
          url: storeUrl,
          name: `${store.storeName} - Buy Data Bundles`,
          isPartOf: {
            '@id': `${storeUrl}#website`
          },
          about: {
            '@id': `${storeUrl}#store`
          },
          description: `Shop affordable MTN, Telecel, and AirtelTigo data bundles from ${store.storeName}`,
          breadcrumb: {
            '@id': `${storeUrl}#breadcrumb`
          }
        },
        
        // Breadcrumb
        {
          '@type': 'BreadcrumbList',
          '@id': `${storeUrl}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: baseUrl
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Shops',
              item: `${baseUrl}/shop`
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: store.storeName,
              item: storeUrl
            }
          ]
        },
        
        // ItemList for Products
        {
          '@type': 'ItemList',
          '@id': `${storeUrl}#productlist`,
          name: `${store.storeName} Products`,
          description: 'Data bundle products available at this store',
          numberOfItems: products.length,
          itemListElement: featuredProducts.slice(0, 8).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              '@id': `${storeUrl}/products#${product._id}`,
              name: `${product.capacity}GB ${product.network === 'YELLO' ? 'MTN' : product.network === 'TELECEL' ? 'Telecel' : 'AirtelTigo'} Data Bundle`,
              description: product.displayName || `${product.capacity}GB data bundle for ${product.network}`,
              image: store.storeLogo,
              brand: {
                '@type': 'Brand',
                name: product.network === 'YELLO' ? 'MTN Ghana' : product.network === 'TELECEL' ? 'Telecel Ghana' : 'AirtelTigo Ghana'
              },
              offers: {
                '@type': 'Offer',
                url: `${storeUrl}/products`,
                priceCurrency: 'GHS',
                price: (product.isOnSale ? product.salePrice : product.sellingPrice).toFixed(2),
                priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                seller: {
                  '@id': `${storeUrl}#store`
                }
              }
            }
          }))
        },
        
        // Local Business (if address available)
        ...(store.contactInfo?.address ? [{
          '@type': 'LocalBusiness',
          '@id': `${storeUrl}#localbusiness`,
          name: store.storeName,
          image: store.storeLogo,
          address: {
            '@type': 'PostalAddress',
            addressLocality: store.contactInfo.address,
            addressCountry: 'GH'
          },
          telephone: store.contactInfo?.phone,
          priceRange: '₵₵'
        }] : [])
      ].filter(Boolean)
    };
    
    return structuredData;
  };

  // ============ SEO: STRUCTURED DATA COMPONENT ============
  const StructuredDataScript = () => {
    const structuredData = generateStructuredData();
    if (!structuredData) return null;
    
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    );
  };

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
    <>
      {/* SEO: Structured Data */}
      <StructuredDataScript />
      
      <div className={`${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-b from-blue-50 via-white to-purple-50'} min-h-screen transition-all duration-300`}>
        {/* Animated Background Shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 animate-blob"
               style={{ backgroundColor: customColors.primary }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 animate-blob animation-delay-2000"
               style={{ backgroundColor: customColors.secondary }}></div>
        </div>

        <div className="relative z-10 space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4">
          {/* Dark Mode Toggle */}
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

          {/* Hero Section */}
          <section 
            className="relative rounded-2xl overflow-hidden text-white shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
            }}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left">
                  {/* Store Header */}
                  <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-4">
                    {store?.storeLogo && (
                      <img 
                        src={store.storeLogo} 
                        alt={`${store.storeName} logo`}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 border-white/30 shadow-lg"
                      />
                    )}
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2">
                        {store?.storeName}
                        {store?.verification?.isVerified && (
                          <Shield className="w-5 h-5 text-green-400" aria-label="Verified store" />
                        )}
                      </h1>
                      <span className={`inline-flex items-center mt-1 px-2 py-1 rounded-full text-xs font-bold ${
                        isStoreOpen() 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {isStoreOpen() ? '🟢 Open Now' : '🔴 Closed'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Main Message */}
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">
                      Buy Affordable Data Bundles
                    </h2>
                    <p className="text-white/90 text-base sm:text-lg">
                      30-60min delivery • Best prices • All networks
                    </p>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <Link 
                      href={`/shop/${params.storeSlug}/products`}
                      className="group inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      style={{ color: customColors.primary }}
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Shop Now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    {store?.whatsappSettings?.communityLink && (
                      <a 
                        href={store.whatsappSettings.communityLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Join Community
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Right Side - Quick Benefits */}
                <div className="hidden lg:flex flex-col gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Zap className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Fast Delivery</p>
                      <p className="text-xs opacity-80">10-60 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-green-300" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Best Prices</p>
                      <p className="text-xs opacity-80">Save up to 40%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">100% Secure</p>
                      <p className="text-xs opacity-80">Safe payments</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Benefits Bar */}
              <div className="lg:hidden mt-4 flex justify-around text-center">
                <div className="flex flex-col items-center">
                  <Zap className="w-5 h-5 text-yellow-300 mb-1" />
                  <span className="text-xs">Fast</span>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingDown className="w-5 h-5 text-green-300 mb-1" />
                  <span className="text-xs">Cheap</span>
                </div>
                <div className="flex flex-col items-center">
                  <Shield className="w-5 h-5 text-blue-300 mb-1" />
                  <span className="text-xs">Secure</span>
                </div>
                <div className="flex flex-col items-center">
                  <WifiIcon className="w-5 h-5 text-purple-300 mb-1" />
                  <span className="text-xs">All Networks</span>
                </div>
              </div>
            </div>
          </section>

          {/* Shop by Network */}
          <section>
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Network</h2>
              <p className="text-gray-600 dark:text-gray-400">Select your network and start saving</p>
            </div>
            
            <nav className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Network selection">
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
                    className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    aria-label={`Shop ${name} data bundles`}
                  >
                    <div className={`bg-gradient-to-br ${color} p-4 sm:p-6 h-32 sm:h-36 flex flex-col justify-between`}>
                      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity" aria-hidden="true">
                        <Wifi className="w-16 h-16 text-white" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="mb-2 transform scale-75 sm:scale-100 origin-left">{logo}</div>
                        <h3 className="text-white font-bold text-lg sm:text-xl">{name}</h3>
                        <p className="text-white/90 text-xs sm:text-sm">
                          {networkProducts.length} bundles
                        </p>
                      </div>
                      
                      <div className="flex items-center text-white font-medium">
                        <span className="text-xs sm:text-sm">Shop Now</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </section>

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <div className="text-center sm:text-left mb-3 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    <Sparkles className="inline w-6 h-6 mr-2 text-yellow-500" />
                    Hot Deals
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Limited time offers!</p>
                </div>
                <Link 
                  href={`/shop/${params.storeSlug}/products`}
                  className="inline-flex items-center px-5 py-2 text-white font-bold rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
                  }}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Final CTA */}
          <section className="text-center py-8 px-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Ready to Save on Data? 🚀
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Join thousands of customers enjoying affordable bundles
            </p>
            <Link
              href={`/shop/${params.storeSlug}/products`}
              className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
              }}
            >
              <Rocket className="w-5 h-5 mr-2 animate-bounce" />
              Start Shopping Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </section>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
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
        `}</style>
      </div>
    </>
  );
}

// Product Card Component
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
  
  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    return 'AirtelTigo';
  };
  
  return (
    <article 
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 overflow-hidden"
      onClick={() => router.push(`/shop/${storeSlug}/products`)}
    >
      {/* Sale Badge */}
      {product.isOnSale && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            SALE
          </span>
        </div>
      )}
      
      {/* Featured Star */}
      {product.featured && (
        <div className="absolute top-2 right-2 z-10">
          <Star className="w-5 h-5 text-yellow-500 fill-current drop-shadow-lg" aria-label="Featured product" />
        </div>
      )}
      
      {/* Network Banner */}
      <div className={`h-1 bg-gradient-to-r ${getNetworkColor(product.network)}`} aria-hidden="true"></div>
      
      <div className="p-4">
        {/* Network & Capacity */}
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 bg-gradient-to-r ${getNetworkColor(product.network)} text-white text-xs font-bold rounded-full mb-2`}>
            {getNetworkName(product.network)}
          </span>
          
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {product.capacity}GB
          </h3>
          
          {product.displayName && (
            <p className="text-xs text-gray-600 dark:text-gray-400">{product.displayName}</p>
          )}
        </div>
        
        {/* Price */}
        <div className="mb-3">
          {product.isOnSale && product.salePrice ? (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(product.salePrice)}
              </span>
              <span className="text-xs text-gray-500 line-through ml-2">
                {formatCurrency(product.sellingPrice)}
              </span>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  Save {formatCurrency(product.sellingPrice - product.salePrice)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.sellingPrice)}
            </span>
          )}
        </div>
        
        {/* Features */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>90 days validity</span>
          </div>
          <div className="flex items-center">
            <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Fast delivery</span>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          className="w-full py-2 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
          style={{
            background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
          }}
          aria-label={`Buy ${product.capacity}GB ${getNetworkName(product.network)} bundle`}
        >
          Buy Now
        </button>
        
        {/* Out of Stock Overlay */}
        {product.inStock === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">Out of Stock</span>
          </div>
        )}
      </div>
    </article>
  );
}