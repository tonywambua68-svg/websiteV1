/**
 * Cloudflare Pages Function: dynamic /sitemap.xml
 *
 * Includes only public, published content:
 *   - core pages
 *   - active knowledge-centre categories
 *   - published blog articles
 *   - published products
 *
 * Drafts, scheduled and archived articles are excluded by the query filters.
 *
 * Requires the Pages project environment variables SUPABASE_URL and
 * SUPABASE_ANON_KEY (the VITE_ prefixed names are also accepted). The anon key
 * is safe here: it is the same public key shipped to the browser and Row Level
 * Security still restricts reads to published rows.
 */

const CORE_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
]

function isoDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function rest(env, path) {
  const base = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) return []
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function onRequest(context) {
  const { env } = context
  const site = (env.SITE_URL || 'https://oremitech.co.ke').replace(/\/+$/, '')

  const [articles, categories, products] = await Promise.all([
    rest(
      env,
      'blog_articles?select=slug,updated_at,published_at&publication_status=eq.published&order=published_at.desc&limit=2000',
    ),
    rest(env, 'blog_categories?select=slug,updated_at&is_active=eq.true&order=sort_order.asc'),
    rest(env, 'catalogue_products?select=slug,published_at&order=published_at.desc&limit=5000'),
  ])

  const entries = []

  for (const page of CORE_PAGES) {
    entries.push({ loc: `${site}${page.path}`, changefreq: page.changefreq, priority: page.priority })
  }

  for (const category of categories) {
    if (!category.slug) continue
    entries.push({
      loc: `${site}/blog?category=${encodeURIComponent(category.slug)}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: category.updated_at || undefined,
    })
  }

  for (const article of articles) {
    if (!article.slug) continue
    entries.push({
      loc: `${site}/blog/${article.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: article.updated_at || article.published_at || undefined,
    })
  }

  for (const product of products) {
    if (!product.slug) continue
    entries.push({
      loc: `${site}/product/${product.slug}`,
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: product.published_at || undefined,
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${isoDate(entry.lastmod) ? `\n    <lastmod>${isoDate(entry.lastmod)}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  })
}
