import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { BlogArticle, BlogCategory, BlogFaqItem } from '@/lib/domain'
import { slugify } from '@/lib/commerce'

const CATEGORY_SELECT = `
  id, name, slug, description, seo_title, seo_description, seo_focus_keyword,
  seo_social_title, seo_social_description, sort_order, is_active, created_at, updated_at
`

function normalizeFaq(value: unknown): BlogFaqItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      const record = entry as { question?: unknown; answer?: unknown }
      return {
        question: typeof record.question === 'string' ? record.question : '',
        answer: typeof record.answer === 'string' ? record.answer : '',
      }
    })
    .filter((entry) => entry.question.trim() && entry.answer.trim())
}

export function normalizeArticle(row: Record<string, unknown>): BlogArticle {
  return {
    ...(row as unknown as BlogArticle),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    faq: normalizeFaq(row.faq),
    related_product_ids: Array.isArray(row.related_product_ids) ? (row.related_product_ids as string[]) : [],
    is_featured: Boolean(row.is_featured),
    reading_minutes: row.reading_minutes == null ? null : Number(row.reading_minutes),
  }
}

interface FetchArticlesParams {
  status?: 'all' | 'published' | 'draft' | 'scheduled' | 'archived'
  categoryId?: string
  featuredOnly?: boolean
  limit?: number
}

interface BlogState {
  articles: BlogArticle[]
  categories: BlogCategory[]
  loading: boolean
  error: string | null

  // Categories
  fetchCategories: () => Promise<void>
  createCategory: (data: Partial<BlogCategory>) => Promise<BlogCategory | null>
  updateCategory: (id: string, data: Partial<BlogCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Articles
  fetchArticles: (params?: FetchArticlesParams) => Promise<void>
  fetchArticleBySlug: (slug: string) => Promise<BlogArticle | null>
  fetchArticleById: (id: string) => Promise<BlogArticle | null>
  fetchRelatedArticles: (article: BlogArticle, limit?: number) => Promise<BlogArticle[]>
  createArticle: (data: Partial<BlogArticle>) => Promise<BlogArticle | null>
  updateArticle: (id: string, data: Partial<BlogArticle>) => Promise<void>
  deleteArticle: (id: string) => Promise<void>
  publishArticle: (id: string) => Promise<void>
  unpublishArticle: (id: string) => Promise<void>
  scheduleArticle: (id: string, scheduledAt: string) => Promise<void>

  clearError: () => void
}

function articlePayload(data: Partial<BlogArticle>) {
  const payload: Record<string, unknown> = {}
  if (data.title !== undefined) payload.title = data.title
  if (data.slug !== undefined) payload.slug = data.slug
  if (data.excerpt !== undefined) payload.excerpt = data.excerpt || ''
  if (data.content !== undefined) payload.content = data.content || ''
  if (data.featured_image_url !== undefined) payload.featured_image_url = data.featured_image_url || null
  if (data.featured_image_alt !== undefined) payload.featured_image_alt = data.featured_image_alt || null
  if (data.category_id !== undefined) payload.category_id = data.category_id || null
  if (data.author_name !== undefined) payload.author_name = data.author_name || null
  if (data.is_featured !== undefined) payload.is_featured = Boolean(data.is_featured)
  if (data.tags !== undefined) payload.tags = data.tags
  if (data.faq !== undefined) payload.faq = data.faq
  if (data.related_product_ids !== undefined) payload.related_product_ids = data.related_product_ids
  if (data.reading_minutes !== undefined) payload.reading_minutes = data.reading_minutes
  if (data.seo_title !== undefined) payload.seo_title = data.seo_title || null
  if (data.seo_description !== undefined) payload.seo_description = data.seo_description || null
  if (data.seo_focus_keyword !== undefined) payload.seo_focus_keyword = data.seo_focus_keyword || null
  if (data.seo_secondary_keywords !== undefined) payload.seo_secondary_keywords = data.seo_secondary_keywords || null
  if (data.seo_social_title !== undefined) payload.seo_social_title = data.seo_social_title || null
  if (data.seo_social_description !== undefined) payload.seo_social_description = data.seo_social_description || null
  return payload
}

export const useBlogStore = create<BlogState>((set, get) => ({
  articles: [],
  categories: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCategories: async () => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order')
      if (error) throw error
      set({ categories: (data || []) as BlogCategory[] })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load categories' })
    }
  },

  createCategory: async (data) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const slug = data.slug || slugify(data.name || '')
      const { data: result, error } = await supabase
        .from('blog_categories')
        .insert({
          name: data.name,
          slug,
          description: data.description || '',
          seo_title: data.seo_title || null,
          seo_description: data.seo_description || null,
          sort_order: data.sort_order ?? 0,
          is_active: data.is_active ?? true,
        })
        .select()
        .single()
      if (error) throw error
      set((state) => ({ categories: [...state.categories, result as BlogCategory] }))
      return result as BlogCategory
    } catch (err: any) {
      set({ error: err.message || 'Failed to create category' })
      return null
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const updates: Record<string, unknown> = {}
      if (data.name !== undefined) updates.name = data.name
      if (data.slug !== undefined) updates.slug = data.slug
      if (data.description !== undefined) updates.description = data.description
      if (data.seo_title !== undefined) updates.seo_title = data.seo_title || null
      if (data.seo_description !== undefined) updates.seo_description = data.seo_description || null
      if (data.sort_order !== undefined) updates.sort_order = data.sort_order
      if (data.is_active !== undefined) updates.is_active = data.is_active
      const { error } = await supabase.from('blog_categories').update(updates).eq('id', id)
      if (error) throw error
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? ({ ...c, ...updates } as BlogCategory) : c)),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update category' })
    }
  },

  deleteCategory: async (id) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('blog_categories').delete().eq('id', id)
      if (error) throw error
      set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete category' })
    }
  },

  fetchArticles: async (params) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      let query = supabase
        .from('blog_articles')
        .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
        .order('published_at', { ascending: false, nullsFirst: false })

      if (params?.status && params.status !== 'all') {
        query = query.eq('publication_status', params.status)
      }
      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId)
      }
      if (params?.featuredOnly) {
        query = query.eq('is_featured', true)
      }
      if (params?.limit && params.limit > 0) {
        query = query.limit(params.limit)
      }

      const { data, error } = await query
      if (error) throw error
      set({ articles: (data || []).map((row) => normalizeArticle(row as Record<string, unknown>)), loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load articles', loading: false })
    }
  },

  fetchArticleBySlug: async (slug) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('blog_articles')
        .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      set({ loading: false })
      return data ? normalizeArticle(data as Record<string, unknown>) : null
    } catch (err: any) {
      set({ error: err.message || 'Failed to load article', loading: false })
      return null
    }
  },

  fetchArticleById: async (id) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('blog_articles')
        .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data ? normalizeArticle(data as Record<string, unknown>) : null
    } catch (err: any) {
      set({ error: err.message || 'Failed to load article' })
      return null
    }
  },

  fetchRelatedArticles: async (article, limit = 3) => {
    try {
      const supabase = getSupabase()
      if (!supabase) return []
      let query = supabase
        .from('blog_articles')
        .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
        .eq('publication_status', 'published')
        .neq('id', article.id)
        .order('published_at', { ascending: false })
        .limit(limit)
      if (article.category_id) query = query.eq('category_id', article.category_id)
      const { data, error } = await query
      if (error || !data || data.length === 0) {
        const { data: fallback } = await supabase
          .from('blog_articles')
          .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
          .eq('publication_status', 'published')
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .limit(limit)
        return (fallback || []).map((row) => normalizeArticle(row as Record<string, unknown>))
      }
      return data.map((row) => normalizeArticle(row as Record<string, unknown>))
    } catch {
      return []
    }
  },

  createArticle: async (data) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const now = new Date().toISOString()
      const slug = data.slug || slugify(data.title || '')
      const insertData: Record<string, unknown> = {
        ...articlePayload(data),
        title: data.title,
        slug,
        publication_status: data.publication_status || 'draft',
        created_at: now,
        updated_at: now,
      }
      if (data.publication_status === 'published') insertData.published_at = now
      if (data.publication_status === 'scheduled' && data.scheduled_at) insertData.scheduled_at = data.scheduled_at

      const { data: result, error } = await supabase
        .from('blog_articles')
        .insert(insertData)
        .select(`*, category:blog_categories (${CATEGORY_SELECT})`)
        .single()
      if (error) throw error
      const article = normalizeArticle(result as Record<string, unknown>)
      set((state) => ({ articles: [article, ...state.articles] }))
      return article
    } catch (err: any) {
      set({ error: err.message || 'Failed to create article' })
      return null
    }
  },

  updateArticle: async (id, data) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const updates: Record<string, unknown> = { ...articlePayload(data), updated_at: new Date().toISOString() }
      if (data.publication_status !== undefined) {
        updates.publication_status = data.publication_status
        if (data.publication_status !== 'published' && data.publication_status !== 'scheduled') {
          updates.published_at = null
        }
      }
      if (data.published_at !== undefined) updates.published_at = data.published_at || null
      if (data.scheduled_at !== undefined) updates.scheduled_at = data.scheduled_at || null

      const { error } = await supabase.from('blog_articles').update(updates).eq('id', id)
      if (error) throw error
      set((state) => ({
        articles: state.articles.map((a) => (a.id === id ? ({ ...a, ...updates } as BlogArticle) : a)),
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update article' })
    }
  },

  deleteArticle: async (id) => {
    set({ error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('blog_articles').delete().eq('id', id)
      if (error) throw error
      set((state) => ({ articles: state.articles.filter((a) => a.id !== id) }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete article' })
    }
  },

  publishArticle: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('blog_articles')
      .update({ publication_status: 'published', published_at: now, scheduled_at: null, updated_at: now })
      .eq('id', id)
    if (error) throw error
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, publication_status: 'published', published_at: now, scheduled_at: null } : a,
      ),
    }))
  },

  unpublishArticle: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('blog_articles')
      .update({ publication_status: 'draft', published_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    set((state) => ({
      articles: state.articles.map((a) => (a.id === id ? { ...a, publication_status: 'draft', published_at: null } : a)),
    }))
  },

  scheduleArticle: async (id, scheduledAt) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('blog_articles')
      .update({
        publication_status: 'scheduled',
        scheduled_at: scheduledAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, publication_status: 'scheduled', scheduled_at: scheduledAt } : a,
      ),
    }))
  },
}))

