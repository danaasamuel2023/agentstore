import SpinWinInfoClient from './SpinWinInfoClient';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

async function getStoreData(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    if (data.status === 'success') return data.data;
    return null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: 'Spin & Win — free data with every order',
  description: 'Buy data and earn a spin. Win free data, sent straight to any number you choose.',
};

export default async function SpinWinInfoPage({ params }) {
  const { storeSlug } = await params;
  const store = await getStoreData(storeSlug);
  return <SpinWinInfoClient store={store} storeSlug={storeSlug} />;
}
