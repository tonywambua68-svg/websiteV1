import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'

export default function StructuredData() {
  const settings = useSettingsStore((state) => state.settings)
  const location = useLocation()

  useEffect(() => {
    const head = document.head
    const baseUrl = window.location.origin
    const currentUrl = `${baseUrl}${location.pathname}`

    head.querySelectorAll('[data-schema]').forEach((el) => el.remove())

    const addSchema = (data: Record<string, unknown>) => {
      const script = document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      script.setAttribute('data-schema', 'true')
      script.textContent = JSON.stringify(data)
      head.appendChild(script)
    }

    // Organization schema
    const orgLogo = settings.store_email ? `${baseUrl}/logo.png` : undefined
    addSchema({
      '@context': 'https://schema.org/',
      '@type': 'Organization',
      name: settings.business_name || 'OREMITECH',
      url: baseUrl,
      logo: orgLogo ? [{ '@type': 'ImageObject', url: orgLogo }] : undefined,
      contactPoint: settings.whatsapp_e164 || settings.store_email
        ? {
            '@type': 'ContactPoint',
            telephone: settings.whatsapp_e164 || undefined,
            email: settings.store_email || undefined,
            contactType: 'customer service',
            availableLanguage: ['English', 'Swahili'],
            areaServed: 'KE',
          }
        : undefined,
      address: settings.store_location
        ? {
            '@type': 'PostalAddress',
            addressCountry: 'KE',
            addressLocality: settings.store_location,
          }
        : undefined,
      sameAs: [],
    })

    // WebSite schema
    addSchema({
      '@context': 'https://schema.org/',
      '@type': 'WebSite',
      name: settings.business_name || 'OREMITECH',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    })

    // LocalBusiness schema (only if we have real location info)
    if (settings.store_location || settings.store_email || settings.whatsapp_e164) {
      addSchema({
        '@context': 'https://schema.org/',
        '@type': 'LocalBusiness',
        name: settings.business_name || 'OREMITECH',
        url: baseUrl,
        telephone: settings.whatsapp_e164 || undefined,
        email: settings.store_email || undefined,
        address: settings.store_location
          ? {
              '@type': 'PostalAddress',
              addressCountry: 'KE',
              addressLocality: settings.store_location,
            }
          : undefined,
        priceRange: 'KSh',
      })
    }

    // BreadcrumbList based on current path
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts.length > 0) {
      const items: Array<Record<string, unknown>> = []
      let accumulatedPath = ''
      items.push({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      })
      pathParts.forEach((part, index) => {
        accumulatedPath += `/${part}`
        let label = part
        if (part === 'shop') label = 'Shop'
        if (part === 'blog') label = 'Blog'
        if (part === 'product') label = 'Products'
        items.push({
          '@type': 'ListItem',
          position: index + 2,
          name: label,
          item: `${baseUrl}${accumulatedPath}`,
        })
      })
      addSchema({
        '@context': 'https://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: items,
      })
    }
  }, [settings, location])

  return null
}
