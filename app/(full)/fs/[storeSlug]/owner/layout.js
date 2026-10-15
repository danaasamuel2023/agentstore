/**
 * Wraps everything under /{slug}/owner/* in the OwnerAuthProvider so the
 * dashboard can hydrate from a silent refresh on cold start. The login
 * page itself is fine inside this provider — it just won't have an owner
 * to show until the form submits.
 *
 * No guard is applied here; dashboard pages each call useOwnerAuth() and
 * redirect themselves so the login page can render unguarded.
 */

// OwnerAuthProvider now lives one level up in [storeSlug]/layout.js so
// the storefront TopNav can read owner state too. This layout is kept as
// a pass-through to preserve the route boundary.

export default function OwnerLayout({ children }) {
  return children;
}
