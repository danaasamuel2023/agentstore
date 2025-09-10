// app/shop/[storeSlug]/about/page.jsx
'use client';
import React from 'react'; // Add explicit React import
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  User, Store, Award, Shield, Calendar, MapPin, Clock,
  Phone, Mail, MessageCircle, Star, TrendingUp, Users,
  Package, CheckCircle, Globe, Briefcase, Target,
  Heart, Zap, Trophy, ChevronRight, Facebook,
  Instagram, Twitter, Send, Building, CreditCard,
  ShieldCheck, BarChart3, Rocket, Sparkles
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

const AboutPage = () => { // Changed to arrow function with const
  const params = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [customColors, setCustomColors] = useState({
    primary: '#1976d2',
    secondary: '#dc004e'
  });
  
  // Get storeSlug from params or localStorage
  const getStoreSlug = () => {
    if (params.storeSlug) return params.storeSlug;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastVisitedStoreSlug');
    }
    return null;
  };

  useEffect(() => {
    fetchStoreData();
  }, [params.storeSlug]);

  const fetchStoreData = async () => {
    try {
      // Get storeSlug from params or localStorage
      const storeSlug = getStoreSlug();
      
      if (!storeSlug) {
        console.error('No store slug available');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setStore(data.data);
        
        // Set custom colors
        if (data.data.customization) {
          setCustomColors({
            primary: data.data.customization.primaryColor || '#1976d2',
            secondary: data.data.customization.secondaryColor || '#dc004e'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysInBusiness = () => {
    if (!store?.createdAt) return 0;
    const created = new Date(store.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: customColors.primary }}
          ></div>
          <p className="text-gray-600 dark:text-gray-400">Loading store information...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Store Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">Unable to load store information.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About Us', icon: Store },
    { id: 'mission', label: 'Our Mission', icon: Target },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'policies', label: 'Policies', icon: Shield }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section with Custom Colors */}
      <div 
        className="relative rounded-3xl overflow-hidden text-white shadow-2xl mb-8"
        style={{
          background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative z-10 px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About {store.storeName}</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {store.storeDescription || 'Your trusted partner for affordable data bundles'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={activeTab === tab.id ? {
                  background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
                } : {}}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {/* About Tab */}
        {activeTab === 'about' && (
          <>
            {/* Store Owner Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div 
                  className="p-2 rounded-xl mr-4"
                  style={{ backgroundColor: `${customColors.primary}20` }}
                >
                  <User className="w-8 h-8" style={{ color: customColors.primary }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Site Owner</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Business Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{store.storeName}</p>
                    </div>
                  </div>
                  
                  {store.contactInfo?.email && (
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{store.contactInfo.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {store.contactInfo?.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{store.contactInfo.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Established</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(store.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">In Business</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{calculateDaysInBusiness()} days</p>
                    </div>
                  </div>
                  
                  {store.contactInfo?.address?.city && (
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {store.contactInfo.address.city}, {store.contactInfo.address.region || 'Ghana'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Verification Badges */}
              {store.verification?.isVerified && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      <span className="font-medium">Verified Store</span>
                    </div>
                    {store.verification?.verifiedAt && (
                      <div className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                        <Award className="w-5 h-5 mr-2" />
                        <span className="font-medium">Verified on {formatDate(store.verification.verifiedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Why Choose Us */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Why Choose Us?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${customColors.primary}20` }}
                  >
                    <Zap className="w-8 h-8" style={{ color: customColors.primary }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Delivery</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Get your data bundles delivered within 10-60 minutes
                  </p>
                </div>
                
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${customColors.secondary}20` }}
                  >
                    <Shield className="w-8 h-8" style={{ color: customColors.secondary }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Payments</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    100% secure payment processing with multiple options
                  </p>
                </div>
                
                <div className="text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${customColors.primary}20` }}
                  >
                    <Heart className="w-8 h-8" style={{ color: customColors.primary }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Always here to help via WhatsApp or phone
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mission Tab */}
        {activeTab === 'mission' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${customColors.primary}20` }}
                >
                  <Target className="w-10 h-10" style={{ color: customColors.primary }} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  To provide affordable and reliable data bundles to everyone, making internet connectivity 
                  accessible for work, education, and entertainment.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 mt-1 mr-4 flex-shrink-0" style={{ color: customColors.primary }} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Service</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We prioritize customer satisfaction with fast delivery and reliable service.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 mt-1 mr-4 flex-shrink-0" style={{ color: customColors.primary }} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Affordable Pricing</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Competitive prices to ensure everyone can stay connected without breaking the bank.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 mt-1 mr-4 flex-shrink-0" style={{ color: customColors.primary }} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Support</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Dedicated support team available to assist you whenever you need help.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${customColors.primary}20` }}
              >
                <Users className="w-7 h-7" style={{ color: customColors.primary }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {store.metrics?.totalCustomers || 100}+
              </p>
              <p className="text-gray-600 dark:text-gray-400">Happy Customers</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${customColors.secondary}20` }}
              >
                <Package className="w-7 h-7" style={{ color: customColors.secondary }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {store.metrics?.totalOrders || 500}+
              </p>
              <p className="text-gray-600 dark:text-gray-400">Orders Completed</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {store.metrics?.rating?.toFixed(1) || '4.5'}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Average Rating</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                99%
              </p>
              <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            {store.policies?.termsAndConditions && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Terms and Conditions</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {store.policies.termsAndConditions}
                </p>
              </div>
            )}
            
            {store.policies?.privacyPolicy && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {store.policies.privacyPolicy}
                </p>
              </div>
            )}
            
            {store.policies?.refundPolicy && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Refund Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {store.policies.refundPolicy}
                </p>
              </div>
            )}
            
            {store.policies?.deliveryPolicy && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delivery Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {store.policies.deliveryPolicy}
                </p>
              </div>
            )}
            
            {!store.policies?.termsAndConditions && !store.policies?.privacyPolicy && 
             !store.policies?.refundPolicy && !store.policies?.deliveryPolicy && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No policies have been published yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div 
        className="mt-12 rounded-2xl text-white p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${customColors.primary}, ${customColors.secondary})`
        }}
      >
        <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
        <p className="mb-6 text-white/90">We're here to help! Contact us anytime.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {store.contactInfo?.whatsappNumber && (
            <a 
              href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Us
            </a>
          )}
          {store.contactInfo?.phoneNumber && (
            <a 
              href={`tel:${store.contactInfo.phoneNumber}`}
              className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Us
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPage; // Explicit default export