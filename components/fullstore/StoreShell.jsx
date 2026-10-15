'use client';

/**
 * Client shell for every page under /[storeSlug]/* — wraps the storefront
 * with OwnerAuthProvider (so TopNav and any inner page can see owner
 * state) and renders the standard chrome (TopNav + content + Footer).
 *
 * The customer AuthProvider lives at the root layout. OwnerAuthProvider
 * is mounted HERE (not at /owner/layout.js) because TopNav lives in this
 * subtree — without OwnerAuthProvider above TopNav, the nav can't show
 * the owner is signed in.
 */

import { OwnerAuthProvider } from '@/lib/fullstore/ownerAuth';
import { TopNav } from '@/components/fullstore/TopNav';
import { Footer } from '@/components/fullstore/Footer';

export function StoreShell({ storeSlug, storeName, ownBrand = null, children }) {
  return (
    <OwnerAuthProvider>
      <div className="min-h-screen flex flex-col">
        <TopNav storeSlug={storeSlug} storeName={storeName} ownBrand={ownBrand} />
        <main className="flex-1">{children}</main>
        <Footer storeSlug={storeSlug} ownBrand={ownBrand} />
      </div>
    </OwnerAuthProvider>
  );
}
