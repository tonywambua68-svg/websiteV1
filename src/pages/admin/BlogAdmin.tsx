import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useBlogStore } from '@/store/blogStore'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { SeoPreview, SeoCompletenessIndicator } from '@/components/seo/SeoComponents'
import { parseTags, readingMinutes } from '@/lib/blog'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Save,
  ArrowLeft,
  Upload,
  Image,
  ExternalLink,
  Star,
  Loader2,
} from 'lucide-react'
import type { BlogArticle, BlogCategory, BlogFaqItem } from '@/lib/domain'
import { slugify } from '@/lib/commerce'

interface ProductOption {
  id: string
  slug: string
  name: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted/10 text-muted border-border-line',
  published: 'bg-teal/10 text-tealdeep border-teal/30',
  scheduled: 'bg-amber/10 text-amberdeep border-amber/30',
  archived: 'bg-error/10 text-error border-error/30',
}

export default function BlogAdmin() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const isCreating = location.pathname.replace(/\/+$/, '').endsWith('/admin/blog/new')
  const { user } = useAuthStore()
  const settings = useSettingsStore((state) => state.settings)
  const {
    articles,
    categories,
    loading,
    error,
    clearError,
    fetchCategories,
    fetchArticles,
    createCategory,
    updateCategory,
    deleteCategory,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    unpublishArticle,
    scheduleArticle,
  } = useBlogStore()

  const [tab, setTab] = useState<'articles' | 'categories'>('articles')
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [articleForm, setArticleForm] = useState<Partial<BlogArticle>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    featured_image_alt: '',
    category_id: null,
    author_name: 'OREMITECH Editorial',
    is_featured: false,
    tags: [],
    faq: [],
    related_product_ids: [],
    seo_title: '',
    seo_description: '',
    seo_focus_keyword: '',
    seo_secondary_keywords: '',
    seo_social_title: '',
    seo_social_description: '',
    publication_status: 'draft',
    scheduled_at: null,
  })
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: '',
    seo_title: '',
    seo_description: '',
    sort_order: '0',
    is_active: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchArticles({ status: 'all' })
  }, [fetchCategories, fetchArticles])

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return
    supabase
      .from('catalogue_products')
      .select('id, slug, name')
      .order('name', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setProductOptions((data || []) as ProductOption[])
      })
  }, [])

  useEffect(() => {
    if (id) {
      const existing = articles.find((a) => a.id === id)
      if (existing) {
        setEditMode(true)
        setEditingId(id)
        setArticleForm({
          title: existing.title,
          slug: existing.slug,
          excerpt: existing.excerpt,
          content: existing.content,
          featured_image_url: existing.featured_image_url || '',
          featured_image_alt: existing.featured_image_alt || '',
          category_id: existing.category_id,
          author_name: existing.author_name || 'OREMITECH Editorial',
          is_featured: Boolean(existing.is_featured),
          tags: existing.tags || [],
          faq: existing.faq || [],
          related_product_ids: existing.related_product_ids || [],
          seo_title: existing.seo_title || '',
          seo_description: existing.seo_description || '',
          seo_focus_keyword: existing.seo_focus_keyword || '',
          seo_secondary_keywords: existing.seo_secondary_keywords || '',
          seo_social_title: existing.seo_social_title || '',
          seo_social_description: existing.seo_social_description || '',
          publication_status: existing.publication_status,
          published_at: existing.published_at,
          scheduled_at: existing.scheduled_at,
        })
        setCatForm({
          name: existing.title,
          slug: existing.slug,
          description: existing.excerpt,
          seo_title: existing.seo_title || '',
          seo_description: existing.seo_description || '',
          sort_order: '0',
          is_active: true,
        })
      } else {
        fetchArticles({ status: 'all' }).then(() => {
          const found = articles.find((a) => a.id === id)
          if (found) {
            setEditMode(true)
            setEditingId(id)
            setArticleForm({
              title: found.title,
              slug: found.slug,
              excerpt: found.excerpt,
              content: found.content,
              featured_image_url: found.featured_image_url || '',
              featured_image_alt: found.featured_image_alt || '',
              category_id: found.category_id,
              author_name: found.author_name || 'OREMITECH Editorial',
              is_featured: Boolean(found.is_featured),
              tags: found.tags || [],
              faq: found.faq || [],
              related_product_ids: found.related_product_ids || [],
              seo_title: found.seo_title || '',
              seo_description: found.seo_description || '',
              seo_focus_keyword: found.seo_focus_keyword || '',
              seo_secondary_keywords: found.seo_secondary_keywords || '',
              seo_social_title: found.seo_social_title || '',
              seo_social_description: found.seo_social_description || '',
              publication_status: found.publication_status,
              published_at: found.published_at,
              scheduled_at: found.scheduled_at,
            })
          } else {
            setMessage('Article not found')
            navigate('/admin/blog')
          }
        })
      }
    }
  }, [id, articles, fetchArticles, navigate])

  const handleTitleChange = (val: string) => {
    setArticleForm((prev) => ({ ...prev, title: val, slug: prev.slug || slugify(val) }))
    setCatForm((prev) => ({ ...prev, name: val }))
  }

  const handleSlugChange = (val: string) => {
    setArticleForm((prev) => ({ ...prev, slug: slugify(val) }))
    setCatForm((prev) => ({ ...prev, slug: val }))
  }

  const handleBodyImageUpload = async (file: File | undefined) => {
    if (!file) return
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Database not configured. Cannot upload images.')
      return
    }
    setUploadingImage(true)
    setMessage(null)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      const alt =
        window.prompt('Describe this image for readers (alt text):', file.name.replace(/\.[^/.]+$/, '')) || ''
      const caption = window.prompt('Optional caption (leave blank for none):', '') || ''
      const figure = `<figure><img src="${urlData.publicUrl}" alt="${alt.replace(/"/g, '&quot;')}">${
        caption ? `<figcaption>${caption}</figcaption>` : ''
      }</figure>`
      setArticleForm((prev) => ({ ...prev, content: `${prev.content || ''}${figure}` }))
      setMessage('Image added to the end of the article. Drag the block if you need it elsewhere.')
    } catch (err: any) {
      setMessage(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return
    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Database not configured. Cannot upload images.')
      return
    }
    setUploadingImage(true)
    setMessage(null)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      setArticleForm((prev) => ({
        ...prev,
        featured_image_url: urlData.publicUrl,
        featured_image_alt: prev.featured_image_alt || prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }))
      setMessage('Image uploaded. Add descriptive alt text, then save the article.')
    } catch (err: any) {
      setMessage(err.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const articlePayload = () => ({
    title: articleForm.title,
    slug: articleForm.slug || slugify(articleForm.title || ''),
    excerpt: articleForm.excerpt,
    content: articleForm.content,
    featured_image_url: articleForm.featured_image_url || null,
    featured_image_alt: articleForm.featured_image_alt || null,
    category_id: articleForm.category_id,
    author_name: articleForm.author_name || 'OREMITECH Editorial',
    is_featured: Boolean(articleForm.is_featured),
    tags: articleForm.tags || [],
    faq: (articleForm.faq || []).filter((entry) => entry.question.trim() && entry.answer.trim()),
    related_product_ids: articleForm.related_product_ids || [],
    reading_minutes: readingMinutes(articleForm.content || ''),
    seo_title: articleForm.seo_title || null,
    seo_description: articleForm.seo_description || null,
    seo_focus_keyword: articleForm.seo_focus_keyword || null,
    seo_secondary_keywords: articleForm.seo_secondary_keywords || null,
    seo_social_title: articleForm.seo_social_title || null,
    seo_social_description: articleForm.seo_social_description || null,
    publication_status: (articleForm.publication_status as BlogArticle['publication_status']) || 'draft',
    published_at:
      articleForm.published_at ||
      (articleForm.publication_status === 'published' ? new Date().toISOString() : null),
    scheduled_at: articleForm.publication_status === 'scheduled' ? articleForm.scheduled_at || null : null,
  })

  const handleCreateArticle = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const effectiveStatus = articleForm.publication_status || 'draft'
      if (effectiveStatus === 'scheduled' && !articleForm.scheduled_at) {
        setMessage('Choose a date and time for scheduled publication.')
        setSubmitting(false)
        return
      }
      if (effectiveStatus === 'published' && !canPublish) {
        setMessage('Only an owner or manager can publish articles.')
        setSubmitting(false)
        return
      }
      const result = await createArticle({ ...articlePayload(), publication_status: effectiveStatus })
      if (result) {
        setMessage('Article created successfully')
        setEditMode(false)
        setEditingId(null)
        navigate(`/admin/blog/edit/${result.id}`)
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to create article')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateArticle = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setSubmitting(true)
    setMessage(null)
    try {
      const effectiveStatus = articleForm.publication_status || 'draft'
      if (effectiveStatus === 'scheduled' && !articleForm.scheduled_at) {
        setMessage('Choose a date and time for scheduled publication.')
        setSubmitting(false)
        return
      }
      if (effectiveStatus === 'published' && !canPublish) {
        setMessage('Only an owner or manager can publish articles.')
        setSubmitting(false)
        return
      }
      await updateArticle(editingId, { ...articlePayload(), publication_status: effectiveStatus })
      setMessage('Article updated successfully')
    } catch (err: any) {
      setMessage(err.message || 'Failed to update article')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async () => {
    if (!editingId) return
    try {
      await publishArticle(editingId)
      setMessage('Article published')
    } catch (err: any) {
      setMessage(err.message || 'Failed to publish')
    }
  }

  const handleUnpublish = async () => {
    if (!editingId) return
    try {
      await unpublishArticle(editingId)
      setMessage('Article unpublished')
    } catch (err: any) {
      setMessage(err.message || 'Failed to unpublish')
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    try {
      if (tab === 'articles') {
        await deleteArticle(showDeleteConfirm)
      } else {
        await deleteCategory(showDeleteConfirm)
      }
      setShowDeleteConfirm(null)
      setMessage('Deleted successfully')
    } catch (err: any) {
      setMessage(err.message || 'Failed to delete')
    }
  }

  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createCategory({
        name: catForm.name,
        slug: catForm.slug || slugify(catForm.name),
        description: catForm.description,
        seo_title: catForm.seo_title || null,
        seo_description: catForm.seo_description || null,
        sort_order: Number(catForm.sort_order) || 0,
        is_active: catForm.is_active,
      })
      setCatForm({
        name: '',
        slug: '',
        description: '',
        seo_title: '',
        seo_description: '',
        sort_order: '0',
        is_active: true,
      })
      setMessage('Category created')
    } catch (err: any) {
      setMessage(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const canPublish = user?.role === 'owner' || user?.role === 'manager'

  const fullTitle = articleForm.seo_title || articleForm.title || 'OREMITECH Blog'
  const fullDescription = articleForm.seo_description || articleForm.excerpt || ''

  return (
    <AdminLayout title="Blog Management" subtitle="Create and manage blog articles and categories.">
      <div className="wrap py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Blog Management</h1>
            <p className="text-sm text-muted">Create and manage blog articles and categories.</p>
          </div>
          {!editingId && !isCreating && (
            <Link
              to="/admin/blog/new"
              className="inline-flex items-center gap-1.5 btn btn-emerald btn-sm"
            >
              <Plus className="h-3.5 w-3.5" /> New Article
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-xs underline hover:text-error"
            >
              Dismiss
            </button>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-teal/10 border border-teal/20 text-tealdeep text-sm">
            {message}
          </div>
        )}

        <div className="flex gap-4 mb-6 border-b border-line pb-4">
          <button
            onClick={() => setTab('articles')}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
              tab === 'articles' ? 'border-emerald text-emerald' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Articles ({articles.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
              tab === 'categories' ? 'border-emerald text-emerald' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {tab === 'articles' ? (
          <>
            {editingId || isCreating ? (
              <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="font-display text-lg font-bold text-ink">
                    {editingId ? 'Edit Article' : 'New Article'}
                  </h2>
                  <div className="flex items-center gap-3">
                    {editingId && (
                      <Link
                        to={`/admin/blog/preview/${editingId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Link>
                    )}
                    <Link
                      to="/admin/blog"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to list
                    </Link>
                  </div>
                </div>

                <form onSubmit={editingId ? handleUpdateArticle : handleCreateArticle} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Title *</label>
                      <input
                        type="text"
                        value={articleForm.title || ''}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Best laptops for university students in Kenya"
                        className="input w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Slug *</label>
                      <input
                        type="text"
                        value={articleForm.slug || ''}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="best-laptops-university-students-kenya"
                        className="input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted">Excerpt *</label>
                    <textarea
                      value={articleForm.excerpt || ''}
                      onChange={(e) =>
                        setArticleForm((prev) => ({ ...prev, excerpt: e.target.value }))
                      }
                      rows={3}
                      placeholder="Short summary shown in blog listings and search results"
                      className="input w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted">Featured Image</label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={articleForm.featured_image_url || ''}
                        onChange={(e) =>
                          setArticleForm((prev) => ({ ...prev, featured_image_url: e.target.value }))
                        }
                        placeholder="https://..."
                        className="input min-w-0 flex-1 text-xs"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-ink hover:border-emerald">
                        {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={articleForm.featured_image_alt || ''}
                      onChange={(e) =>
                        setArticleForm((prev) => ({ ...prev, featured_image_alt: e.target.value }))
                      }
                      placeholder="Descriptive alt text (required for accessibility and SEO)"
                      className="input w-full text-xs"
                    />
                    {articleForm.featured_image_url && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-mist/40 p-2">
                        <img
                          src={articleForm.featured_image_url}
                          alt={articleForm.featured_image_alt || 'Featured image preview'}
                          className="h-16 w-24 rounded object-cover"
                        />
                        <p className="text-[10px] text-muted">
                          Recommended: 1600×900 or larger, compressed JPEG/WebP. Use a descriptive file name.
                        </p>
                      </div>
                    )}
                    {!articleForm.featured_image_alt && articleForm.featured_image_url && (
                      <p className="text-[10px] font-bold text-amberdeep">
                        Add alt text describing the image. Never use keyword lists.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-muted">Content *</label>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold text-ink hover:border-emerald">
                        {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Image className="h-3.5 w-3.5" />}
                        Upload image into article
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBodyImageUpload(e.target.files?.[0])}
                        />
                      </label>
                    </div>
                    <RichTextEditor
                      value={articleForm.content || ''}
                      onChange={(val) =>
                        setArticleForm((prev) => ({ ...prev, content: val }))
                      }
                    />
                    <p className="text-[10px] text-muted">
                      Use H2 and H3 for structure. Link to products and other guides with the link tool. External sources
                      should be linked in a references section.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Category</label>
                      <select
                        value={articleForm.category_id || ''}
                        onChange={(e) =>
                          setArticleForm((prev) => ({
                            ...prev,
                            category_id: e.target.value || null,
                          }))
                        }
                        className="input w-full"
                      >
                        <option value="">None</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Author</label>
                      <input
                        type="text"
                        value={articleForm.author_name || ''}
                        onChange={(e) => setArticleForm((prev) => ({ ...prev, author_name: e.target.value }))}
                        placeholder="OREMITECH Editorial"
                        className="input w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Publication Status</label>
                      <select
                        value={articleForm.publication_status || 'draft'}
                        onChange={(e) =>
                          setArticleForm((prev) => ({ ...prev, publication_status: e.target.value as any }))
                        }
                        className="input w-full"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted">Tags</label>
                      <input
                        type="text"
                        value={(articleForm.tags || []).join(', ')}
                        onChange={(e) => setArticleForm((prev) => ({ ...prev, tags: parseTags(e.target.value) }))}
                        placeholder="SSD, storage, upgrades"
                        className="input w-full"
                      />
                      <p className="text-[10px] text-muted">Comma separated. Used for related searches and article tags.</p>
                    </div>
                    {articleForm.publication_status === 'scheduled' && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold text-muted">Publish at</label>
                        <input
                          type="datetime-local"
                          value={
                            articleForm.scheduled_at
                              ? new Date(articleForm.scheduled_at).toISOString().slice(0, 16)
                              : ''
                          }
                          onChange={(e) =>
                            setArticleForm((prev) => ({
                              ...prev,
                              scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                            }))
                          }
                          className="input w-full max-w-xs text-xs"
                        />
                        <p className="text-[10px] text-muted">
                          Scheduled articles stay out of the public site and sitemap until the scheduled publishing
                          job runs. An administrator can publish manually at any time.
                        </p>
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-xs font-bold text-muted">
                      <input
                        type="checkbox"
                        checked={Boolean(articleForm.is_featured)}
                        onChange={(e) => setArticleForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <Star className="h-3.5 w-3.5 text-amberdeep" /> Feature on the Knowledge Centre
                    </label>
                    <p className="text-[10px] text-muted">
                      Estimated reading time: {readingMinutes(articleForm.content || '')} min
                    </p>
                  </div>

                  {/* Related products */}
                  <div className="border-t border-line pt-6">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
                      Products mentioned in this article
                    </h3>
                    <p className="mt-1 text-[11px] text-muted">
                      Pick real published products to show below the article. Nothing is invented or priced
                      automatically; the live catalogue decides what is displayed.
                    </p>
                    <input
                      type="search"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products by name"
                      className="input mt-3 w-full max-w-sm text-xs"
                    />
                    <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-line">
                      {productOptions.length === 0 ? (
                        <p className="p-3 text-[11px] text-muted">No published products found.</p>
                      ) : (
                        productOptions
                          .filter((product) => product.name.toLowerCase().includes(productQuery.toLowerCase()))
                          .slice(0, 50)
                          .map((product) => {
                            const selected = (articleForm.related_product_ids || []).includes(product.id)
                            return (
                              <label
                                key={product.id}
                                className="flex cursor-pointer items-center gap-2 border-b border-line/60 px-3 py-2 text-[11px] last:border-0 hover:bg-mist/50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const current = articleForm.related_product_ids || []
                                    const next = e.target.checked
                                      ? [...current, product.id].slice(0, 8)
                                      : current.filter((value) => value !== product.id)
                                    setArticleForm((prev) => ({ ...prev, related_product_ids: next }))
                                  }}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="font-semibold text-ink">{product.name}</span>
                                <span className="ml-auto truncate text-[10px] text-muted">/product/{product.slug}</span>
                              </label>
                            )
                          })
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {(articleForm.related_product_ids || []).length} product(s) selected (maximum 8).
                    </p>
                  </div>

                  {/* FAQ */}
                  <div className="border-t border-line pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
                        Frequently asked questions
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setArticleForm((prev) => ({
                            ...prev,
                            faq: [...(prev.faq || []), { question: '', answer: '' }],
                          }))
                        }
                        className="btn btn-outline btn-sm text-[11px] font-bold"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add FAQ
                      </button>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      Only add questions the article genuinely answers. These render as visible FAQs and FAQ
                      structured data.
                    </p>
                    {(articleForm.faq || []).length === 0 ? (
                      <p className="mt-3 text-[11px] text-muted">No FAQ entries yet.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {(articleForm.faq || []).map((entry, index) => (
                          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1.5fr_auto]">
                            <input
                              value={entry.question}
                              onChange={(e) => {
                                const faq = [...(articleForm.faq || [])]
                                faq[index] = { ...faq[index], question: e.target.value }
                                setArticleForm((prev) => ({ ...prev, faq }))
                              }}
                              placeholder="Question"
                              className="input text-xs font-bold"
                            />
                            <input
                              value={entry.answer}
                              onChange={(e) => {
                                const faq = [...(articleForm.faq || [])]
                                faq[index] = { ...faq[index], answer: e.target.value }
                                setArticleForm((prev) => ({ ...prev, faq }))
                              }}
                              placeholder="Answer"
                              className="input text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setArticleForm((prev) => ({
                                  ...prev,
                                  faq: (prev.faq || []).filter((_, i) => i !== index),
                                }))
                              }
                              className="btn btn-outline btn-sm text-error"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SEO Section */}
                  <div className="border-t border-line pt-6">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted mb-4">
                      SEO Settings
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">SEO Title</label>
                        <input
                          type="text"
                          value={articleForm.seo_title || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_title: e.target.value }))
                          }
                          placeholder="SEO title (max 60 chars)"
                          className="input w-full"
                        />
                        <p className="text-[10px] text-muted">
                          {(articleForm.seo_title || '').length} / 60 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">Meta Description</label>
                        <textarea
                          value={articleForm.seo_description || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_description: e.target.value }))
                          }
                          rows={3}
                          placeholder="Meta description (max 160 chars)"
                          className="input w-full"
                        />
                        <p className="text-[10px] text-muted">
                          {(articleForm.seo_description || '').length} / 160 characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">Focus Keyword</label>
                        <input
                          type="text"
                          value={articleForm.seo_focus_keyword || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_focus_keyword: e.target.value }))
                          }
                          placeholder="laptops Kenya"
                          className="input w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">Secondary Keywords</label>
                        <input
                          type="text"
                          value={articleForm.seo_secondary_keywords || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_secondary_keywords: e.target.value }))
                          }
                          placeholder="buy laptop Kenya, laptop prices Nairobi"
                          className="input w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">Social Title</label>
                        <input
                          type="text"
                          value={articleForm.seo_social_title || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_social_title: e.target.value }))
                          }
                          placeholder="Open Graph title"
                          className="input w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-muted">Social Description</label>
                        <input
                          type="text"
                          value={articleForm.seo_social_description || ''}
                          onChange={(e) =>
                            setArticleForm((prev) => ({ ...prev, seo_social_description: e.target.value }))
                          }
                          placeholder="Open Graph description"
                          className="input w-full"
                        />
                      </div>
                    </div>
                    <SeoPreview
                      seoTitle={articleForm.seo_title || articleForm.title || ''}
                      seoDescription={articleForm.seo_description || articleForm.excerpt || ''}
                      urlSlug={articleForm.slug || slugify(articleForm.title || '')}
                      businessName="OREMITECH"
                      siteUrl={window.location.origin}
                    />
                    <SeoCompletenessIndicator
                      values={{
                        title: articleForm.title || '',
                        description: articleForm.excerpt || '',
                        seoTitle: articleForm.seo_title || '',
                        seoDescription: articleForm.seo_description || '',
                        urlSlug: articleForm.slug || slugify(articleForm.title || ''),
                        mainImage: articleForm.featured_image_url || '',
                        imageAlt: articleForm.featured_image_alt || '',
                        specifications: false,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-line">
                    <div className="flex items-center gap-3">
                      {editingId && canPublish && (
                        <>
                          <button
                            type="button"
                            onClick={handlePublish}
                            disabled={submitting}
                            className="btn btn-emerald btn-sm disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Publish
                          </button>
                          <button
                            type="button"
                            onClick={handleUnpublish}
                            disabled={submitting}
                            className="btn btn-dark btn-sm disabled:opacity-50"
                          >
                            Unpublish
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-ink btn-sm disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5 mr-2" />
                      {submitting ? 'Saving…' : editingId ? 'Update Article' : 'Create Article'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
                <h2 className="font-display text-lg font-bold text-ink mb-4">All Articles</h2>
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal border-t-transparent" />
                  </div>
                ) : articles.length === 0 ? (
                  <p className="text-sm text-muted">No articles yet. Create your first article.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-line text-muted">
                          <th className="pb-3 font-bold text-ink">Title</th>
                          <th className="pb-3 font-bold text-ink">Status</th>
                          <th className="pb-3 font-bold text-ink">Category</th>
                          <th className="pb-3 font-bold text-ink">Published</th>
                          <th className="pb-3 font-bold text-ink">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((article) => (
                          <tr key={article.id} className="border-b border-line/50 hover:bg-mist/30 transition">
                            <td className="py-3">
                              <Link
                                to={`/admin/blog/edit/${article.id}`}
                                className="font-semibold text-ink hover:text-emerald"
                              >
                                {article.title}
                              </Link>
                              <p className="text-[10px] text-muted">
                                /blog/{article.slug}
                              </p>
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  STATUS_COLORS[article.publication_status]
                                }`}
                              >
                                {article.publication_status === 'scheduled' ? (
                                  <Clock className="h-3 w-3" />
                                ) : article.publication_status === 'published' ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : null}
                                {article.publication_status}
                              </span>
                            </td>
                            <td className="py-3 text-muted">
                              {article.category?.name || '—'}
                            </td>
                            <td className="py-3 text-muted">
                              {article.published_at
                                ? new Date(article.published_at).toLocaleDateString('en-KE')
                                : '—'}
                            </td>
                            <td className="py-3 flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/blog/edit/${article.id}`)}
                                className="p-1.5 text-muted hover:text-ink"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <Link
                                to={`/admin/blog/preview/${article.id}`}
                                className="p-1.5 text-muted hover:text-teal"
                                title="Preview"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => {
                                  if (article.publication_status === 'published') {
                                    unpublishArticle(article.id)
                                  } else {
                                    publishArticle(article.id)
                                  }
                                }}
                                className="p-1.5 text-muted hover:text-tealdeep"
                                title={
                                  article.publication_status === 'published' ? 'Unpublish' : 'Publish'
                                }
                              >
                                {article.publication_status === 'published' ? (
                                  <Eye className="h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(article.id)}
                                className="p-1.5 text-muted hover:text-error"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
            <h2 className="font-display text-lg font-bold text-ink mb-4">Blog Categories</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4 mb-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted">Name *</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value, slug: catForm.slug || slugify(e.target.value) }))}
                    className="input w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted">Slug</label>
                  <input
                    type="text"
                    value={catForm.slug}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="input w-full text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted">Sort Order</label>
                  <input
                    type="number"
                    value={catForm.sort_order}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                    className="input w-full text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted">Description</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted">SEO Title</label>
                  <input
                    type="text"
                    value={catForm.seo_title}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted">SEO Description</label>
                  <input
                    type="text"
                    value={catForm.seo_description}
                    onChange={(e) => setCatForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-line text-emerald"
                />
                <label className="text-xs font-bold text-muted">Active</label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-emerald btn-sm disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Category'}
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="pb-3 font-bold text-ink">Name</th>
                    <th className="pb-3 font-bold text-ink">Slug</th>
                    <th className="pb-3 font-bold text-ink">Status</th>
                    <th className="pb-3 font-bold text-ink">Sort</th>
                    <th className="pb-3 font-bold text-ink">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b border-line/50 hover:bg-mist/30 transition">
                      <td className="py-3">
                        <Link
                          to={`/admin/categories/edit/${cat.id}`}
                          className="font-semibold text-ink hover:text-emerald"
                        >
                          {cat.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted text-xs">{cat.slug}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            cat.is_active ? 'bg-teal/10 text-tealdeep border-teal/30' : 'bg-muted/10 text-muted border-border-line'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-muted text-xs">{cat.sort_order}</td>
                      <td className="py-3 flex items-center gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(cat.id)}
                          className="p-1.5 text-muted hover:text-error"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <div className="bg-card rounded-xl border border-line p-6 shadow-lg max-w-md w-full">
              <h3 className="font-display text-lg font-bold text-ink mb-2">Confirm Delete</h3>
              <p className="text-sm text-muted mb-6">
                Are you sure you want to delete this? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-error btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
