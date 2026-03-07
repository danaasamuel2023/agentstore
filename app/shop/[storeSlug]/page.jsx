import StorePageClient from './StorePageClient';

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

export default async function StorePage({ params }) {
  const { storeSlug } = await params;

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
