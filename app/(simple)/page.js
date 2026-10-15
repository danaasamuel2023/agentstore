// app/page.js
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, AlertTriangle, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasStoredStore, setHasStoredStore] = useState(false);

  useEffect(() => {
    // Check for stored storeSlug
    const checkStoredStore = () => {
      if (typeof window !== 'undefined') {
        const storedSlug = localStorage.getItem('lastVisitedStoreSlug');
        
        if (storedSlug) {
          // If we have a stored slug, redirect to that store
          setHasStoredStore(true);
          setTimeout(() => {
            router.push(`/shop/${storedSlug}`);
          }, 1000); // Brief delay to show redirect message
        } else {
          // No stored slug, show error page
          setIsChecking(false);
        }
      }
    };

    checkStoredStore();
  }, [router]);

  // Show loading/redirect screen if checking or redirecting
  if (isChecking || hasStoredStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {hasStoredStore ? 'Welcome Back!' : 'Loading...'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {hasStoredStore ? 'Redirecting to your store...' : 'Checking for your preferences...'}
            </p>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  // Show "Page Not Found" for new users without a stored store
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            No store found. Please use a valid store link to access the shop.
          </p>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Error Code: NO_STORE_SLUG
        </div>
      </div>
    </div>
  );
}