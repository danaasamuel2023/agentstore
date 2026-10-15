import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { storeHref, isPlatformSlug } from '@/lib/fullstore/links';
import { LogoMark } from '@/components/fullstore/Logo';

/**
 * Visual shell for register/login/verify/reset — two-column on desktop
 * (form + decorative panel), single column on mobile. Keeps every auth
 * page in the same rhythm so it feels like one product.
 */
export function AuthShell({ storeSlug, eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2">
      {/* ===== Form ===== */}
      <div className="px-5 sm:px-10 py-10 sm:py-16 flex flex-col">
        <Link href={storeHref(storeSlug, '')} className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-10">
          <ArrowLeft className="w-3.5 h-3.5" />
          {isPlatformSlug(storeSlug) ? 'Back home' : 'Back to store'}
        </Link>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-3">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-[color:var(--ink-mute)] text-[14px]">{subtitle}</p>
          )}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-8 text-[13px] text-[color:var(--ink-mute)]">{footer}</div>}
        </div>
      </div>

      {/* ===== Decorative panel =====
         Locked to the brand dark — this side is intentionally always-dark
         so the brand panel reads the same in light + dark mode. */}
      <div className="hidden lg:block relative overflow-hidden bg-[#0F0E0B]">
        <div className="brand-glow-1" style={{ top: -120, right: -120, opacity: 0.25 }} />
        <div className="brand-glow-2" style={{ bottom: -120, left: -80, opacity: 0.18 }} />
        <div className="absolute inset-0 bg-dots opacity-30" />
        <div className="relative h-full p-12 flex flex-col justify-between text-[color:var(--brand)]">
          <div>
            <LogoMark size={48} />
            <p className="mt-8 text-white text-[28px] font-black leading-tight max-w-sm">
              The fastest way to buy data in Ghana.
            </p>
            <p className="mt-3 text-white/60 text-[14px] max-w-sm leading-relaxed">
              Wallet you control. One-tap re-orders. Automatic refunds when the network plays games.
            </p>
          </div>

          <div className="space-y-3 text-[13px] text-white/80 max-w-sm">
            <Quote line="Came for the prices, stayed for the speed." who="A reseller in Kumasi" />
            <Quote line="Refund hit my wallet before I even messaged support." who="A regular customer" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Quote({ line, who }) {
  return (
    <div className="border-l-2 border-[color:var(--brand)] pl-3">
      <p className="text-white text-[14px]">{line}</p>
      <p className="text-white/40 text-[11px] mt-1">— {who}</p>
    </div>
  );
}
