/**
 * Centralised document metadata + structured data helpers.
 *
 * Every page writes its SEO tags through this module so the SPA never leaves
 * duplicate canonical links, robots directives or Open Graph tags behind when
 * the reader navigates between pages.
 */

const MANAGED = 'data-seo'

export interface SeoOptions {
  title: string
  description?: string | null
  /** Path only, for example "/blog/ssd-vs-hdd". Defaults to the current path. */
  canonicalPath?: string
  robots?: string
  type?: 'website' | 'article'
  image?: string | null
  publishedAt?: string | null
  modifiedAt?: string | null
  authorName?: string | null
  section?: string | null
  tags?: string[]
  jsonLd?: Array<Record<string, unknown>>
}

export function siteOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://oremitech.co.ke'
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteOrigin()}${path.startsWith('/') ? '' : '/'}${path}`
}

export function canonicalUrl(path?: string): string {
  const origin = siteOrigin()
  const raw = path && path.startsWith('/') ? path : typeof window !== 'undefined' ? window.location.pathname : '/'
  const withoutHash = raw.split('#')[0]
  const queryIndex = withoutHash.indexOf('?')
  const pathPart = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : ''
  const trimmed = pathPart.length > 1 ? pathPart.replace(/\/+$/, '') : '/'
  return `${origin}${trimmed}${query}`
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    element.setAttribute(MANAGED, 'true')
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function addJsonLd(data: Record<string, unknown>) {
  const script = document.createElement('script')
  script.setAttribute('type', 'application/ld+json')
  script.setAttribute(MANAGED, 'true')
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

export function applySeo(options: SeoOptions): void {
  if (typeof document === 'undefined') return
  const head = document.head

  head.querySelectorAll(`[${MANAGED}]`).forEach((el) => el.remove())
  head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove())

  const origin = siteOrigin()
  const url = canonicalUrl(options.canonicalPath)
  const description = (options.description || '').trim()

  document.title = options.title

  const canonical = document.createElement('link')
  canonical.setAttribute('rel', 'canonical')
  canonical.setAttribute('href', url)
  canonical.setAttribute(MANAGED, 'true')
  head.appendChild(canonical)

  if (description) {
    let metaDescription = head.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)
  }

  setMeta('name', 'robots', options.robots || 'index,follow')

  setMeta('property', 'og:type', options.type || 'website')
  setMeta('property', 'og:title', options.title)
  if (description) setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:site_name', 'OREMITECH')
  setMeta('property', 'og:locale', 'en_KE')
  if (options.image) {
    setMeta('property', 'og:image', absoluteUrl(options.image))
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:image', absoluteUrl(options.image))
  } else {
    setMeta('name', 'twitter:card', 'summary')
  }
  setMeta('name', 'twitter:title', options.title)
  if (description) setMeta('name', 'twitter:description', description)

  if (options.type === 'article') {
    if (options.publishedAt) setMeta('property', 'article:published_time', options.publishedAt)
    if (options.modifiedAt) setMeta('property', 'article:modified_time', options.modifiedAt)
    if (options.authorName) setMeta('property', 'article:author', options.authorName)
    if (options.section) setMeta('property', 'article:section', options.section)
    for (const tag of options.tags || []) {
      if (!tag.trim()) continue
      const tagMeta = document.createElement('meta')
      tagMeta.setAttribute('property', 'article:tag')
      tagMeta.setAttribute('content', tag.trim())
      tagMeta.setAttribute(MANAGED, 'true')
      head.appendChild(tagMeta)
    }
  }

  for (const entry of options.jsonLd || []) addJsonLd(entry)
}

export interface ArticleSchemaInput {
  title: string
  description: string
  slug: string
  image?: string | null
  publishedAt?: string | null
  modifiedAt?: string | null
  authorName?: string | null
  section?: string | null
  tags?: string[]
}

export function buildArticleJsonLd(article: ArticleSchemaInput): Record<string, unknown> {
  const origin = siteOrigin()
  const url = `${origin}/blog/${article.slug}`
  const logo = `${origin}/logo.svg`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title.slice(0, 110),
    description: article.description,
    image: article.image ? [absoluteUrl(article.image)] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.modifiedAt || article.publishedAt || undefined,
    author: {
      '@type': 'Person',
      name: article.authorName || 'OREMITECH Editorial',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OREMITECH',
      url: origin,
      logo: { '@type': 'ImageObject', url: logo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: article.section || undefined,
    keywords: article.tags && article.tags.length > 0 ? article.tags.join(', ') : undefined,
    inLanguage: 'en-KE',
  }
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildFaqJsonLd(faq: Array<{ question: string; answer: string }>): Record<string, unknown> | null {
  const entries = faq.filter((entry) => entry.question.trim() && entry.answer.trim())
  if (entries.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: entry.answer.trim() },
    })),
  }
}

export function buildBlogListingJsonLd(
  name: string,
  description: string,
  path: string,
  articles: Array<{ title: string; slug: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: 'OREMITECH', url: siteOrigin() },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.slice(0, 20).map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteOrigin()}/blog/${article.slug}`,
        name: article.title,
      })),
    },
  }
}
