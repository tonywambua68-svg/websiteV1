/** Shared, dependency-free helpers for the OREMITECH Knowledge Centre. */

const WORDS_PER_MINUTE = 200

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function wordCount(html: string): number {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function readingMinutes(html: string, stored?: number | null): number {
  if (stored && stored > 0) return stored
  return Math.max(1, Math.ceil(wordCount(html) / WORDS_PER_MINUTE))
}

export function formatArticleDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function isUpdated(createdOrPublished: string | null | undefined, updated: string | null | undefined): boolean {
  if (!createdOrPublished || !updated) return false
  const a = new Date(createdOrPublished).getTime()
  const b = new Date(updated).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  return b - a > 24 * 60 * 60 * 1000
}

export function articleExcerpt(excerpt: string | null | undefined, content: string, max = 180): string {
  const source = (excerpt || '').trim() || stripHtml(content)
  if (source.length <= max) return source
  return `${source.slice(0, max).trimEnd()}…`
}

export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)
}

export function matchesQuery(
  article: { title: string; excerpt: string; content: string; tags?: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [article.title, article.excerpt, stripHtml(article.content), (article.tags || []).join(' ')]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((term) => haystack.includes(term))
}
