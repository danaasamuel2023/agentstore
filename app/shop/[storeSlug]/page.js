// app/shop/[storeSlug]/page.jsx - COMPLETE WITH PAYMENT INTEGRATION
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
  WifiIcon, Percent, TrendingDown, Loader2, X
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

// ===== PAYMENT MODAL COMPONENT =====
function PaymentModal({ 
  isOpen, 
  onClose, 
  product, 
  storeSlug, 
  storeName,
  customColors 
}) {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    paymentMethod: 'auto'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const getNetworkName = (network) => {
    if (network === 'YELLO') return 'MTN';
    if (network === 'TELECEL') return 'Telecel';
    return 'AirtelTigo';
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };
  
  const validateForm = () => {
    if (!customerData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!customerData.email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!customerData.phoneNumber.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    
    const cleanPhone = customerData.phoneNumber.replace(/\s/g, '');
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Phone number must be 10 digits starting with 0 (e.g., 0241234567)');
      return false;
    }
    
    return true;
  };
  
  const initializePayment = async () => {
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `${API_BASE}/agent-stores/stores/${storeSlug}/purchase/initialize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: product._id,
            phoneNumber: customerData.phoneNumber.replace(/\s/g, ''),
            customerEmail: customerData.email,
            customerName: customerData.name,
            quantity: 1,
            paymentMethod: customerData.paymentMethod,
            callbackUrl: `${window.location.origin}/shop/${storeSlug}/payment/verify`,
            isMainPlatform: false
          })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize payment');
      }
      
      if (data.status === 'success') {
        // Store transaction details in localStorage for verification page
        localStorage.setItem('lastTransaction', JSON.stringify({
          transactionId: data.data.transactionId,
          gateway: data.data.gateway,
          amount: data.data.amount,
          phoneNumber: data.data.data?.phoneNumber || customerData.phoneNumber,
          productName: `${product.capacity}GB ${getNetworkName(product.network)}`
        }));
        
        // Route to correct payment gateway
        if (data.data.gateway === 'paystack') {
          // Redirect to Paystack payment page
          window.location.href = data.data.data.authorizationUrl;
        } else if (data.data.gateway === 'bulkclix') {
          // For BulkClix, show confirmation message
          alert(
            `📱 Payment Request Sent!\n\n` +
            `Phone: ${data.data.data.phoneNumber}\n` +
            `Amount: GH₵${data.data.data.amount.toFixed(2)}\n\n` +
            `Please check your phone and approve the payment.\n` +
            `You will be redirected to verify your payment.`
          );
          
          // Close modal and redirect to verification page
          onClose();
          setTimeout(() => {
            router.push(
              `/shop/${storeSlug}/payment/verify?reference=${data.data.transactionId}&gateway=bulkclix`
            );
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment initialization failed. Please try again.');
      console.error('Payment initialization error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div 
          className="sticky top-0 p-6 text-white rounded-t-2xl flex justify-between items-start"
          style={{
            background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
          }}
        >
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <CreditCard className="w-6 h-6 mr-2" />
              Complete Purchase
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {product.capacity}GB {getNetworkName(product.network)} Bundle
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Product Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 dark:text-gray-400">Product</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {product.capacity}GB {getNetworkName(product.network)}
              </span>
            </div>
            <div className="w-full h-px bg-gray-200 dark:bg-gray-600 mb-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
              <span className="text-2xl font-bold" style={{ color: customColors.primary }}>
                GH₵ {product.sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={customerData.phoneNumber}
                onChange={handleInputChange}
                placeholder="0241234567"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💬 Data will be delivered to this number
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={customerData.paymentMethod}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 disabled:opacity-50 transition-all"
              >
                <option value="auto">⚡ Automatic (Fastest Available)</option>
                <option value="paystack">💳 Paystack (Card, Bank, USSD)</option>
                <option value="bulkclix">📱 BulkClix (Mobile Money)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {customerData.paymentMethod === 'auto' 
                  ? '✓ System will use the fastest available gateway'
                  : customerData.paymentMethod === 'paystack'
                  ? '✓ Pay with card, bank transfer, or USSD'
                  : '✓ Receive payment prompt on your phone'}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              <strong>Secure Payment:</strong> Your data is encrypted and safe.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              <Clock className="w-4 h-4 inline mr-1" />
              <strong>Fast Delivery:</strong> Data delivered within 10-60 minutes after payment.
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            onClick={initializePayment}
            disabled={loading}
            className="flex-1 px-4 py-3 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay GH₵ {product.sellingPrice.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PRODUCT CARD COMPONENT =====
function ProductCard({ product, storeSlug, isDarkMode, customColors }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
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
  
  const handleBuyClick = (e) => {
    e.stopPropagation();
    if (product.inStock !== false) {
      setShowPaymentModal(true);
    }
  };
  
  return (
    <>
      <article 
        className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
      >
        {/* Sale Badge */}
        {product.isOnSale && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg gap-1">
              <Sparkles className="w-3 h-3" />
              SALE
            </span>
          </div>
        )}
        
        {/* Featured Star */}
        {product.featured && (
          <div className="absolute top-2 right-2 z-10 animate-bounce">
            <Star className="w-5 h-5 text-yellow-500 fill-current drop-shadow-lg" aria-label="Featured product" />
          </div>
        )}
        
        {/* Network Banner */}
        <div className={`h-1 bg-gradient-to-r ${getNetworkColor(product.network)}`} aria-hidden="true"></div>
        
        <div className="p-4">
          {/* Network & Capacity */}
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 bg-gradient-to-r ${getNetworkColor(product.network)} text-white text-xs font-bold rounded-full mb-2`}>
              {getNetworkName(product.network)}
            </span>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.capacity}GB
            </h3>
            
            {product.displayName && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{product.displayName}</p>
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
                  <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-semibold">
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
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>90 days</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" aria-hidden="true" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" aria-hidden="true" />
              <span>Safe</span>
            </div>
          </div>
          
          {/* Action Button */}
          <button 
            onClick={handleBuyClick}
            disabled={product.inStock === false}
            className="w-full py-3 text-white font-bold rounded-lg hover:shadow-lg active:scale-95 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: product.inStock === false 
                ? '#ccc' 
                : `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
            }}
            aria-label={`Buy ${product.capacity}GB ${getNetworkName(product.network)} bundle`}
          >
            {product.inStock === false ? (
              <>
                <X className="w-4 h-4 inline mr-2" />
                Out of Stock
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Buy Now
              </>
            )}
          </button>
        </div>
      </article>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={product}
        storeSlug={storeSlug}
        customColors={customColors}
      />
    </>
  );
}

// ===== MAIN STORE PAGE COMPONENT =====
export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#1976d2',
    secondary: '#dc004e'
  });

  useEffect(() => {
    if (params.storeSlug && typeof window !== 'undefined') {
      try {
        localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
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

  const generateStructuredData = () => {
    if (!store) return null;
    
    const baseUrl = 'https://www.cheapdata.shop';
    const storeUrl = `${baseUrl}/shop/${params.storeSlug}`;
    
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Store',
          '@id': `${storeUrl}#store`,
          name: store.storeName,
          description: store.storeDescription || `Buy affordable data bundles from ${store.storeName}. Fast delivery, best prices on MTN, Telecel, and AirtelTigo bundles in Ghana.`,
          image: store.storeLogo,
          logo: store.storeLogo,
          url: storeUrl,
          telephone: store.contactInfo?.phone,
          email: store.contactInfo?.email,
          priceRange: '₵₵',
          currenciesAccepted: 'GHS',
          paymentAccepted: 'Cash, Mobile Money, Card',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: store.rating?.average || 4.8,
            reviewCount: store.rating?.count || 250,
            bestRating: 5,
            worstRating: 1
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${storeUrl}#website`,
          url: storeUrl,
          name: `${store.storeName} | CheapData Shop`,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${storeUrl}/products?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          }
        }
      ]
    };
  };

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

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Store Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This store is no longer available.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
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
                  <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-4">
                    {store?.storeLogo && (
                      <img 
                        src={store.storeLogo} 
                        alt={`${store.storeName} logo`}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 border-white/30 shadow-lg"
                      />
                    )}
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 justify-center lg:justify-start">
                        {store?.storeName}
                        {store?.verification?.isVerified && (
                          <Shield className="w-5 h-5 text-green-400" aria-label="Verified store" />
                        )}
                      </h1>
                      <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isStoreOpen() 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        <span className="inline-block w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: isStoreOpen() ? '#4ade80' : '#ef4444' }}></span>
                        {isStoreOpen() ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">
                      Buy Affordable Data Bundles
                    </h2>
                    <p className="text-white/90 text-base sm:text-lg">
                      ⚡ 30-60min delivery • 💰 Best prices • 🌐 All networks
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                    <a 
                      href="#products"
                      className="group inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      style={{ color: customColors.primary }}
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Shop Now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                    
                    {store?.contactInfo?.whatsappNumber && (
                      <a 
                        href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp Support
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
                  <span className="text-xs">Networks</span>
                </div>
              </div>
            </div>
          </section>

          {/* Shop by Network */}
          <section id="products">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Your Network</h2>
              <p className="text-gray-600 dark:text-gray-400">Select your network and start saving</p>
            </div>
            
            <nav className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Network selection">
              {[
                { network: 'YELLO', name: 'MTN', logo: <MTNLogo />, color: 'from-yellow-400 to-yellow-600' },
                { network: 'TELECEL', name: 'Telecel', logo: <TelecelLogo />, color: 'from-red-400 to-red-600' },
                { network: 'AT_PREMIUM', name: 'AirtelTigo', logo: <AirtelTigoLogo />, color: 'from-purple-400 to-purple-600' },
              ].map(({ network, name, logo, color }) => {
                const networkProducts = products.filter(p => p.network === network);
                
                if (networkProducts.length === 0) return null;
                
                return (
                  <a
                    key={network}
                    href={`#products`}
                    className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    aria-label={`${name} data bundles`}
                  >
                    <div className={`bg-gradient-to-br ${color} p-4 sm:p-6 h-32 sm:h-36 flex flex-col justify-between`}>
                      <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-30 transition-opacity" aria-hidden="true">
                        <Wifi className="w-16 h-16 text-white" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="mb-2 transform scale-75 sm:scale-100 origin-left">{logo}</div>
                        <h3 className="text-white font-bold text-lg sm:text-xl">{name}</h3>
                        <p className="text-white/90 text-xs sm:text-sm">
                          {networkProducts.length} bundle{networkProducts.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="flex items-center text-white font-medium">
                        <span className="text-xs sm:text-sm">Explore</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </nav>
          </section>

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <section id="featured">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-7 h-7 text-yellow-500" />
                    Hot Deals
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Limited time offers!</p>
                </div>
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

          {/* All Products */}
          {products.length > 0 && (
            <section>
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">All Products</h2>
                <p className="text-gray-600 dark:text-gray-400">Browse all available data bundles</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
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
          <section className="text-center py-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              Ready to Save on Data? 🚀
            </h2>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of customers enjoying affordable bundles with fast delivery
            </p>
            <a
              href="#products"
              className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-lg bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              <Rocket className="w-5 h-5 mr-2 animate-bounce" />
              Start Shopping Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </section>

          {/* Store Info */}
          {store && (
            <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About {store.storeName}</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{store.storeDescription}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {store.contactInfo?.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" style={{ color: customColors.primary }} />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{store.contactInfo.phoneNumber}</p>
                    </div>
                  </div>
                )}
                {store.contactInfo?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: customColors.primary }} />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{store.contactInfo.email}</p>
                    </div>
                  </div>
                )}
                {store.metrics?.rating && (
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{store.metrics.rating.toFixed(1)} ⭐</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
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