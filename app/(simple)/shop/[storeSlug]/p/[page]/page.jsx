import { notFound } from 'next/navigation';
import CustomDesignPage from '../../components/CustomDesignPage';
import { fetchCustomDesign } from '@/lib/customDesign.server';
import { cleanPreviewToken, customShell, SITE_PREVIEW_PARAM } from '@/lib/customDesign';

/**
 * Extra pages of a store's shared custom design: /shop/<slug>/p/<page>
 * (About, FAQ, Help, … — whatever the agent's design has). 404 when the store
 * has no custom design or no such page.
 */
const PAGE = /^[a-z0-9-]{1,40}$/;

async function load(params, searchParams) {
  const { storeSlug, page } = await params;
  const sp = (await searchParams) || {};
  const previewToken = cleanPreviewToken(sp[SITE_PREVIEW_PARAM]);
  if (!PAGE.test(String(page || ''))) return { design: null, entry: null, previewToken };
  const design = await fetchCustomDesign(storeSlug, previewToken);
  return { design, entry: design?.pages?.[`/${page}`] || null, previewToken };
}

export async function generateMetadata({ params, searchParams }) {
  const { entry } = await load(params, searchParams);
  if (!entry) return { title: 'Page not found' };
  return { title: entry.title || undefined, description: entry.description || undefined };
}

export default async function CustomPage({ params, searchParams }) {
  const { design, entry, previewToken } = await load(params, searchParams);
  if (!entry) notFound();
  return <CustomDesignPage design={customShell(design)} page={entry} preview={!!previewToken} />;
}
