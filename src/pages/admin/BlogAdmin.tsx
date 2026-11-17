import { FormEvent, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useBlogStore } from '@/store/blogStore'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { SeoPreview, SeoCompletenessIndicator } from '@/components/seo/SeoComponents'
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
} from 'lucide-react'
import type { BlogArticle, BlogCategory } from '@/lib/domain'
import { slugify } from '@/lib/commerce'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted/10 text-muted border-border-line',
  published: 'bg-teal/10 text-tealdeep border-teal/30',
  scheduled: 'bg-amber/10 text-amberdeep border-amber/30',
  archived: 'bg-error/10 text-error border-error/30',
}

export default function BlogAdmin() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
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
    seo_title: '',
    seo_description: '',
    seo_focus_keyword: '',
    seo_secondary_keywords: '',
    seo_social_title: '',
    seo_social_description: '',
    publication_status: 'draft',
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

  useEffect(() => {
    fetchCategories()
    fetchArticles({ status: 'all' })
  }, [fetchCategories, fetchArticles])

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
          seo_title: existing.seo_title || '',
          seo_description: existing.seo_description || '',
          seo_focus_keyword: existing.seo_focus_keyword || '',
          seo_secondary_keywords: existing.seo_secondary_keywords || '',
          seo_social_title: existing.seo_social_title || '',
          seo_social_description: existing.seo_social_description || '',
          publication_status: existing.publication_status,
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
              seo_title: found.seo_title || '',
              seo_description: found.seo_description || '',
              seo_focus_keyword: found.seo_focus_keyword || '',
              seo_secondary_keywords: found.seo_secondary_keywords || '',
              seo_social_title: found.seo_social_title || '',
              seo_social_description: found.seo_social_description || '',
              publication_status: found.publication_status,
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
    setArticleForm((prev) => ({ ...prev, slug: val }))
    setCatForm((prev) => ({ ...prev, slug: val }))
  }

  const handleCreateArticle = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const result = await createArticle({
        title: articleForm.title,
        slug: articleForm.slug || slugify(articleForm.title || ''),
        excerpt: articleForm.excerpt,
        content: articleForm.content,
        featured_image_url: articleForm.featured_image_url || null,
        featured_image_alt: articleForm.featured_image_alt || null,
        category_id: articleForm.category_id,
        seo_title: articleForm.seo_title || null,
        seo_description: articleForm.seo_description || null,
        seo_focus_keyword: articleForm.seo_focus_keyword || null,
        seo_secondary_keywords: articleForm.seo_secondary_keywords || null,
        seo_social_title: articleForm.seo_social_title || null,
        seo_social_description: articleForm.seo_social_description || null,
        publication_status: (articleForm.publication_status as any) || 'draft',
        scheduled_at: articleForm.publication_status === 'scheduled' ? new Date().toISOString() : null,
      })
      if (result) {
        setMessage('Article created successfully')
        setEditMode(false)
        setEditingId(null)
        setArticleForm({
          title: '',
          slug: '',
          excerpt: '',
          content: '',
          featured_image_url: '',
          featured_image_alt: '',
          category_id: null,
          seo_title: '',
          seo_description: '',
          seo_focus_keyword: '',
          seo_secondary_keywords: '',
          seo_social_title: '',
          seo_social_description: '',
          publication_status: 'draft',
        })
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
      await updateArticle(editingId, {
        title: articleForm.title,
        slug: articleForm.slug,
        excerpt: articleForm.excerpt,
        content: articleForm.content,
        featured_image_url: articleForm.featured_image_url || null,
        featured_image_alt: articleForm.featured_image_alt || null,
        category_id: articleForm.category_id,
        seo_title: articleForm.seo_title || null,
        seo_description: articleForm.seo_description || null,
        seo_focus_keyword: articleForm.seo_focus_keyword || null,
        seo_secondary_keywords: articleForm.seo_secondary_keywords || null,
        seo_social_title: articleForm.seo_social_title || null,
        seo_social_description: articleForm.seo_social_description || null,
        publication_status: (articleForm.publication_status as any) || 'draft',
        scheduled_at:
          articleForm.publication_status === 'scheduled' ? new Date().toISOString() : null,
      })
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
          {!editingId && (
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
            {editingId ? (
              <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold text-ink">Edit Article</h2>
                  <Link
                    to="/admin/blog"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to list
                  </Link>
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
                    <label className="block text-xs font-bold text-muted">Featured Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={articleForm.featured_image_url || ''}
                        onChange={(e) =>
                          setArticleForm((prev) => ({ ...prev, featured_image_url: e.target.value }))
                        }
                        placeholder="https://..."
                        className="input flex-1"
                      />
                      <input
                        type="text"
                        value={articleForm.featured_image_alt || ''}
                        onChange={(e) =>
                          setArticleForm((prev) => ({ ...prev, featured_image_alt: e.target.value }))
                        }
                        placeholder="Alt text"
                        className="input w-48 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-muted">
                      Upload images to Supabase storage (product-images bucket) and paste the public URL here.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted">Content *</label>
                    <RichTextEditor
                      value={articleForm.content || ''}
                      onChange={(val) =>
                        setArticleForm((prev) => ({ ...prev, content: val }))
                      }
                    />
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
