import { FormEvent, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { getSupabase } from '@/lib/supabase'
import { useProductStore } from '@/store/productStore'
import { useAuthStore } from '@/store/authStore'
import { slugify } from '@/lib/commerce'
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Send,
  X,
  Keyboard,
  Image as ImageIcon,
  Link as LinkIcon,
  Monitor,
  Move,
  Eye,
  Maximize,
  ImageMinus,
  ImagePlus,
} from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { SeoPreview, SeoCompletenessIndicator } from '@/components/seo/SeoComponents'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

export default function AdminProductForm() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { fetchProductBySlug } = useProductStore()

  const [loading, setLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishDone, setPublishDone] = useState(false)
  const { user } = useAuthStore()
  const isOwner = user?.role === 'owner'
  const [newProdId, setNewProdId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([
    { id: 'cat-1', name: 'Laptops', slug: 'laptops' },
    { id: 'cat-2', name: 'Business Laptops', slug: 'business-laptops' },
    { id: 'cat-3', name: 'Gaming Laptops', slug: 'gaming-laptops' },
    { id: 'cat-4', name: 'Student Laptops', slug: 'student-laptops' },
    { id: 'cat-5', name: 'Workstations', slug: 'workstations' },
    { id: 'cat-6', name: 'Computer Accessories', slug: 'computer-accessories' },
    { id: 'cat-7', name: 'Monitors', slug: 'monitors' },
    { id: 'cat-8', name: 'Storage Devices', slug: 'storage-devices' },
  ])

  const [brands, setBrands] = useState<Array<{ id: string; name: string; slug: string }>>([
    { id: 'b-1', name: 'HP', slug: 'hp' },
    { id: 'b-2', name: 'Dell', slug: 'dell' },
    { id: 'b-3', name: 'Lenovo', slug: 'lenovo' },
    { id: 'b-4', name: 'Apple', slug: 'apple' },
    { id: 'b-5', name: 'ASUS', slug: 'asus' },
    { id: 'b-6', name: 'Acer', slug: 'acer' },
  ])

  const [form, setForm] = useState({
    name: '',
    slug: '',
    brand_name: 'HP',
    category_slug: 'laptops',
    model: '',
    description: '',
    selling_price: '',
    comparison_price: '',
    purchase_cost: '',
    laptop_condition: 'new',
    warranty: '1 Year Warranty',
    processor_manufacturer: 'Intel',
    processor_model: '',
    ram: '16GB',
    ram_type: 'DDR4',
    storage_capacity: '512GB',
    storage_type: 'SSD',
    screen_size: '14-inch FHD',
    graphics: 'Integrated Intel Iris Xe',
    operating_system: 'Windows 11 Pro',
    battery_condition: 'Healthy (100%)',
    keyboard_layout: 'Standard QWERTY',
    weight: '1.4 kg',
    colour: 'Silver',
    featured: false,
    publication_status: 'draft',
    images: [{ url: '/images/products/laptop-placeholder.svg', alt: 'Product image' }],
    pendingUploads: [] as File[],
    imageUploading: false,
    initial_stock: '0',
    // SEO fields
    seo_title: '',
    seo_description: '',
    seo_focus_keyword: '',
    seo_secondary_keywords: '',
    seo_social_title: '',
    seo_social_description: '',
  })

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    if (supabase) {
      supabase.from('categories').select('id, name, slug').then(({ data }) => {
        if (data && data.length > 0) setCategories(data)
      })
      supabase.from('brands').select('id, name, slug').then(({ data }) => {
        if (data && data.length > 0) setBrands(data)
      })
    }

    if (id) {
      setLoading(true)
      fetchProductBySlug(id).then((p) => {
        if (p) {
          setForm({
            name: p.name,
            slug: p.slug,
            brand_name: p.brand_name || 'HP',
            category_slug: p.category_slug,
            model: p.model || '',
            description: p.description,
            selling_price: String(p.selling_price),
            comparison_price: p.comparison_price ? String(p.comparison_price) : '',
            purchase_cost: '',
            laptop_condition: p.laptop_condition || 'new',
            warranty: p.warranty || '1 Year Warranty',
            processor_manufacturer: p.processor_manufacturer || 'Intel',
            processor_model: p.processor_model || '',
            ram: p.ram || '16GB',
            ram_type: p.ram_type || 'DDR4',
            storage_capacity: p.storage_capacity || '512GB',
            storage_type: p.storage_type || 'SSD',
            screen_size: p.screen_size || '',
            graphics: p.graphics || '',
            operating_system: p.operating_system || 'Windows 11 Pro',
            battery_condition: p.battery_condition || 'Healthy',
            keyboard_layout: p.keyboard_layout || 'Standard QWERTY',
            weight: p.weight || '1.4 kg',
            colour: p.colour || 'Silver',
            featured: p.featured,
            publication_status: 'draft',
            images: p.images?.length
              ? p.images.map((img) => ({ url: img.url, alt: img.alt || p.name }))
              : [{ url: '/images/products/laptop-placeholder.svg', alt: p.name || 'Product image' }],
            initial_stock: String(p.owned_available || 5),
            // SEO fields from database
            seo_title: p.seo_title || '',
            seo_description: p.seo_description || '',
            seo_focus_keyword: p.seo_focus_keyword || '',
            seo_secondary_keywords: p.seo_secondary_keywords || '',
            seo_social_title: p.seo_social_title || '',
            seo_social_description: p.seo_social_description || '',
            pendingUploads: [],
            imageUploading: false,
          })
        }
        setLoading(false)
      })
    }
  }, [id, fetchProductBySlug])

  const handleNameChange = (nameVal: string) => {
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      slug: isEdit ? prev.slug : slugify(nameVal),
    }))
  }

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }],
    }))
  }

  const updateImageUrl = (index: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.images]
      updated[index] = { ...updated[index], url: val }
      return { ...prev, images: updated }
    })
  }

  const updateImageAlt = (index: number, val: string) => {
    setForm((prev) => {
      const updated = [...prev.images]
      updated[index] = { ...updated[index], alt: val }
      return { ...prev, images: updated }
    })
  }

  const removeImage = (index: number) => {
    setForm((prev) => {
      const updated = prev.images.filter((_, i) => i !== index)
      if (updated.length === 0) {
        updated.push({ url: '/images/products/laptop-placeholder.svg', alt: 'Product image' })
      }
      return { ...prev, images: updated }
    })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= form.images.length || toIndex < 0 || toIndex >= form.images.length)
      return
    setForm((prev) => {
      const updated = [...prev.images]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return { ...prev, images: updated }
    })
  }

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const supabase = getSupabase()
    if (!supabase) {
      setError('Supabase not configured. Cannot upload images.')
      return
    }

    setForm((prev) => ({ ...prev, imageUploading: true }))

    try {
      const uploaded: Array<{ url: string; alt: string }> = []
      for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600' })

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path)

        uploaded.push({
          url: urlData.publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, ''),
        })
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images.filter((img) => img.url), ...uploaded],
        imageUploading: false,
      }))
      e.target.value = ''
    } catch (err: any) {
      setError(err.message || 'Failed to upload images')
      setForm((prev) => ({ ...prev, imageUploading: false }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!form.name.trim() || !form.selling_price) {
      setError('Please provide product name and valid selling price.')
      return
    }

    setLoading(true)
    const supabase = getSupabase()

    try {
      if (supabase) {
        // Find category ID
        const matchedCat = categories.find((c) => c.slug === form.category_slug) || categories[0]
        const matchedBrand = brands.find((b) => b.name.toLowerCase() === form.brand_name.toLowerCase())

        if (isEdit && id) {
          const { error: updErr } = await supabase
            .from('products')
            .update({
              name: form.name.trim(),
              slug: form.slug.trim(),
              brand_id: matchedBrand?.id || null,
              category_id: matchedCat.id,
              model: form.model.trim(),
              description: form.description.trim(),
              selling_price: Number(form.selling_price),
              comparison_price: form.comparison_price ? Number(form.comparison_price) : null,
              laptop_condition: form.laptop_condition,
              warranty: form.warranty,
              processor_manufacturer: form.processor_manufacturer,
              processor_model: form.processor_model,
              ram: form.ram,
              ram_type: form.ram_type,
              storage_capacity: form.storage_capacity,
              storage_type: form.storage_type,
              screen_size: form.screen_size,
              graphics: form.graphics,
              operating_system: form.operating_system,
              battery_condition: form.battery_condition,
              keyboard_layout: form.keyboard_layout,
              weight: form.weight,
              colour: form.colour,
              featured: form.featured,
              publication_status: form.publication_status,
              seo_title: form.seo_title.trim() || null,
              seo_description: form.seo_description.trim() || null,
              seo_focus_keyword: form.seo_focus_keyword.trim() || null,
              seo_secondary_keywords: form.seo_secondary_keywords.trim() || null,
              seo_social_title: form.seo_social_title.trim() || null,
              seo_social_description: form.seo_social_description.trim() || null,
            })
            .eq('id', id)

          if (updErr) throw updErr

          // Replace all product images (existing + new uploads)
          await supabase.from('product_images').delete().eq('product_id', id)
          const imageRows = form.images
            .filter((img) => img.url && img.url.startsWith('http'))
            .map((img, idx) => ({
              product_id: id,
              url: img.url,
              alt: img.alt.trim() || form.name,
              sort_order: idx,
            }))
          if (imageRows.length > 0) {
            await supabase.from('product_images').insert(imageRows)
          }

          setMessage('Product updated successfully!')
        } else {
          // Create product in database
          const { data: newProd, error: insertErr } = await supabase
            .from('products')
            .insert({
              name: form.name.trim(),
              slug: form.slug.trim() || slugify(form.name),
              brand_id: matchedBrand?.id || null,
              category_id: matchedCat.id,
              model: form.model.trim(),
              description: form.description.trim(),
              selling_price: Number(form.selling_price),
              comparison_price: form.comparison_price ? Number(form.comparison_price) : null,
              laptop_condition: form.laptop_condition,
              warranty: form.warranty,
              processor_manufacturer: form.processor_manufacturer,
              processor_model: form.processor_model,
              ram: form.ram,
              ram_type: form.ram_type,
              storage_capacity: form.storage_capacity,
              storage_type: form.storage_type,
              screen_size: form.screen_size,
              graphics: form.graphics,
              operating_system: form.operating_system,
              battery_condition: form.battery_condition,
              keyboard_layout: form.keyboard_layout,
              weight: form.weight,
              colour: form.colour,
              featured: form.featured,
              publication_status: form.publication_status,
              seo_title: form.seo_title.trim() || null,
              seo_description: form.seo_description.trim() || null,
              seo_focus_keyword: form.seo_focus_keyword.trim() || null,
              seo_secondary_keywords: form.seo_secondary_keywords.trim() || null,
              seo_social_title: form.seo_social_title.trim() || null,
              seo_social_description: form.seo_social_description.trim() || null,
            })
            .select('id')
            .single()

          if (insertErr) throw insertErr

          if (newProd) {
            setNewProdId(newProd.id)

            // Save initial stock via the adjust_stock RPC (updates balance + records movement)
            const stockQty = Number(form.initial_stock) || 0
            if (stockQty > 0) {
              await supabase.rpc('adjust_stock', {
                p_product_id: newProd.id,
                p_bucket: 'owned',
                p_delta: stockQty,
                p_notes: 'Initial inventory entry',
              })
            }

            // Save images
            const imageRows = form.images
              .filter((img) => img.url && img.url.startsWith('http'))
              .map((img, idx) => ({
                product_id: newProd.id,
                url: img.url,
                alt: img.alt.trim() || form.name,
                sort_order: idx,
              }))
            if (imageRows.length > 0) {
              await supabase.from('product_images').insert(imageRows)
            }
          }

          setMessage('New product created successfully! It starts as Draft — use Publish to Website to make it live.')
        }
      } else {
          setMessage('Product saved in memory session.')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving product.')
    } finally {
      setLoading(false)
    }
  }
  const handlePublish = async () => {
    const targetId = isEdit ? id : newProdId
    if (!targetId) {
      setError('No product ID available to publish.')
      return
    }
    setError(null)
    setMessage(null)
    setIsPublishing(true)
    const supabase = getSupabase()
    if (!supabase) {
      setError('Supabase client not available.')
      setIsPublishing(false)
      return
    }
    try {
      // Workflow: draft/pending_approval → approve → publish
      const currentStatus = form.publication_status

      if (currentStatus === 'draft' || currentStatus === 'pending_approval') {
        const { error: approveErr } = await supabase.rpc('decide_product', {
          p_id: targetId,
          p_decision: 'approved',
          p_note: 'Approved before publishing from product form',
        })
        if (approveErr) throw approveErr
        setMessage('Product approved. Now publishing to website…')
      }

      const { error } = await supabase.rpc('decide_product', {
        p_id: targetId,
        p_decision: 'published',
        p_note: 'Published to website from product form',
      })
      if (error) throw error

      setPublishDone(true)
      setMessage('Product published to website! It is now live on the storefront.')
    } catch (err: any) {
      setError(err.message || 'Error publishing product.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <AdminLayout
      title={isEdit ? 'Edit Laptop Product' : 'Add New Laptop Product'}
      subtitle="Configure hardware specifications, pricing in KSh, and inventory limits"
      actions={
        <Link to="/admin/products" className="btn btn-outline !h-9 text-xs font-bold">
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-bold text-error">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-bold text-tealdeep flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        {/* Basic Info Card */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
            1. Basic Information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Product Title *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. HP EliteBook 840 G8 Core i7 16GB 512GB"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">URL Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="hp-elitebook-840-g8"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Brand *</label>
              <select
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                className="input mt-1.5 w-full text-xs font-bold"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Category *</label>
              <select
                value={form.category_slug}
                onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                className="input mt-1.5 w-full text-xs font-bold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Specific Model Number</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. 840 G8 / 2021"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Description & Condition Notes</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Comprehensive technical notes, port selection, battery health, and aesthetic condition."
                className="mt-1.5"
              />
              <p className="mt-1 text-[10px] text-muted">
                Use headings (H2/H3), bold, lists, and tables for technical specifications. H1 is reserved for the product page title.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Publication Status *</label>
              <select
                value={form.publication_status}
                onChange={(e) => setForm({ ...form, publication_status: e.target.value })}
                className="input mt-1.5 w-full text-xs font-semibold"
              >
                <option value="draft">Draft — Not visible on storefront</option>
                <option value="pending_approval">Pending Approval — Awaiting owner signoff</option>
              </select>
              <p className="mt-1 text-[10px] text-muted">
                Only the Owner can approve or publish products. New products start as Draft.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
            2. Commercial Pricing & Inventory (KES)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-muted">Selling Price (KSh) *</label>
              <input
                type="number"
                required
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                placeholder="85000"
                className="input mt-1.5 w-full text-xs font-extrabold text-teal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Comparison / Strike-Through Price</label>
              <input
                type="number"
                value={form.comparison_price}
                onChange={(e) => setForm({ ...form, comparison_price: e.target.value })}
                placeholder="95000"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Initial Stock Units</label>
              <input
                type="number"
                value={form.initial_stock}
                onChange={(e) => setForm({ ...form, initial_stock: e.target.value })}
                placeholder="5"
                className="input mt-1.5 w-full text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Hardware Specifications Card */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
            3. Hardware Specifications
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-muted">Processor (CPU)</label>
              <input
                type="text"
                value={form.processor_model}
                onChange={(e) => setForm({ ...form, processor_model: e.target.value })}
                placeholder="e.g. Intel Core i7-1165G7"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">RAM Memory</label>
              <input
                type="text"
                value={form.ram}
                onChange={(e) => setForm({ ...form, ram: e.target.value })}
                placeholder="e.g. 16GB"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Storage Drive</label>
              <input
                type="text"
                value={form.storage_capacity}
                onChange={(e) => setForm({ ...form, storage_capacity: e.target.value })}
                placeholder="e.g. 512GB NVMe SSD"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Screen Size & Panel</label>
              <input
                type="text"
                value={form.screen_size}
                onChange={(e) => setForm({ ...form, screen_size: e.target.value })}
                placeholder="e.g. 14.0-inch FHD IPS (1920x1080)"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Graphics (GPU)</label>
              <input
                type="text"
                value={form.graphics}
                onChange={(e) => setForm({ ...form, graphics: e.target.value })}
                placeholder="e.g. NVIDIA RTX 3050 4GB"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Operating System</label>
              <input
                type="text"
                value={form.operating_system}
                onChange={(e) => setForm({ ...form, operating_system: e.target.value })}
                placeholder="Windows 11 Pro 64-bit"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Physical Condition</label>
              <select
                value={form.laptop_condition}
                onChange={(e) => setForm({ ...form, laptop_condition: e.target.value })}
                className="input mt-1.5 w-full text-xs font-semibold"
              >
                <option value="new">Brand New Sealed</option>
                <option value="refurbished">Certified Refurbished</option>
                <option value="open_box">Open Box Ex-Demo</option>
                <option value="used_excellent">Used - Grade A+ Pristine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Battery Condition</label>
              <input
                type="text"
                value={form.battery_condition}
                onChange={(e) => setForm({ ...form, battery_condition: e.target.value })}
                placeholder="e.g. Excellent (>90% health)"
                className="input mt-1.5 w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Warranty Period</label>
              <input
                type="text"
                value={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                placeholder="e.g. 1 Year Official Warranty"
                className="input mt-1.5 w-full text-xs"
              />
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              4. Product Photographs & Images
            </h2>
            <button
              type="button"
              onClick={addImage}
              className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Photo
            </button>
          </div>

          {/* File Upload */}
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-line bg-muted cursor-pointer text-xs font-bold hover:bg-line/50">
              <Upload className="h-3 w-3" />
              Upload Photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={handleImageFiles}
                className="sr-only"
              />
            </label>
            {form.imageUploading && (
              <span className="text-xs text-muted animate-pulse">Uploading…</span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {form.images.map((img, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border border-line p-2 bg-muted/50">
                <img
                  src={img.url || PLACEHOLDER}
                  alt={img.alt || form.name}
                  className="w-16 h-16 object-cover rounded-md bg-white"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = PLACEHOLDER
                  }}
                />
                <input
                  type="text"
                  value={img.url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  placeholder="/images/products/hp-elitebook.svg or https://..."
                  className="input !h-9 flex-1 text-xs"
                />
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateImageAlt(index, e.target.value)}
                  placeholder="Alt text"
                  className="input !h-9 w-32 text-xs"
                />
                <div className="flex items-center gap-1 ml-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="p-1 rounded text-muted hover:text-primary"
                      title="Move up"
                    >
                      <Move className="h-3 w-3 rotate-180" />
                    </button>
                  )}
                  {index < form.images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="p-1 rounded text-muted hover:text-primary"
                      title="Move down"
                    >
                      <Move className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {form.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1 text-muted hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {form.images.length === 0 && (
              <p className="text-xs text-muted italic mt-2">
                At least one image is required.
              </p>
            )}
          </div>
        </div>

        {/* Image Alt Text */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              5. Main Image Alt Text
            </h2>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-muted">Image Alt Text *</label>
            <input
              type="text"
              value={form.images?.[0]?.alt || ''}
              onChange={(e) => updateImageAlt(0, e.target.value)}
              placeholder="e.g. HP EliteBook 840 G8 laptop silver 14-inch"
              className="input mt-1.5 w-full text-xs font-bold"
            />
            <p className="mt-1 text-[10px] text-muted">
              Describes the main product image for accessibility and image search. Be specific and descriptive.
            </p>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="rounded-xl border border-line bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
              6. Product SEO Settings
            </h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">SEO Title *</label>
              <input
                type="text"
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder="HP EliteBook 840 G8 - Verified Laptop in Kenya"
                className="input mt-1.5 w-full text-xs font-bold"
                maxLength={60}
              />
              <p className="mt-1 text-[10px] text-muted">
                Appears as the clickable title in search results. Keep under 60 characters.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Meta Description *</label>
              <textarea
                rows={3}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                placeholder="Buy verified HP EliteBook 840 G8 laptop at OREMITECH Kenya. Core i7, 16GB RAM, 512GB SSD. Nationwide delivery."
                className="input mt-1.5 w-full py-2 text-xs"
                maxLength={160}
              />
              <p className="mt-1 text-[10px] text-muted">
                Appears under the SEO title in search results. Keep between 140-160 characters.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="hp-elitebook-840-g8"
                className="input mt-1.5 w-full text-xs font-bold"
              />
              <p className="mt-1 text-[10px] text-muted">Clean, descriptive URL for the product page.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted">Focus Keyword</label>
              <input
                type="text"
                value={form.seo_focus_keyword}
                onChange={(e) => setForm({ ...form, seo_focus_keyword: e.target.value })}
                placeholder="HP EliteBook 840 G8"
                className="input mt-1.5 w-full text-xs font-bold"
              />
              <p className="mt-1 text-[10px] text-muted">Primary keyword this page targets.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Secondary Keywords</label>
              <input
                type="text"
                value={form.seo_secondary_keywords}
                onChange={(e) => setForm({ ...form, seo_secondary_keywords: e.target.value })}
                placeholder="refurbished laptop Kenya, business laptop, Core i7 laptop"
                className="input mt-1.5 w-full text-xs font-bold"
              />
              <p className="mt-1 text-[10px] text-muted">Comma-separated related search terms.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Social Sharing Title</label>
              <input
                type="text"
                value={form.seo_social_title}
                onChange={(e) => setForm({ ...form, seo_social_title: e.target.value })}
                placeholder="HP EliteBook 840 G8 - Verified & Ready to Ship"
                className="input mt-1.5 w-full text-xs font-bold"
              />
              <p className="mt-1 text-[10px] text-muted">Open Graph title for Facebook, Twitter, LinkedIn.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-muted">Social Sharing Description</label>
              <textarea
                rows={2}
                value={form.seo_social_description}
                onChange={(e) => setForm({ ...form, seo_social_description: e.target.value })}
                placeholder="Get a verified HP EliteBook 840 G8 with nationwide delivery in Kenya. Quality assured."
                className="input mt-1.5 w-full py-2 text-xs"
              />
              <p className="mt-1 text-[10px] text-muted">Open Graph description for social shares.</p>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="mt-6">
            <SeoPreview
              seoTitle={form.seo_title || `Draft: ${form.name}`}
              seoDescription={form.seo_description || ''}
              urlSlug={form.slug || slugify(form.name)}
              businessName="OREMITECH"
              siteUrl="https://oremitech.co.ke"
            />
          </div>

          {/* SEO Completeness */}
          <div className="mt-6">
            <SeoCompletenessIndicator
              values={{
                title: form.name,
                description: form.description,
                seoTitle: form.seo_title,
                seoDescription: form.seo_description,
                urlSlug: form.slug,
                mainImage: form.images?.[0]?.url || '',
                imageAlt: form.images?.[0]?.alt || '',
                specifications: Boolean(form.processor_model || form.ram || form.storage_capacity),
              }}
            />
          </div>

          {/* Generate SEO Suggestions */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                // Auto-generate SEO suggestions from existing product data
                const name = form.name.trim()
                const brand = form.brand_name
                const condition = form.laptop_condition
                const model = form.model.trim()
                
                if (!form.seo_title) {
                  setForm((prev) => ({
                    ...prev,
                    seo_title: `${name}${model ? ` ${model}` : ''} | ${brand} ${condition} | OREMITECH Kenya`,
                  }))
                }
                if (!form.seo_description) {
                  setForm((prev) => ({
                    ...prev,
                    seo_description: `${name} available at OREMITECH Kenya. Verified ${condition} laptop with ${form.ram || 'RAM'} and ${form.storage_capacity || 'storage'}. Nationwide delivery in KSh.`,
                  }))
                }
                if (!form.seo_focus_keyword) {
                  setForm((prev) => ({
                    ...prev,
                    seo_focus_keyword: `${name} ${model || ''}`.trim(),
                  }))
                }
                if (!form.seo_secondary_keywords) {
                  setForm((prev) => ({
                    ...prev,
                    seo_secondary_keywords: `${brand} laptop, ${condition} laptop, ${form.processor_model || ''} laptop, buy laptop Kenya`.trim(),
                  }))
                }
                if (!form.seo_social_title) {
                  setForm((prev) => ({
                    ...prev,
                    seo_social_title: `${name} - Verified ${condition} at OREMITECH Kenya`,
                  }))
                }
                if (!form.seo_social_description) {
                  setForm((prev) => ({
                    ...prev,
                    seo_social_description: `Get a verified ${name} with nationwide delivery. Quality assured by OREMITECH Kenya.`,
                  }))
                }
              }}
              className="btn btn-emerald !h-10 w-full text-xs font-bold flex items-center justify-center gap-2"
            >
              <Keyboard className="h-4 w-4" /> Generate SEO Suggestions
            </button>
            <p className="mt-1 text-[10px] text-muted">
              Suggestions are generated from your entered product data. Review and edit before saving. No AI API is used.
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 rounded-xl border border-line bg-card p-4 shadow-xs">
          <Link to="/admin/products" className="btn btn-outline !h-10 text-xs font-bold">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-emerald !h-10 px-6 text-xs font-bold shadow-md disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}
          </button>
          {isOwner && (isEdit || newProdId) && !publishDone && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading || isPublishing}
              className={`btn !h-11 px-6 font-bold shadow-md disabled:opacity-50 ${
                isPublishing ? 'bg-muted' : 'bg-amber hover:bg-amberdeep text-ink'
              }`}
            >
              {isPublishing ? (
                <>
                  <Send className="h-4 w-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" /> Publish to Website
                </>
              )}
            </button>
          )}
          {publishDone && (
            <span className="flex items-center gap-2 text-xs font-bold text-tealdeep">
              <CheckCircle2 className="h-4 w-4" /> Published to website
            </span>
          )}
        </div>
      </form>
    </AdminLayout>
  )
}

