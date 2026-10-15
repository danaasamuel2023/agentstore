import Link from 'next/link';
import { ShieldCheck, Zap, Clock } from 'lucide-react';
import { storeHref } from '@/lib/fullstore/links';
import { LogoMark } from '@/components/fullstore/Logo';

/** ownBrand: a store with its own design signs the footer with its own name. */
export function Footer({ storeSlug, ownBrand = null }) {
  const name = ownBrand?.name || null;
  return (
    <footer className="mt-20 border-t border-[color:var(--border)] bg-[color:var(--surface-2)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {name ? (
                <div className="font-extrabold tracking-tight text-[color:var(--ink)]">{name}</div>
              ) : (
                <>
                  <LogoMark size={32} />
                  <div className="font-extrabold tracking-tight">
                    <span className="text-[color:var(--ink)]">Data</span>
                    <span className="text-[color:var(--brand-deep)]">Bundle</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-[color:var(--ink-mute)] leading-relaxed text-[13px]">
              Buy MTN, Telecel and AirtelTigo bundles in seconds. Top up your wallet, save your numbers, order again with one tap.
            </p>
            <p className="text-[11px] text-[color:var(--ink-faint)] mt-3">Built in Ghana 🇬🇭</p>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-3">For customers</div>
            <ul className="space-y-2 text-[13px] text-[color:var(--ink-soft)]">
              <li>
                {storeSlug ? (
                  <Link href={storeHref(storeSlug, '')} className="hover:text-[color:var(--ink)]">Browse bundles</Link>
                ) : (
                  <span className="text-[color:var(--ink-faint)]">Browse bundles</span>
                )}
              </li>
              <li>
                {storeSlug ? (
                  <Link href={storeHref(storeSlug, '/register')} className="hover:text-[color:var(--ink)]">Create an account</Link>
                ) : (
                  <span className="text-[color:var(--ink-faint)]">Create an account</span>
                )}
              </li>
              <li>
                {storeSlug ? (
                  <Link href={storeHref(storeSlug, '/account/orders')} className="hover:text-[color:var(--ink)]">My orders</Link>
                ) : (
                  <span className="text-[color:var(--ink-faint)]">My orders</span>
                )}
              </li>
              <li>
                {storeSlug ? (
                  <Link href={storeHref(storeSlug, '/track')} className="hover:text-[color:var(--ink)]">Track an order</Link>
                ) : (
                  <span className="text-[color:var(--ink-faint)]">Track an order</span>
                )}
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-3">{name ? 'Why buy here' : 'Why DataBundle'}</div>
            <ul className="space-y-2 text-[13px] text-[color:var(--ink-soft)]">
              <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-[color:var(--brand-deep)]" /> 1–5 min delivery</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-[color:var(--brand-deep)]" /> Auto-refund on failed orders</li>
              <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[color:var(--brand-deep)]" /> Open 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[color:var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[color:var(--ink-faint)]">
          <div>© {new Date().getFullYear()} {name || 'DataBundle'}. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[color:var(--ink-soft)]">Terms</Link>
            <Link href="#" className="hover:text-[color:var(--ink-soft)]">Privacy</Link>
            <Link href="#" className="hover:text-[color:var(--ink-soft)]">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
