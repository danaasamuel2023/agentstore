'use client';

/**
 * About the shop.
 *
 * Minimal on purpose: who the shop is, how to reach them, and whatever policies
 * the owner actually wrote. Everything else that was here was either invented or
 * measuring the wrong thing.
 *
 * WHAT WAS REMOVED, AND WHY IT MATTERS
 *
 * The whole "Statistics" tab. Not for tidiness — every figure in it was false:
 *
 *   • `store.metrics.totalOrders || 500` — totalOrders is NOT the shop's own
 *     count. It is a platform-wide counter written onto every store document; a
 *     shop created in Sept 2025 reports 2,632,696 and climbs while you watch.
 *   • `store.metrics.totalCustomers || 100` — reads 0 on every store checked, so
 *     the tile always rendered the invented "100+".
 *   • `store.metrics.rating || '4.8'` — a 4.8 star rating shown for shops with
 *     zero reviews.
 *   • "99% Success Rate" — hardcoded. Not read from anything at all.
 *
 * A customer who notices one invented number stops believing the prices too.
 * These are not replaced with smaller numbers; they are gone until per-store
 * metrics are trustworthy.
 *
 * Also gone: "Why Choose Us?" (three pastel circles repeating the claims the
 * home page already makes), "Our Mission" (filler), and "In Business — N days",
 * which is a metric that actively harms any shop under a year old.
 *
 * The tab bar went with them. Two sections do not need tabs.
 */

import { Mail, Phone, MapPin, Calendar, BadgeCheck, Store } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { DeliveredArt } from '../components/StoryArt';

const POLICIES = [
  ['termsAndConditions', 'Terms and conditions'],
  ['deliveryPolicy', 'Delivery'],
  ['refundPolicy', 'Refunds'],
  ['privacyPolicy', 'Privacy'],
];

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', timeZone: 'Africa/Accra' });
};

function Detail({ Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-ink-4" />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-[0.07em] text-ink-3">{label}</dt>
        <dd className="mt-0.5 text-[14px] text-ink">{children}</dd>
      </div>
    </div>
  );
}

export default function AboutPageClient({ store }) {
  if (!store) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Store className="mx-auto mb-3 h-8 w-8 text-ink-4" />
        <h1 className="text-[19px]">Shop not found</h1>
        <p className="mt-1.5 text-[14px] text-ink-3">This shop could not be loaded.</p>
      </div>
    );
  }

  const whatsapp = store.contactInfo?.whatsappNumber?.replace(/\D/g, '');
  const established = formatDate(store.createdAt);
  const city = store.contactInfo?.address?.city;
  const published = POLICIES.filter(([key]) => store.policies?.[key]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Identity, on a tinted panel with the illustration alongside.
          The art is hidden below `sm`: on a phone it would push the shop's own
          name and description under the fold, and decoration never gets to
          outrank the thing the page is about. */}
      <header className="card relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'var(--brand-soft)' }}
        />

        <div className="relative flex items-center gap-6 p-6 sm:p-7">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {store.storeLogo ? (
              // Owner-supplied URL, often a base64 data URI — next/image would
              // need every possible host allow-listed.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.storeLogo}
                alt=""
                className="h-16 w-16 flex-none rounded-lg border border-hairline object-cover"
              />
            ) : (
              <span
                className="flex h-16 w-16 flex-none items-center justify-center rounded-lg text-[26px] font-bold"
                style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
                aria-hidden
              >
                {store.storeName?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-[26px] leading-tight">{store.storeName}</h1>
              {store.storeDescription && (
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-3">
                  {store.storeDescription}
                </p>
              )}
              {store.verification?.isVerified && (
                <span
                  className="chip mt-2.5"
                  style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}
                >
                  <BadgeCheck className="h-3 w-3" />
                  Verified shop
                </span>
              )}
            </div>
          </div>

          <DeliveredArt className="hidden h-[130px] w-[200px] flex-none text-ink sm:block" />
        </div>
      </header>

      {/* Facts we actually hold */}
      <section className="space-y-3">
        <h2 className="text-[15px]">Shop details</h2>
        <dl className="card divide-y divide-hairline">
          {store.contactInfo?.email && (
            <Detail Icon={Mail} label="Email">
              <a href={`mailto:${store.contactInfo.email}`} className="hover:underline">
                {store.contactInfo.email}
              </a>
            </Detail>
          )}
          {store.contactInfo?.phoneNumber && (
            <Detail Icon={Phone} label="Phone">
              <a href={`tel:${store.contactInfo.phoneNumber}`} className="num hover:underline">
                {store.contactInfo.phoneNumber}
              </a>
            </Detail>
          )}
          {whatsapp && (
            <Detail Icon={WhatsAppIcon} label="WhatsApp">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Message the shop
              </a>
            </Detail>
          )}
          {city && (
            <Detail Icon={MapPin} label="Location">
              {city}
              {store.contactInfo?.address?.region ? `, ${store.contactInfo.address.region}` : ', Ghana'}
            </Detail>
          )}
          {/* The month it opened, not "N days in business" — that phrasing turns
              every young shop into an argument against itself. */}
          {established && (
            <Detail Icon={Calendar} label="Selling since">
              {established}
            </Detail>
          )}
        </dl>
      </section>

      {/* Only what the owner actually wrote. No placeholder policies. */}
      {published.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[15px]">Policies</h2>
          <div className="card divide-y divide-hairline">
            {published.map(([key, label]) => (
              <div key={key} className="px-5 py-4">
                <h3 className="text-[13.5px]">{label}</h3>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-3">
                  {store.policies[key]}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(whatsapp || store.contactInfo?.phoneNumber) && (
        <section className="flex flex-col items-start gap-3 border-t border-hairline pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px]">Questions?</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              Reach {store.storeName} directly — a person answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <span style={{ color: '#25D366' }} className="flex">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                WhatsApp
              </a>
            )}
            {store.contactInfo?.phoneNumber && (
              <a href={`tel:${store.contactInfo.phoneNumber}`} className="btn btn-ghost">
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
