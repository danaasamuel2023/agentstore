import StorePageClient from './StorePageClient';
import CustomDesignPage from './components/CustomDesignPage';
import { fetchCustomDesign } from '@/lib/customDesign.server';
import { cleanPreviewToken, customShell, SITE_PREVIEW_PARAM } from '@/lib/customDesign';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

async function getStoreData(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, {
      next: { revalidate: 60 }
    });
    const data = await res.json();
    if (data.status === 'success') return data.data;
    return null;
  } catch {
    return null;
  }
}

async function getProducts(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/stores/${storeSlug}/products`, {
      next: { revalidate: 60 }
    });
    const data = await res.json();
    if (data.status === 'success') return data.data?.products || [];
    return [];
  } catch {
    return [];
  }
}

export default async function StorePage({ params, searchParams }) {
  const { storeSlug } = await params;
  const sp = (await searchParams) || {};
  const previewToken = cleanPreviewToken(sp[SITE_PREVIEW_PARAM]);

  // A shared custom design (website builder) replaces the classic home body.
  // No design, or the builder unreachable → classic home, exactly as before.
  const custom = await fetchCustomDesign(storeSlug, previewToken);
  if (custom?.pages?.['/']) {
    return <CustomDesignPage design={customShell(custom)} page={custom.pages['/']} preview={!!previewToken} />;
  }

  const [store, products] = await Promise.all([
    getStoreData(storeSlug),
    getProducts(storeSlug),
  ]);

  return (
    <StorePageClient
      storeSlug={storeSlug}
      initialStore={store}
      initialProducts={products}
    />
  );
}
