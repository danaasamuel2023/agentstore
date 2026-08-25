'use client';

/**
 * SiteNav — the navigation of a brand's own website, not of a page inside a
 * marketplace.
 *
 * The bar is ALWAYS the shop's colour. Over the home hero it is transparent and
 * the hero's colour shows through; past the hero it paints that colour itself.
 * On every other page it is solid from the start.
 *
 * It used to turn white once you scrolled past the hero, which put a white seam
 * between the bar and the shop's own colour and made the top of the page look
 * like platform chrome bolted above someone's site. Because both states are the
 * same colour, nothing on the bar has to restyle itself when it swaps — which
 * also removes the class of bug where the surface and the text disagreed about
 * which state they were in.
 *
 * That is the pattern people read as "a company's site". A permanently opaque
 * strip with the logo boxed into the left corner reads as "a listing on someone
 * else's platform", which is what we were building before.
 *
 * The mobile menu is a full-screen panel in the brand colour with large type.
 * The previous revision had no menu at all — the links scrolled sideways in a
 * pill strip. That is fine for a utility page and wrong here: a sideways-
 * scrolling row is the one nav pattern that never appears on a real brand site,
 * and it hides destinations off the edge of the screen.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Menu, X, Moon, Sun, ArrowRight, Search, Phone,
  House, ShoppingBag, Package, Info, Users,
} from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

/**
 * The shop's destinations, with their marks.
 *
 * Defined here rather than in the layout because the icon is a component, and
 * this list was already being written out twice — once in StoreLayoutClient and
 * again in the design editor's preview, which is exactly how a preview starts
 * showing a nav the real site does not have.
 */
export const NAV_LINKS = [
  { path: '', label: 'Home', Icon: House },
  { path: '/products', label: 'Buy data', Icon: ShoppingBag },
  { path: '/orders/search', label: 'Track order', Icon: Package },
  { path: '/about', label: 'About', Icon: Info },
];

/** Always renders on the brand colour — the bar and the mobile panel are both
 *  that colour now, so there is no second variant to keep in step. */
function Wordmark({ store, size = 34 }) {
  const initial = store?.storeName?.charAt(0)?.toUpperCase() || 'S';

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {store?.storeLogo ? (
        // Plain <img>: an owner-supplied URL, frequently a base64 data URI.
        // next/image would need every possible host allow-listed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.storeLogo}
          alt=""
          className="flex-none rounded-lg object-cover"
          style={{
            width: size,
            height: size,
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--brand-ink) 30%, transparent)',
          }}
        />
      ) : (
        <span
          className="flex flex-none items-center justify-center rounded-lg font-bold"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.44,
            background: 'var(--brand-ink)',
            color: 'var(--brand)',
          }}
          aria-hidden
        >
          {initial}
        </span>
      )}
      <span
        className="truncate text-[17px] font-bold tracking-[-0.025em]"
        style={{ color: 'var(--brand-ink)' }}
      >
        {store?.storeName || 'Data shop'}
      </span>
    </span>
  );
}

export default function SiteNav({
  store,
  storeSlug,
  navLinks,
  isActive,
  overHero = false,
  darkMode,
  onToggleTheme,
  onCheckNumber,
  subAgentEnabled,
}) {
  /* Start solid. Transparent-with-light-text is only ever safe when the hero is
     provably behind the bar, so that is the state we have to earn, not the one
     we default to — a wrong guess here paints white text on white page. */
  const [solid, setSolid] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * Go transparent only while the hero actually sits under the bar.
   *
   * This used to be `scrollY > 24`, which is a guess about where the hero ends.
   * Any time that guess was wrong — a short hero, a slim header style, an
   * announcement banner shifting everything down, the state lagging a fast
   * scroll — the bar stayed transparent over white content and the wordmark and
   * links vanished. Measuring the hero cannot disagree with the hero.
   */
  useEffect(() => {
    if (!overHero) {
      setSolid(true);
      return undefined;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const hero = document.getElementById('site-hero');
      if (!hero) {
        setSolid(true);
        return;
      }
      // The bar is 64px tall on phones, 72 from `sm`. Use the larger of the two
      // plus a little slack, so the swap always lands before the colour runs out
      // rather than a few pixels after it.
      const navHeight = window.innerWidth >= 640 ? 72 : 64;
      setSolid(hero.getBoundingClientRect().bottom <= navHeight + 4);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [overHero]);

  // A full-screen menu that lets the page scroll underneath it is a bug people
  // feel rather than see.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const whatsapp = store?.contactInfo?.whatsappNumber?.replace(/\D/g, '');

  return (
    <>
      <header
        /* Deliberately NOT transitioning background-color. The text colour flips
           in one frame while a 300ms background fade is still half transparent,
           which put white text on a near-white bar for a fifth of a second on
           every scroll past the hero. Border and shadow can fade; the surface
           the text sits on has to change at the same instant the text does. */
        className="fixed inset-x-0 top-0 z-50 transition-[border-color,box-shadow] duration-200"
        style={{
          // Over the hero it is transparent and the hero's own colour shows
          // through; past the hero it paints that same colour itself. Either
          // way the bar is the shop's colour, so the contents never need to
          // change — and there is no white seam between bar and hero.
          background: overHero && !solid ? 'transparent' : 'var(--brand)',
          borderBottom: `1px solid ${
            solid ? 'color-mix(in srgb, var(--brand-ink) 16%, transparent)' : 'transparent'
          }`,
          boxShadow: solid ? 'var(--lift-2)' : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:h-[72px]">
          <Link href={`/shop/${storeSlug}`} className="min-w-0">
            <Wordmark store={store} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  href={`/shop/${storeSlug}${link.path}`}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium transition-opacity hover:opacity-100"
                  style={{
                    color: 'var(--brand-ink)',
                    opacity: active ? 1 : 0.85,
                  }}
                >
                  <link.Icon className="h-4 w-4 flex-none" strokeWidth={active ? 2.4 : 2} />
                  {link.label}
                  {active && (
                    <span
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full"
                      style={{ background: 'var(--brand-ink)' }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Reseller entry. It was in the mobile menu only — dropped from the
                desktop bar when this nav replaced the old header, so anyone on a
                laptop had no way in short of the footer.

                Outlined rather than solid: it is a real destination, but the one
                filled button on the bar belongs to Buy data. Two solid buttons
                side by side and neither reads as the primary action. */}
            {subAgentEnabled && (
              <Link
                href={`/shop/${storeSlug}/join`}
                className="ml-1.5 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium transition-opacity hover:opacity-80"
                style={{
                  border: '1px solid color-mix(in srgb, var(--brand-ink) 34%, transparent)',
                  color: 'var(--brand-ink)',
                }}
              >
                <Users className="h-3.5 w-3.5" />
                Sell with us
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* In the bar at every width, not just from `sm` up. Below that it
                used to live only inside the full-screen menu, so switching
                theme on a phone meant open menu -> tap -> close menu. It is a
                one-tap switch; it should cost one tap. */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--brand-ink)' }}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              href={`/shop/${storeSlug}/products`}
              className="hidden h-10 items-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-opacity hover:opacity-90 sm:inline-flex"
              style={{ background: 'var(--brand-ink)', color: 'var(--brand)' }}
            >
              Buy data
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
              style={{ color: 'var(--brand-ink)' }}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---- Full-screen mobile menu, in the shop's own colour ---- */}
      {menuOpen && (
        <div
          className="animate-fadeIn fixed inset-0 z-[60] flex flex-col md:hidden"
          style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <Wordmark store={store} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ color: 'var(--brand-ink)' }}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pt-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={`/shop/${storeSlug}${link.path}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3.5 py-3.5 text-[26px] font-bold tracking-[-0.025em]"
                style={{
                  color: 'var(--brand-ink)',
                  opacity: isActive(link.path) ? 1 : 0.72,
                }}
              >
                <link.Icon className="h-6 w-6 flex-none" strokeWidth={2.2} />
                {link.label}
              </Link>
            ))}

            {subAgentEnabled && (
              <Link
                href={`/shop/${storeSlug}/join`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3.5 py-3.5 text-[26px] font-bold tracking-[-0.025em]"
                style={{ color: 'var(--brand-ink)', opacity: 0.72 }}
              >
                <Users className="h-6 w-6 flex-none" strokeWidth={2.2} />
                Sell with us
              </Link>
            )}

            <div
              className="mt-7 space-y-3 border-t pt-7"
              style={{ borderColor: 'color-mix(in srgb, var(--brand-ink) 22%, transparent)' }}
            >
              {onCheckNumber && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCheckNumber();
                  }}
                  className="flex items-center gap-2.5 text-[15px] font-medium"
                  style={{ color: 'var(--brand-ink)', opacity: 0.85 }}
                >
                  <Search className="h-4 w-4" />
                  Check a number
                </button>
              )}

              {store?.contactInfo?.phoneNumber && (
                <a
                  href={`tel:${store.contactInfo.phoneNumber}`}
                  className="num flex items-center gap-2.5 text-[15px] font-medium"
                  style={{ color: 'var(--brand-ink)', opacity: 0.85 }}
                >
                  <Phone className="h-4 w-4" />
                  {store.contactInfo.phoneNumber}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-[15px] font-medium"
                  style={{ color: 'var(--brand-ink)', opacity: 0.85 }}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </nav>

          <div className="p-4">
            <Link
              href={`/shop/${storeSlug}/products`}
              onClick={() => setMenuOpen(false)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg text-[15px] font-semibold"
              style={{ background: 'var(--brand-ink)', color: 'var(--brand)' }}
            >
              Buy data
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
