'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Store, Phone, Mail, MessageCircle, Calendar, Clock,
  MapPin, Shield, Zap, Heart, CheckCircle, Users,
  Package, Star, TrendingUp
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

export default function AboutPage() {
  const params = useParams();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  
  useEffect(() => {
    fetchStore();
  }, [params.storeSlug]);

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/agent-stores/store/${params.storeSlug}`);
      const data = await res.json();
      if (data.status === 'success') {
        setStore(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
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

  const calculateDays = () => {
    if (!store?.createdAt) return 0;
    const created = new Date(store.createdAt);
    const now = new Date();
    return Math.ceil((now - created) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Store Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400">Unable to load store information.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'about', label: 'About Us' },
    { id: 'stats', label: 'Statistics' },
    { id: 'policies', label: 'Policies' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gray-900 text-white rounded-3xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-4">
          {store.storeLogo ? (
            <img src={store.storeLogo} alt={store.storeName} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Store className="w-8 h-8 text-white/60" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{store.storeName}</h1>
            <p className="text-gray-400">{store.storeDescription || 'Your trusted data provider'}</p>
          </div>
        </div>
        
        {store.verification?.isVerified && (
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            Verified Store
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* About Tab */}
        {activeTab === 'about' && (
          <>
            {/* Store Info */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Store Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Business Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{store.storeName}</p>
                    </div>
                  </div>

                  {store.contactInfo?.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium text-gray-900 dark:text-white">{store.contactInfo.email}</p>
                      </div>
                    </div>
                  )}

                  {store.contactInfo?.phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">{store.contactInfo.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Established</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(store.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">In Business</p>
                      <p className="font-medium text-gray-900 dark:text-white">{calculateDays()} days</p>
                    </div>
                  </div>

                  {store.contactInfo?.address?.city && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {store.contactInfo.address.city}, {store.contactInfo.address.region || 'Ghana'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Why Choose Us?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Delivery</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get your data bundles delivered within 10-60 minutes
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Payments</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    100% secure payment processing with multiple options
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Always here to help via WhatsApp or phone
                  </p>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Our Mission</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                To provide affordable and reliable data bundles to everyone, making internet connectivity
                accessible for work, education, and entertainment.
              </p>

              <div className="space-y-3">
                {[
                  'Quality service with fast delivery',
                  'Affordable pricing for all budgets',
                  'Dedicated customer support',
                  'All major networks supported'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {store.metrics?.totalCustomers || 100}+
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Happy Customers</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {store.metrics?.totalOrders || 500}+
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orders Completed</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {store.metrics?.rating?.toFixed(1) || '4.8'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Rating</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">99%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            {store.policies?.termsAndConditions && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Terms and Conditions</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{store.policies.termsAndConditions}</p>
              </div>
            )}

            {store.policies?.privacyPolicy && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{store.policies.privacyPolicy}</p>
              </div>
            )}

            {store.policies?.refundPolicy && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refund Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{store.policies.refundPolicy}</p>
              </div>
            )}

            {store.policies?.deliveryPolicy && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{store.policies.deliveryPolicy}</p>
              </div>
            )}

            {!store.policies?.termsAndConditions && !store.policies?.privacyPolicy &&
             !store.policies?.refundPolicy && !store.policies?.deliveryPolicy && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No policies have been published yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contact CTA */}
      <div className="mt-8 bg-gray-900 text-white rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Have Questions?</h2>
        <p className="text-gray-400 mb-6">We're here to help! Contact us anytime.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {store.contactInfo?.whatsappNumber && (
            <a 
              href={`https://wa.me/${store.contactInfo.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Us
            </a>
          )}
          {store.contactInfo?.phoneNumber && (
            <a 
              href={`tel:${store.contactInfo.phoneNumber}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition"
            >
              <Phone className="w-5 h-5" />
              Call Us
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
