// Reseller layout is now just a pass-through — the customer's existing
// auth context (from lib/auth) is used inside the dashboard. There's no
// separate reseller session; same login, same account.

export const metadata = {
  title: 'Manage your store — DataBundle',
  description: 'Edit prices, withdraw, share your link.'
};

export default function ResellerLayout({ children }) {
  return children;
}
