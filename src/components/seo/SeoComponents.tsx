import { useState, useCallback } from 'react'
import { Search, Keyboard, Share2, Globe, Image, Layout } from 'lucide-react'

interface SeoPreviewProps {
  seoTitle: string
  seoDescription: string
  urlSlug: string
  businessName: string
  siteUrl: string
}

export function SeoPreview({ seoTitle, seoDescription, urlSlug, businessName, siteUrl }: SeoPreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  const fullTitle = seoTitle ? `${seoTitle} · ${businessName}` : `${businessName}`
  const titleLength = fullTitle.length
  const descLength = seoDescription.length
  const slugLength = urlSlug.length

  const titleStatus = titleLength > 60 ? 'text-error' : titleLength > 0 ? 'text-muted' : 'text-muted'
  const descStatus =
    descLength > 160 ? 'text-error' : descLength > 0 ? (descLength >= 140 ? 'text-tealdeep' : 'text-muted') : 'text-muted'
  const slugStatus = slugLength > 0 ? 'text-tealdeep' : 'text-muted'

  const displayUrl = `${siteUrl}/product/${urlSlug}`

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-bold text-ink">Google Search Preview</h3>
        <div className="flex gap-1">
          {['desktop', 'mobile'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d as 'desktop' | 'mobile')}
              className={`flex h-6 w-6 items-center justify-center rounded-sm text-xs font-bold transition ${
                device === d ? 'bg-teal text-white' : 'bg-mist text-muted hover:bg-card'
              }`}
              title={d}
              aria-label={`Preview as ${d}`}
            >
              {d === 'desktop' ? (
                <Layout className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-lg border border-line p-3 ${device === 'desktop' ? 'max-w-md' : 'max-w-xs'} bg-white`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] text-teal flex items-center gap-1">
            <Search className="h-3 w-3" /> {siteUrl.replace(/https?:\/\//, '')}
          </span>
        </div>
        <a
          href={`/${urlSlug}`}
          className="block text-tealdeep hover:underline text-[15px] font-semibold leading-snug break-words"
          title={fullTitle}
        >
          {fullTitle}
        </a>
        <div className="mt-1.5 text-[12px] leading-relaxed text-gray-600 break-words">
          {seoDescription || `Discover ${businessName.toLowerCase()} - verified laptops and computer accessories in Kenya.`}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Keyboard className="h-3 w-3 text-muted" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">SEO Title</p>
            <p className={`text-[11px] font-bold ${titleStatus}`}>
              {titleLength} / 60 chars
              {titleLength > 60 ? ' (too long)' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="h-3 w-3 text-muted" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Meta Description</p>
            <p className={`text-[11px] font-bold ${descStatus}`}>
              {descLength} / 160 chars
              {descLength > 0 && descLength < 140 && ' (consider expanding)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SeoCompletenessIndicatorProps {
  values: {
    title: string
    description: string
    seoTitle: string
    seoDescription: string
    urlSlug: string
    mainImage: string
    imageAlt: string
    specifications: boolean
  }
  onFieldFocus?: (field: keyof SeoCompletenessIndicatorProps['values']) => void
}

export function SeoCompletenessIndicator({ values, onFieldFocus }: SeoCompletenessIndicatorProps) {
  const checks = [
    { field: 'title' as const, label: 'Product title', required: true },
    { field: 'description' as const, label: 'Product description', required: true },
    { field: 'seoTitle' as const, label: 'SEO title', required: true },
    { field: 'seoDescription' as const, label: 'Meta description', required: true },
    { field: 'urlSlug' as const, label: 'URL slug', required: true },
    { field: 'mainImage' as const, label: 'Main product image', required: true },
    { field: 'imageAlt' as const, label: 'Image alt text', required: false },
    { field: 'specifications' as const, label: 'Specifications', required: false },
  ]

  const completed = checks.filter((c) => Boolean(values[c.field])).length
  const total = checks.length
  const score = Math.round((completed / total) * 100)

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-tealdeep bg-mint/10 border-mint/30'
    if (s >= 50) return 'text-amberdeep bg-amber/10 border-amber/30'
    return 'text-error bg-error/10 border-error/30'
  }

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-bold text-ink">SEO Completeness</h3>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
          <span className="text-[10px] text-muted">of 8</span>
        </div>
      </div>
      <div className="w-full bg-mist/30 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-3 space-y-1.5">
        {checks.map((check) => {
          const isComplete = Boolean(values[check.field])
          return (
            <div
              key={check.field}
              className={`flex items-center justify-between gap-2 cursor-pointer hover:bg-mist/30 rounded p-1.5 transition ${onFieldFocus ? '' : ''}`}
              onClick={() => onFieldFocus?.(check.field)}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className={`w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition ${
                  isComplete ? 'bg-teal text-white' : 'bg-line text-muted'
                }`}>
                  {isComplete ? '✓' : '○'}
                </span>
                <span className={`text-xs font-semibold ${isComplete ? 'text-ink' : 'text-muted'}`}>
                  {check.label}
                </span>
                {!isComplete && check.required && (
                  <span className="text-[10px] text-error">Required</span>
                )}
              </div>
              {!isComplete && (
                <span className="text-[10px] text-muted italic">Incomplete</span>
              )}
            </div>
          )
        })}
      </div>
      {score < 100 && (
        <div className="mt-3 p-2 rounded-lg border border-line/50 bg-mist/30">
          <p className="text-[10px] font-bold text-muted">
            Complete all required fields before publishing for best search visibility.
          </p>
        </div>
      )}
    </div>
  )
}
