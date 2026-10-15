import './fullstore.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/fullstore/auth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans'
});

export const metadata = {
  title: {
    default: 'DataBundle — fast data bundles for Ghana',
    template: '%s · DataBundle'
  },
  description:
    'Buy MTN, Telecel and AirtelTigo data bundles in seconds. Top up your wallet once, order forever. Built in Ghana.',
  themeColor: '#FBBF24',
  icons: { icon: '/favicon.svg' }
};

// Inline boot script — runs synchronously before React hydrates, sets the
// dark class on <html> based on the user's stored preference (or their OS
// default if they've never picked). Keeps first paint matching whatever
// the user expects, no white-flash on dark-mode page loads.
const themeBootScript = `
(function(){
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch(_) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
