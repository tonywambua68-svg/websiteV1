import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'

const MEASUREMENT = /^G-[A-Z0-9]+$/

export function usePageMeta(title: string, description?: string) {
  const settings = useSettingsStore((state) => state.settings)
  useEffect(() => {
    const name = settings.business_name || 'OREMITECH'
    document.title = title.includes(name) ? title : `${title} · ${name}`
    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
    const canonicalHref = `${window.location.origin}${window.location.pathname}`
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalHref)
  }, [title, description, settings.business_name])
}

export default function Analytics() {
  const settings = useSettingsStore((state) => state.settings)
  const location = useLocation()

  useEffect(() => {
    const id = settings.ga_measurement_id?.trim()
    if (!id || !MEASUREMENT.test(id) || document.getElementById('ga4')) return
    const script = document.createElement('script')
    script.id = 'ga4'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(script)
    const inline = document.createElement('script')
    inline.id = 'ga4-inline'
    inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`
    document.head.appendChild(inline)
  }, [settings.ga_measurement_id])

  useEffect(() => {
    if (settings.gsc_verification) {
      let meta = document.querySelector('meta[name="google-site-verification"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'google-site-verification')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', settings.gsc_verification)
    }
  }, [settings.gsc_verification])

  useEffect(() => {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
    if (gtag) gtag('event', 'page_view', { page_path: location.pathname + location.search })
  }, [location])

  return null
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  if (gtag) gtag('event', name, params)
}
