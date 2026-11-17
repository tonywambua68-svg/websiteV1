import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { BlogArticle, BlogCategory } from '@/lib/domain'
import { slugify } from '@/lib/commerce'

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
  fetchArticles: (params?: { status?: 'all' | 'published' | 'draft' | 'scheduled' | 'archived'; categoryId?: string }) => Promise<void>
  fetchArticleBySlug: (slug: string) => Promise<BlogArticle | null>
  createArticle: (data: Partial<BlogArticle>) => Promise<BlogArticle | null>
  updateArticle: (id: string, data: Partial<BlogArticle>) => Promise<void>
  deleteArticle: (id: string) => Promise<void>
  publishArticle: (id: string) => Promise<void>
  unpublishArticle: (id: string) => Promise<void>
  scheduleArticle: (id: string, scheduledAt: string) => Promise<void>

  clearError: () => void
}

export const useBlogStore = create<BlogState>((set, get) => ({
  articles: [],
  categories: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('sort_order')
      if (error) throw error
      set({ categories: (data || []) as BlogCategory[], loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load categories', loading: false })
    }
  },

  createCategory: async (data) => {
    set({ loading: true, error: null })
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
      set((state) => ({ categories: [...state.categories, result as BlogCategory], loading: false }))
      return result as BlogCategory
    } catch (err: any) {
      set({ error: err.message || 'Failed to create category', loading: false })
      return null
    }
  },

  updateCategory: async (id, data) => {
    set({ loading: true, error: null })
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
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } as BlogCategory : c)),
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update category', loading: false })
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('blog_categories').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete category', loading: false })
    }
  },

  fetchArticles: async (params) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      let query = supabase.from('blog_articles').select(`
        *,
        blog_categories (
          id, name, slug, description, seo_title, seo_description, seo_focus_keyword,
          seo_social_title, seo_social_description, sort_order, is_active, created_at, updated_at
        )
      `).order('created_at', { ascending: false })

      if (params?.status && params.status !== 'all') {
        query = query.eq('publication_status', params.status)
      }
      if (params?.categoryId) {
        query = query.eq('category_id', params.categoryId)
      }

      const { data, error } = await query
      if (error) throw error
      set({ articles: (data || []) as BlogArticle[], loading: false })
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
        .select(`
          *,
          blog_categories (
            id, name, slug, description, seo_title, seo_description, seo_focus_keyword,
            seo_social_title, seo_social_description, sort_order, is_active, created_at, updated_at
          )
        `)
        .eq('slug', slug)
        .single()
      if (error) throw error
      set({ loading: false })
      return data as BlogArticle
    } catch (err: any) {
      set({ error: err.message || 'Failed to load article', loading: false })
      return null
    }
  },

  createArticle: async (data) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const slug = data.slug || slugify(data.title || '')
      const now = new Date().toISOString()
      const insertData: Record<string, unknown> = {
        title: data.title,
        slug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        featured_image_url: data.featured_image_url || null,
        featured_image_alt: data.featured_image_alt || null,
        category_id: data.category_id || null,
        author_id: data.author_id || null,
        seo_title: data.seo_title || null,
        seo_description: data.seo_description || null,
        seo_focus_keyword: data.seo_focus_keyword || null,
        seo_secondary_keywords: data.seo_secondary_keywords || null,
        seo_social_title: data.seo_social_title || null,
        seo_social_description: data.seo_social_description || null,
        publication_status: data.publication_status || 'draft',
        created_at: now,
        updated_at: now,
      }
      if (data.publication_status === 'published') {
        insertData.published_at = now
      }
      if (data.publication_status === 'scheduled' && data.scheduled_at) {
        insertData.scheduled_at = data.scheduled_at
      }
      const { data: result, error } = await supabase
        .from('blog_articles')
        .insert(insertData)
        .select(`
          *,
          blog_categories (
            id, name, slug, description, seo_title, seo_description, seo_focus_keyword,
            seo_social_title, seo_social_description, sort_order, is_active, created_at, updated_at
          )
        `)
        .single()
      if (error) throw error
      set((state) => ({ articles: [result as BlogArticle, ...state.articles], loading: false }))
      return result as BlogArticle
    } catch (err: any) {
      set({ error: err.message || 'Failed to create article', loading: false })
      return null
    }
  },

  updateArticle: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.title !== undefined) updates.title = data.title
      if (data.slug !== undefined) updates.slug = data.slug
      if (data.excerpt !== undefined) updates.excerpt = data.excerpt
      if (data.content !== undefined) updates.content = data.content
      if (data.featured_image_url !== undefined) updates.featured_image_url = data.featured_image_url || null
      if (data.featured_image_alt !== undefined) updates.featured_image_alt = data.featured_image_alt || null
      if (data.category_id !== undefined) updates.category_id = data.category_id || null
      if (data.seo_title !== undefined) updates.seo_title = data.seo_title || null
      if (data.seo_description !== undefined) updates.seo_description = data.seo_description || null
      if (data.seo_focus_keyword !== undefined) updates.seo_focus_keyword = data.seo_focus_keyword || null
      if (data.seo_secondary_keywords !== undefined) updates.seo_secondary_keywords = data.seo_secondary_keywords || null
      if (data.seo_social_title !== undefined) updates.seo_social_title = data.seo_social_title || null
      if (data.seo_social_description !== undefined) updates.seo_social_description = data.seo_social_description || null
      if (data.publication_status !== undefined) {
        updates.publication_status = data.publication_status
        if (data.publication_status === 'published' && !updates.published_at) {
          updates.published_at = new Date().toISOString()
        }
        if (data.publication_status !== 'published') {
          updates.published_at = null
        }
      }
      if (data.scheduled_at !== undefined) updates.scheduled_at = data.scheduled_at || null

      const { error } = await supabase.from('blog_articles').update(updates).eq('id', id)
      if (error) throw error
      set((state) => ({
        articles: state.articles.map((a) => (a.id === id ? { ...a, ...updates } as BlogArticle : a)),
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to update article', loading: false })
    }
  },

  deleteArticle: async (id) => {
    set({ loading: true, error: null })
    try {
      const supabase = getSupabase()
      if (!supabase) throw new Error('Supabase not configured')
      const { error } = await supabase.from('blog_articles').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        articles: state.articles.filter((a) => a.id !== id),
        loading: false,
      }))
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete article', loading: false })
    }
  },

  publishArticle: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('blog_articles')
      .update({
        publication_status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, publication_status: 'published', published_at: new Date().toISOString() } : a
      ),
    }))
  },

  unpublishArticle: async (id) => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase
      .from('blog_articles')
      .update({
        publication_status: 'draft',
        published_at: null,
        updated_at: new Date().toISOString(),
      })
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
        a.id === id ? { ...a, publication_status: 'scheduled', scheduled_at: scheduledAt } : a
      ),
    }))
  },
}))
