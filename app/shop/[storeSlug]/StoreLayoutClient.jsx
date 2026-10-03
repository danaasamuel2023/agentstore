'use client';

/**
 * Store shell — a brand's own website, not a listing page.
 *
 * SiteNav is FIXED and starts transparent over the home hero, so the shop's
 * colour runs edge to edge behind its own wordmark before anything else loads
 * into view. `main` reserves the nav's height; SiteHero cancels that with a
 * negative margin so it can sit underneath the transparent bar.
 *
 * The brand colour is applied once here as CSS custom properties and everything
 * downstream reads var(--brand). See lib/storeTheme.js for why that matters —
 * the previous per-file `getThemeColors()` read fields the schema does not have,
 * so no store's colour ever actually reached the page.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, ExternalLink, Phone, Store, LogIn } from 'lucide-react';
import WhatsAppIcon from './components/WhatsAppIcon';
import { getCachedDesign, setCachedDesign, extractDesignSettings } from '@/lib/designCache';
import { resolveDesign, designVars, designAttrs, fontHref, StoreDesignProvider } from '@/lib/storeDesign';
import { sanitizeDesign } from '@/lib/designSpec';
import { PREVIEW_PARAM, MSG_READY, MSG_PREVIEW, isPreviewOrigin } from '@/lib/designPreview';
import AnnouncementPopup from './components/AnnouncementPopup';
import PromoClaimButton from './components/PromoClaimButton';
import SiteNav, { navLinksFor } from './components/SiteNav';
import VerifyNumberModal from './components/VerifyNumberModal';
import { customThemeDesign, customNavLinks, customNavStyle, SITE_PREVIEW_PARAM, cleanPreviewToken } from '@/lib/customDesign';
import { CustomDesignProvider } from '@/lib/customDesignContext';

const API_BASE = 'https://api.datamartgh.shop';

function FooterMark({ store, size = 34 }) {
  if (store?.storeLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={store.storeLogo}
        alt=""
        className="flex-none rounded-lg border border-hairline object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex flex-none items-center justify-center rounded-lg font-semibold"
      style={{ width: size, height: size, background: 'var(--brand)', color: 'var(--brand-ink)', fontSize: size * 0.42 }}
      aria-hidden
    >
      {store?.storeName?.charAt(0)?.toUpperCase() || 'S'}
    </span>
  );
}

export default function StoreLayoutClient({ children, initialStore, initialCustomDesign = null }) {
  const params = useParams();
  const pathname = usePathname();

  const [store, setStore] = useState(initialStore || null);
  const [loading, setLoading] = useState(!initialStore);
  const [subAgentEnabled, setSubAgentEnabled] = useState(false);
  const [activationFee, setActivationFee] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [designSettings, setDesignSettings] = useState(
    initialStore ? extractDesignSettings(initialStore) : null
  );

  /* AI store designer live preview (?designPreview=1 inside the dashboard's
     iframe). The editor posts un-saved designs; we sanitise and draw them.
     Read from window.location, not useSearchParams, so the layout needs no
     Suspense boundary. */
  const [isPreview, setIsPreview] = useState(false);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [themeOverride, setThemeOverride] = useState(null); // session-only, for forced/preview themes
  const [previewToast, setPreviewToast] = useState(false);

  /* Shared custom design (website builder). The published one comes from the
     server; in the builder's preview (?sitePreview=<token>) the page fetches
     the DRAFT and hands it up through CustomDesignProvider. */
  const [previewCustom, setPreviewCustomState] = useState(null);
  const setPreviewCustom = useCallback((d) => setPreviewCustomState(d || null), []);
  const [sitePreviewToken, setSitePreviewToken] = useState(null);
  useEffect(() => {
    const tok = cleanPreviewToken(new URLSearchParams(window.location.search).get(SITE_PREVIEW_PARAM));
    if (tok) { setSitePreviewToken(tok); setIsPreview(true); }
  }, []);
  const custom = previewCustom || initialCustomDesign;
  const customTheme = useMemo(() => customThemeDesign(custom), [custom]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get(PREVIEW_PARAM) !== '1') return undefined;
    setIsPreview(true);
    const onMessage = (e) => {
      if (!isPreviewOrigin(e.origin)) return;
      if (!e.data || e.data.type !== MSG_PREVIEW) return;
      setPreviewDesign(sanitizeDesign(e.data.design));
      setThemeOverride(null);
    };
    window.addEventListener('message', onMessage);
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ type: MSG_READY }, '*');
    } catch {
      // not framed / cross-origin parent — nothing to tell
    }
    return () => window.removeEventListener('message', onMessage);
  }, []);

  /* In preview nobody may buy: every link and form is stopped at capture. */
  useEffect(() => {
    if (!isPreview) return undefined;
    let timer = 0;
    const stop = (e) => {
      const link = e.type === 'click' ? e.target.closest?.('a[href]') : null;
      if (e.type === 'click' && !link) return;
      // Builder preview: the custom pages (home, /p/*) stay browsable inside the
      // preview (token carried along); everything else — buying, checkers,
      // orders, outside links — is stopped, so nobody can buy from the editor.
      if (e.type === 'click' && sitePreviewToken) {
        try {
          const url = new URL(link.getAttribute('href'), window.location.href);
          const base = `/shop/${params.storeSlug}`;
          const p = url.pathname.replace(/\/+$/, '');
          const isCustomPage = url.origin === window.location.origin && (p === base || p.startsWith(`${base}/p/`));
          if (isCustomPage) {
            e.preventDefault();
            e.stopPropagation();
            url.searchParams.set(SITE_PREVIEW_PARAM, sitePreviewToken);
            window.location.assign(url.toString());
            return;
          }
        } catch { /* fall through to the toast */ }
      }
      e.preventDefault();
      e.stopPropagation();
      setPreviewToast(true);
      clearTimeout(timer);
      timer = setTimeout(() => setPreviewToast(false), 2200);
    };
    document.addEventListener('click', stop, true);
    document.addEventListener('submit', stop, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', stop, true);
      document.removeEventListener('submit', stop, true);
    };
  }, [isPreview, sitePreviewToken, params.storeSlug]);

  useEffect(() => {
    const saved = localStorage.getItem('shopDarkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(saved ? saved === 'true' : prefersDark);
  }, []);

  const resolved = useMemo(() => resolveDesign(store, previewDesign || customTheme), [store, previewDesign, customTheme]);
  const { design, legacy } = resolved;
  // 'dark' designs force the dark theme; in preview a 'light' design shows light.
  // Legacy stores and 'light' designs keep the visitor's own choice, as before.
  const forcedDark = !legacy && design.mode === 'dark';
  const baseDark = forcedDark ? true : isPreview ? false : darkMode;
  const effectiveDark = themeOverride ?? baseDark;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveDark);
  }, [effectiveDark]);

  useEffect(() => {
    if (isPreview) return;
    localStorage.setItem('shopDarkMode', String(darkMode));
  }, [darkMode, isPreview]);

  useEffect(() => {
    const load = async () => {
      if (!initialStore) {
        const cached = getCachedDesign(params.storeSlug);
        if (cached) setDesignSettings(cached);
      }
      try {
        const res = await fetch(`${API_BASE}/api/v1/agent-stores/store/${params.storeSlug}`);
        const data = await res.json();
        if (data.status === 'success') {
          setStore(data.data);
          const next = extractDesignSettings(data.data);
          setDesignSettings(next);
          setCachedDesign(params.storeSlug, next);
          localStorage.setItem('lastVisitedStoreSlug', params.storeSlug);
        }
      } catch {
        // Keep whatever we rendered with — a stale shop beats no shop.
      } finally {
        setLoading(false);
      }
    };

    const checkSubAgent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sub-agent/store/${params.storeSlug}/join-info`);
        const data = await res.json();
        if (data.status === 'success') {
          setSubAgentEnabled(true);
          setActivationFee(data.data?.settings?.activationFee?.amount || 0);
        }
      } catch {
        setSubAgentEnabled(false);
      }
    };

    load();
    checkSubAgent();
  }, [params.storeSlug, initialStore]);

  const brandStyle = useMemo(() => designVars(store, resolved, effectiveDark), [store, resolved, effectiveDark]);
  const brandAttrs = designAttrs(resolved);
  const fontLink = legacy ? null : fontHref(design.font);
  const toggleTheme = () => {
    if (forcedDark || isPreview) setThemeOverride(!effectiveDark);
    else setDarkMode(!darkMode);
  };

  const isOpen = () => {
    if (!store?.isOpen) return false;
    if (!store.autoCloseOutsideHours) return true;
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toTimeString().slice(0, 5);
    const hours = store.businessHours?.[day];
    return Boolean(hours?.isOpen && time >= hours.open && time <= hours.close);
  };

  const isActive = (path) => {
    const base = `/shop/${params.storeSlug}`;
    if (path === '') return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(`${base}${path}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="w-full max-w-md space-y-3 px-6">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="card max-w-sm p-8 text-center">
          <h1 className="mb-2 text-[20px]">Shop not found</h1>
          <p className="text-[14px] text-ink-3">
            This shop does not exist, or its owner has taken it down.
          </p>
        </div>
      </div>
    );
  }

  const whatsapp = store.contactInfo?.whatsappNumber?.replace(/\D/g, '');
  const whatsappGroup = store.whatsappSettings?.groupLink || designSettings?.whatsappGroupLink;
  const isOwnerArea = pathname.startsWith(`/shop/${params.storeSlug}/owner`);
  const isHome = isActive('');
  // Custom design: its menu + logo; the classic SiteHero isn't on a custom home,
  // so the nav must not sit transparently over content it wasn't designed for.
  const links = customNavLinks(custom, params.storeSlug) || navLinksFor(store);
  const shown = custom?.logoUrl ? { ...store, storeLogo: custom.logoUrl } : store;
  const customHome = isHome && !!custom?.pages?.['/'];

  return (
    <CustomDesignProvider value={{ custom, setPreviewCustom }}>
    <StoreDesignProvider value={{ design, legacy, preview: isPreview }}>
    <div style={brandStyle} {...brandAttrs} className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      {custom?.cssUrl && <link rel="stylesheet" href={custom.cssUrl} precedence="default" />}
      {fontLink && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="stylesheet" href={fontLink} precedence="default" />
        </>
      )}
      <SiteNav
        store={shown}
        storeSlug={params.storeSlug}
        navLinks={links}
        isActive={isActive}
        overHero={isHome && !customHome}
        darkMode={effectiveDark}
        onToggleTheme={toggleTheme}
        navStyle={customNavStyle(custom) || design.navStyle}
        onCheckNumber={() => setShowVerify(true)}
        subAgentEnabled={subAgentEnabled}
      />

      <VerifyNumberModal open={showVerify} onClose={() => setShowVerify(false)} />

      <main className="flex-1 pt-16 sm:pt-[72px]">
        {/* Inside main, so the inline banner variant sits BELOW the fixed nav
            instead of being painted over by it. Never on /owner/*: an
            announcement aimed at shoppers lands on the owner's sign-in form. */}
        {store?.announcement?.enabled && !isOwnerArea && !isPreview && (
          <AnnouncementPopup
            announcement={store.announcement}
            style={
              designSettings?.announcementPopupStyle ||
              store?.customization?.announcementPopupStyle ||
              'banner'
            }
          />
        )}

        {/* The home page lays out its own width so SiteHero can run genuinely
            edge to edge. Every other page gets the standard content column. */}
        {isHome ? (
          children
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</div>
        )}
      </main>

      <footer className="border-t border-hairline bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center gap-2.5">
                <FooterMark store={shown} />
                <span className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                  {store.storeName}
                </span>
              </div>
              <p className="max-w-sm text-[13px] leading-relaxed text-ink-3">
                {store.storeDescription ||
                  'Data bundles for MTN, Telecel and AirtelTigo, paid by mobile money.'}
              </p>
              {whatsappGroup && (
                <a
                  href={whatsappGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost mt-4 h-9 text-[13px]"
                >
                  {/* WhatsApp's own green, not the shop's brand colour — this is
                      someone else's mark and recolouring it makes it stop
                      reading as WhatsApp at a glance. */}
                  <span style={{ color: '#25D366' }} className="flex">
                    <WhatsAppIcon className="h-4 w-4" />
                  </span>
                  Join the WhatsApp group
                  <ExternalLink className="h-3 w-3 text-ink-4" />
                </a>
              )}
            </div>

            <div>
              <p className="eyebrow mb-3">Shop</p>
              <div className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    href={`/shop/${params.storeSlug}${link.path}`}
                    className="group flex items-center gap-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
                  >
                    <link.Icon className="h-3.5 w-3.5 flex-none text-ink-4 transition-colors group-hover:text-ink-3" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">{subAgentEnabled ? 'Sell with us' : 'Contact'}</p>
              <div className="space-y-2">
                {subAgentEnabled && (
                  <>
                    <Link
                      href={`/shop/${params.storeSlug}/join`}
                      className="group flex items-center gap-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
                    >
                      <Store className="h-3.5 w-3.5 flex-none text-ink-4 transition-colors group-hover:text-ink-3" />
                      Become a reseller
                      {activationFee > 0 && (
                        <span className="num ml-auto text-ink-4">₵{activationFee}</span>
                      )}
                    </Link>
                    <Link
                      href={`/shop/${params.storeSlug}/agent-login`}
                      className="group flex items-center gap-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
                    >
                      <LogIn className="h-3.5 w-3.5 flex-none text-ink-4 transition-colors group-hover:text-ink-3" />
                      Reseller login
                    </Link>
                  </>
                )}
                {store.contactInfo?.phoneNumber && (
                  <a
                    href={`tel:${store.contactInfo.phoneNumber}`}
                    className="group flex items-center gap-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
                  >
                    <Phone className="h-3.5 w-3.5 flex-none text-ink-4 transition-colors group-hover:text-ink-3" />
                    <span className="num">{store.contactInfo.phoneNumber}</span>
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-ink-3 transition-colors hover:text-ink"
                  >
                    <span style={{ color: '#25D366' }} className="flex flex-none">
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                    </span>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-hairline pt-6 text-center">
            <p className="text-[12px] text-ink-4">
              © {new Date().getFullYear()} {store.storeName}
            </p>
          </div>
        </div>
      </footer>

      {whatsapp && design.whatsappFloat && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi, I would like to buy data')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
          style={{ background: '#25D366', boxShadow: 'var(--lift-2)' }}
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      )}

      {!isPreview && <PromoClaimButton storeSlug={params.storeSlug} />}

      {isPreview && previewToast && (
        <div
          role="status"
          className="animate-slideUp fixed inset-x-0 bottom-6 z-[70] mx-auto w-max max-w-[90vw] rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{ background: 'var(--ink)', color: 'var(--paper)', boxShadow: 'var(--lift-3)' }}
        >
          Preview — buying is off
        </div>
      )}

      {!isPreview && store?.rezolv?.enabled && store?.rezolv?.apiKey && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.REZOLV_CONFIG = { apiKey: ${JSON.stringify(store.rezolv.apiKey)} };`,
            }}
          />
          <script src="https://api.rezolv.dev/widget.js" async />
        </>
      )}
    </div>
    </StoreDesignProvider>
    </CustomDesignProvider>
  );
}
