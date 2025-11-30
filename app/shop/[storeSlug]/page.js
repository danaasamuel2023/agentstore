// app/shop/[storeSlug]/page.jsx - WITH PROXY API
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ShoppingBag, Star, TrendingUp, Clock, Shield, Award,
  ChevronRight, Package, Zap, Users, Heart, ArrowRight,
  Wifi, Smartphone, Globe, CheckCircle, MessageCircle,
  Moon, Sun, AlertTriangle, Phone, Mail, MapPin,
  Facebook, Instagram, Twitter, Send, DollarSign,
  Sparkles, Gift, Crown, Rocket, Timer, CreditCard,
  WifiIcon, Percent, TrendingDown, Loader2, X
} from 'lucide-react';

// Lottie for loading animation
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import loadingAnimation from '@/public/animations/loading.json';

// API Base - Using Proxy to prevent CORS
const API_BASE = '/api/proxy/v1';

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
    setCustomerData(prev => ({ ...prev, [name]: value }));
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
    if (!/^0\d{9}$/.test(cleanPhone)) {
      setError('Phone number must be 10 digits starting with 0');
      return false;
    }
    
    return true;
  };
  
  const initializePayment = async () => {
    setError('');
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Using proxy API
      const response = await fetch(
        `${API_BASE}/agent-stores/stores/${storeSlug}/purchase/initialize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        localStorage.setItem('lastTransaction', JSON.stringify({
          transactionId: data.data.transactionId,
          gateway: data.data.gateway,
          amount: data.data.amount,
          phoneNumber: data.data.data?.phoneNumber || customerData.phoneNumber,
          productName: `${product.capacity}GB ${getNetworkName(product.network)}`
        }));
        
        if (data.data.gateway === 'paystack') {
          window.location.href = data.data.data.authorizationUrl;
        } else if (data.data.gateway === 'bulkclix') {
          alert(
            `📱 Payment Request Sent!\n\n` +
            `Phone: ${data.data.data.phoneNumber}\n` +
            `Amount: GH₵${data.data.data.amount.toFixed(2)}\n\n` +
            `Please check your phone and approve the payment.`
          );
          
          onClose();
          setTimeout(() => {
            router.push(`/shop/${storeSlug}/payment/verify?reference=${data.data.transactionId}&gateway=bulkclix`);
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment initialization failed.');
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
          className="sticky top-0 p-5 text-white rounded-t-2xl flex justify-between items-start"
          style={{ background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})` }}
        >
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Complete Purchase
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {product.capacity}GB {getNetworkName(product.network)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Product Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Product</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {product.capacity}GB {getNetworkName(product.network)}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-600 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Total</span>
              <span className="text-xl font-bold" style={{ color: customColors.primary }}>
                GH₵ {product.sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={customerData.phoneNumber}
                onChange={handleInputChange}
                placeholder="0241234567"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">Data will be delivered to this number</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
              <select
                name="paymentMethod"
                value={customerData.paymentMethod}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="auto">⚡ Automatic (Fastest)</option>
                <option value="paystack">💳 Paystack (Card/Bank)</option>
                <option value="bulkclix">📱 BulkClix (MoMo)</option>
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              <strong>Secure Payment</strong> • Data delivered in 10-60 minutes
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-5 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={initializePayment}
            disabled={loading}
            className="flex-1 px-4 py-3 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})` }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-4 h-4" /> Pay GH₵ {product.sellingPrice.toFixed(2)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PRODUCT CARD =====
function ProductCard({ product, storeSlug, isDarkMode, customColors }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const formatCurrency = (amount) => `GH₵ ${(amount || 0).toFixed(2)}`;
  
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
    <>
      <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Sale Badge */}
        {product.isOnSale && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              <Sparkles className="w-3 h-3 mr-1" /> SALE
            </span>
          </div>
        )}
        
        {/* Network Banner */}
        <div className={`h-1 bg-gradient-to-r ${getNetworkColor(product.network)}`}></div>
        
        <div className="p-4">
          {/* Network & Capacity */}
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 bg-gradient-to-r ${getNetworkColor(product.network)} text-white text-xs font-bold rounded-full mb-2`}>
              {getNetworkName(product.network)}
            </span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{product.capacity}GB</h3>
          </div>
          
          {/* Price */}
          <div className="mb-3">
            {product.isOnSale && product.salePrice ? (
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.salePrice)}</span>
                <span className="text-sm text-gray-500 line-through ml-2">{formatCurrency(product.sellingPrice)}</span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(product.sellingPrice)}</span>
            )}
          </div>
          
          {/* Features */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 90 days</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Fast</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Safe</span>
          </div>
          
          {/* Buy Button */}
          <button 
            onClick={() => product.inStock !== false && setShowPaymentModal(true)}
            disabled={product.inStock === false}
            className="w-full py-3 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: product.inStock === false ? '#999' : `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})` }}
          >
            {product.inStock === false ? (
              <><X className="w-4 h-4 inline mr-2" /> Out of Stock</>
            ) : (
              <><ShoppingBag className="w-4 h-4 inline mr-2" /> Buy Now</>
            )}
          </button>
        </div>
      </article>
      
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

// ===== MAIN STORE PAGE =====
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
      localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
    }
  }, [params.storeSlug]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
        setLoading(false);
        return;
      }

      // Using proxy API
      const storeResponse = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`);
      const storeData = await storeResponse.json();
      
      if (storeData.status === 'success') {
        setStore(storeData.data);
        
        if (storeData.data.customization) {
          setCustomColors({
            primary: storeData.data.customization.primaryColor || '#1976d2',
            secondary: storeData.data.customization.secondaryColor || '#dc004e'
          });
        }
        
        // Using proxy API
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

  const featuredProducts = products.filter(p => p.featured || p.isOnSale).slice(0, 4);

  // Loading State with Lottie
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 120, height: 120 }} />
        <p className="text-gray-400 text-sm mt-2">Loading store...</p>
      </div>
    );
  }

  // Store Not Found
  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Store Not Found</h1>
          <p className="text-gray-400 mb-6">This store is no longer available.</p>
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">
            <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'} min-h-screen transition-colors`}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>

        {/* Hero Section */}
        <section 
          className="rounded-xl overflow-hidden text-white shadow-xl"
          style={{ background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})` }}
        >
          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-4">
              {store?.storeLogo && (
                <img src={store.storeLogo} alt={store.storeName} className="h-14 w-14 rounded-xl border-2 border-white/30" />
              )}
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {store?.storeName}
                  {store?.verification?.isVerified && <Shield className="w-5 h-5 text-green-400" />}
                </h1>
                <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isStoreOpen() ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1 ${isStoreOpen() ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {isStoreOpen() ? 'Open Now' : 'Closed'}
                </span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2">Buy Affordable Data Bundles</h2>
            <p className="text-white/80 text-sm mb-4">⚡ 30-60min delivery • 💰 Best prices • 🌐 All networks</p>
            
            <div className="flex gap-3">
              <a href="#products" className="inline-flex items-center px-5 py-2 bg-white text-gray-900 font-bold rounded-full text-sm">
                <ShoppingBag className="w-4 h-4 mr-2" /> Shop Now
              </a>
              {store?.contactInfo?.whatsappNumber && (
                <a 
                  href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2 bg-green-500 text-white font-bold rounded-full text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Network Selection */}
        <section id="products">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Network</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { network: 'YELLO', name: 'MTN', logo: <MTNLogo />, color: 'from-yellow-400 to-yellow-600' },
              { network: 'TELECEL', name: 'Telecel', logo: <TelecelLogo />, color: 'from-red-400 to-red-600' },
              { network: 'AT_PREMIUM', name: 'AirtelTigo', logo: <AirtelTigoLogo />, color: 'from-purple-400 to-purple-600' },
            ].map(({ network, name, logo, color }) => {
              const count = products.filter(p => p.network === network).length;
              if (count === 0) return null;
              
              return (
                <div key={network} className={`bg-gradient-to-br ${color} p-4 rounded-xl text-white`}>
                  <div className="transform scale-75 origin-left">{logo}</div>
                  <h3 className="font-bold text-lg">{name}</h3>
                  <p className="text-white/80 text-xs">{count} bundles</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" /> Hot Deals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        {/* Store Info */}
        {store && (
          <section className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About {store.storeName}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{store.storeDescription}</p>
            
            <div className="grid grid-cols-2 gap-4">
              {store.contactInfo?.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: customColors.primary }} />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{store.contactInfo.phoneNumber}</p>
                  </div>
                </div>
              )}
              {store.contactInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: customColors.primary }} />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{store.contactInfo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}