'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Store, CheckCircle, ArrowRight, Shield, Zap, 
  TrendingUp, DollarSign, Phone, Mail, Lock, Eye, EyeOff,
  AlertCircle, Loader2, ArrowLeft, Gift, Percent, Clock,
  Copy, ExternalLink, Wallet, Settings, Share2
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  
  const [store, setStore] = useState(null);
  const [joinInfo, setJoinInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    momoNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchData();
    // Check for existing saved registration
    const saved = localStorage.getItem('resellerAccount');
    if (saved) {
      setSavedData(JSON.parse(saved));
    }
  }, [params.storeSlug]);

  const fetchData = async () => {
    try {
      const storeRes = await fetch(`${API_BASE}/v1/agent-stores/store/${params.storeSlug}`);
      const storeData = await storeRes.json();
      if (storeData.status === 'success') {
        setStore(storeData.data);
      }

      const joinRes = await fetch(`${API_BASE}/sub-agent/store/${params.storeSlug}/join-info`);
      const joinData = await joinRes.json();
      if (joinData.status === 'success') {
        setJoinInfo(joinData.data);
      } else {
        setJoinInfo(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Your name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Invalid phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE}/sub-agent/store/${params.storeSlug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.ownerName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.replace(/\s/g, ''),
          whatsapp: formData.whatsapp || formData.phone.replace(/\s/g, ''),
          password: formData.password,
          proposedStoreName: formData.storeName.trim(),
          proposedStoreDescription: `Data bundles by ${formData.storeName.trim()}`
        })
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        // Save registration data to localStorage INCLUDING PASSWORD
        const accountData = {
          storeName: formData.storeName.trim(),
          ownerName: formData.ownerName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.replace(/\s/g, ''),
          password: formData.password, // Save password so user can view later
          storeSlug: data.data?.storeSlug,
          storeLink: data.data?.storeUrl || `https://www.cheapdata.shop/shop/${data.data?.storeSlug}`,
          loginUrl: data.data?.loginUrl || `https://www.cheapdata.shop/shop/${params.storeSlug}/agent-login`,
          dashboardUrl: 'https://agent.cheapdata.shop',
          parentStore: store?.storeName,
          createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('resellerAccount', JSON.stringify(accountData));
        setSavedData(accountData);
        
        // Store is already activated - show success
        setSuccess(true);
        setStep(3);
      } else {
        setSubmitError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!joinInfo) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reseller Program Not Available</h1>
        <p className="text-gray-500 mb-6">This store is not currently accepting new resellers.</p>
        <Link href={`/shop/${params.storeSlug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  const activationFee = joinInfo.settings?.activationFee?.amount || 0;
  const isFree = activationFee === 0;

  // Success state with detailed instructions
  if (success && savedData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xl">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold">🎉 Congratulations!</h1>
            <p className="text-green-100 mt-2 text-lg">Your reseller account is ready</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Account Details - IMPORTANT: Save this! */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-bold text-yellow-800">📌 YOUR LOGIN DETAILS - SAVE THIS!</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                  <span className="text-gray-600">Store Name:</span>
                  <span className="font-bold text-gray-900">{savedData.storeName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                  <span className="text-gray-600">Email (Login):</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono">{savedData.email}</code>
                    <button onClick={() => copyToClipboard(savedData.email, 'email')} className="p-1 hover:bg-yellow-200 rounded">
                      {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-yellow-200 bg-yellow-100 -mx-5 px-5">
                  <span className="text-gray-600 font-medium">Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-1 rounded text-sm font-mono font-bold text-red-600">{savedData.password}</code>
                    <button onClick={() => copyToClipboard(savedData.password, 'pass')} className="p-1 hover:bg-yellow-200 rounded">
                      {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{savedData.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Your Shop Link:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs font-mono text-green-600 max-w-[150px] truncate">{savedData.storeLink}</code>
                    <button onClick={() => copyToClipboard(savedData.storeLink, 'link')} className="p-1 hover:bg-yellow-200 rounded">
                      {copied === 'link' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-yellow-700 mt-4 text-center">
                ⚠️ Your details are saved on this device. You can come back to this page anytime to view them.
              </p>
            </div>

            {/* Step-by-Step Guide */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-5 flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                How to Start Earning Money (4 Easy Steps)
              </h3>
              
              <div className="space-y-5">
                {/* Step 1 - Login */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2">Login to Your Dashboard</p>
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-3">Go to:</p>
                      <div className="flex items-center gap-2 mb-3">
                        <code className="bg-blue-100 px-3 py-2 rounded-lg text-blue-700 font-bold text-lg flex-1">agent.cheapdata.shop</code>
                        <button onClick={() => copyToClipboard('agent.cheapdata.shop', 'dashboard')} className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg">
                          {copied === 'dashboard' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-blue-600" />}
                        </button>
                      </div>
                      <div className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Email:</span>
                          <code className="font-mono bg-gray-100 px-2 py-0.5 rounded">{savedData.email}</code>
                        </div>
                        <div className="flex items-center justify-between bg-yellow-50 -mx-4 px-4 py-2 rounded">
                          <span className="text-gray-500">Password:</span>
                          <code className="font-mono bg-white px-2 py-0.5 rounded font-bold text-red-600">{savedData.password}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 - Fund Wallet */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      Fund Your Wallet
                    </p>
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600">
                        In your dashboard, click <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold">Wallet</span> → <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold">Deposit</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Add money via Mobile Money. This is what you'll use to buy data for your customers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 - Set Prices */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      Set Your Selling Prices
                    </p>
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600">
                        Go to <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold">Products</span> → <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold">Pricing</span>
                      </p>
                      <p className="text-sm text-green-600 font-medium mt-2">
                        💡 Set your prices HIGHER than buying price = Your Profit!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 - Share & Earn */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-pink-600" />
                      Share Your Shop & Start Earning!
                    </p>
                    <div className="bg-white rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">Share your shop link everywhere:</p>
                      <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg">
                        <code className="text-xs font-mono text-green-700 flex-1 truncate">{savedData.storeLink}</code>
                        <button onClick={() => copyToClipboard(savedData.storeLink, 'share')} className="p-1.5 bg-green-200 hover:bg-green-300 rounded">
                          {copied === 'share' ? <CheckCircle className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4 text-green-700" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">📱 WhatsApp, Facebook, Instagram, TikTok, etc.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit Example */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                💰 How You Make Money (Example)
              </h3>
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">You Buy At</p>
                    <p className="text-2xl font-bold text-gray-900">GH₵4</p>
                    <p className="text-xs text-gray-400">1GB MTN</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">You Sell At</p>
                    <p className="text-2xl font-bold text-gray-900">GH₵5</p>
                    <p className="text-xs text-gray-400">Your Price</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1">Your Profit</p>
                    <p className="text-2xl font-bold text-green-600">GH₵1</p>
                    <p className="text-xs text-green-500">Per Sale</p>
                  </div>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-3 text-center">
                  <p className="text-sm">
                    Sell <span className="font-bold">50 bundles/day</span> = <span className="font-bold text-xl">GH₵50/day</span> = <span className="font-bold text-xl">GH₵1,500/month!</span> 🚀
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link
                href={`/shop/${params.storeSlug}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
              >
                Back to Shop
              </Link>
              <a
                href="https://agent.cheapdata.shop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition shadow-lg"
              >
                Login to Dashboard
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            <p className="text-center text-xs text-gray-400">
              📸 Screenshot this page! Your login details are saved on this device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href={`/shop/${params.storeSlug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      {/* Show saved account if exists */}
      {savedData && !success && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-green-800 text-lg">Your Reseller Account</h3>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-green-200 space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Store Name:</span>
              <span className="font-semibold text-gray-900">{savedData.storeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Email:</span>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{savedData.email}</code>
                <button onClick={() => copyToClipboard(savedData.email, 'email')} className="p-1 hover:bg-gray-100 rounded">
                  {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            {savedData.password && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Password:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-yellow-100 px-2 py-1 rounded text-sm font-mono">{savedData.password}</code>
                  <button onClick={() => copyToClipboard(savedData.password, 'pass')} className="p-1 hover:bg-gray-100 rounded">
                    {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-gray-500 text-sm">Shop Link:</span>
              <div className="flex items-center gap-2">
                <code className="bg-green-100 px-2 py-1 rounded text-xs text-green-700 max-w-[150px] truncate">{savedData.storeLink}</code>
                <button onClick={() => copyToClipboard(savedData.storeLink, 'link')} className="p-1 hover:bg-gray-100 rounded">
                  {copied === 'link' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a 
              href="https://agent.cheapdata.shop" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition"
            >
              Login to Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                if (confirm('Clear saved account? You will lose your password!')) {
                  localStorage.removeItem('resellerAccount');
                  setSavedData(null);
                }
              }}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          {/* Hero */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              {store?.storeLogo ? (
                <img src={store.storeLogo} alt={store.storeName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-green-200 text-sm">Join</p>
                <h1 className="text-xl font-bold">{store?.storeName}</h1>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-3">Become a Data Reseller</h2>
            <p className="text-green-100 text-lg mb-6">
              Start your own data business today. Sell MTN, Telecel & AirtelTigo bundles to your customers.
            </p>

            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-xl px-4 py-2">
                <p className="text-green-200 text-xs">Activation Fee</p>
                <p className="text-2xl font-bold">{isFree ? 'FREE' : `GH₵${activationFee}`}</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-white text-green-700 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Earn Profits</h3>
              <p className="text-sm text-gray-500">Buy at wholesale prices and set your own selling prices. Keep the profit margin.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Own Shop</h3>
              <p className="text-sm text-gray-500">Get your own branded shop link to share with customers. Build your brand.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-500">Orders are processed automatically. Your customers get data within minutes.</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
            <h3 className="font-semibold text-gray-900 mb-6">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: 1, title: 'Sign Up', desc: 'Create your reseller account' },
                { step: 2, title: 'Fund Wallet', desc: 'Add money to your wallet' },
                { step: 3, title: 'Share Link', desc: 'Share your shop with customers' },
                { step: 4, title: 'Earn Money', desc: 'Make profit on every sale' }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-green-500 transition">
              Start Selling Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-gray-500 text-sm mt-3">
              {isFree ? 'No activation fee required' : `One-time activation fee of GH₵${activationFee}`}
            </p>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="bg-green-600 p-6 text-white">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-green-200 hover:text-white text-sm mb-3 transition">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-2xl font-bold">Create Your Reseller Account</h1>
              <p className="text-green-200 mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Name *</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    placeholder="e.g. John's Data Hub"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-gray-900 ${errors.storeName ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                </div>
                {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName}</p>}
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Full Name *</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-gray-900 ${errors.ownerName ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                </div>
                {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-gray-900 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0241234567"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-gray-900 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number <span className="text-gray-400">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="Same as phone if empty"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border bg-white text-gray-900 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white text-gray-900 ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-green-500`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Your Store...
                  </>
                ) : (
                  <>
                    Create My Store
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                By creating an account, you agree to our terms and conditions.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}