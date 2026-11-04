import InviteFriendClient from './InviteFriendClient';

const API_BASE = 'https://api.datamartgh.shop/api/v1';

async function getStore(storeSlug) {
  try {
    const res = await fetch(`${API_BASE}/agent-stores/store/${storeSlug}`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.status === 'success' ? data.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug);
  const name = store?.storeName || 'our shop';
  return {
    title: `Invite a friend to ${name}`,
    description: `Share your link with friends. When a friend buys here for the first time, your next order costs less.`,
    openGraph: { images: ['/videos/bring-a-friend.jpg'] },
  };
}

export default async function InviteFriendPage({ params }) {
  const { storeSlug } = await params;
  const store = await getStore(storeSlug);
  return <InviteFriendClient storeSlug={storeSlug} storeName={store?.storeName || ''} />;
}
