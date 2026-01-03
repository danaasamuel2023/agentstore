'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, Users, LogIn } from 'lucide-react';

const AGENT_PORTAL_URL = 'https://agent.cheapdata.shop';
const API_BASE = 'https://api.datamartgh.shop/api';

export default function AgentLoginPage() {
  const params = useParams();
  
  const [subAgentEnabled, setSubAgentEnabled] = useState(null);

  useEffect(() => {
    checkSubAgentStatus();
  }, [params.storeSlug]);

  const checkSubAgentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/sub-agent/store/${params.storeSlug}/join-info`);
      const data = await res.json();
      setSubAgentEnabled(data.status === 'success');
    } catch (e) {
      setSubAgentEnabled(false);
    }
  };

  // Loading state
  if (subAgentEnabled === null) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  // Sub-agent not enabled
  if (subAgentEnabled === false) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reseller Portal Not Available</h1>
        <p className="text-gray-500 mb-6">This store doesn't have a reseller program.</p>
        <Link 
          href={`/shop/${params.storeSlug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Back Link */}
      <Link 
        href={`/shop/${params.storeSlug}`}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      {/* Redirect Modal Card */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Reseller Portal</h1>
          <p className="text-green-100 mt-1">Access your dashboard</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium text-sm">External Portal</p>
              <p className="text-blue-700 text-sm mt-1">
                The reseller dashboard is hosted at <span className="font-semibold">agent.cheapdata.shop</span>. 
                It will open in a new tab.
              </p>
            </div>
          </div>

          {/* Portal URL Display */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Opening in new tab</p>
            <p className="text-gray-900 font-mono font-medium">{AGENT_PORTAL_URL}</p>
          </div>

          {/* Open Portal Button */}
          <a
            href={`${AGENT_PORTAL_URL}/login`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ExternalLink className="w-5 h-5" />
            Open Agent Portal
          </a>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Join Link */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link href={`/shop/${params.storeSlug}/join`} className="text-green-600 font-medium hover:text-green-700">
                Become a Reseller
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-xs">
          Your login credentials work on the agent portal
        </p>
      </div>
    </div>
  );
}