import { slugify } from './commerce'

export interface ProductSeoInput {
  name: string
  model?: string
  brand?: string
  condition?: string
  processor?: string
  ram?: string
  storage?: string
  category?: string
  warranty?: string
}

export interface ProductSeoFields {
  slug: string
  seo_title: string
  seo_description: string
  seo_focus_keyword: string
  seo_secondary_keywords: string
  seo_social_title: string
  seo_social_description: string
}

function compact(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const shortened = normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, '').trimEnd()
  return `${shortened || normalized.slice(0, maxLength - 1).trimEnd()}…`
}

export function generateProductSeo(input: ProductSeoInput): ProductSeoFields {
  const name = input.name.trim() || 'Laptop'
  const identity = [input.brand?.trim(), input.model?.trim()].filter((part): part is string => Boolean(part))
  const productPhrase = [...identity.filter((part) => !name.toLowerCase().includes(part.toLowerCase())), name]
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(' ')
  const specs = [input.processor?.trim(), input.ram?.trim(), input.storage?.trim()]
    .filter(Boolean)
    .join(', ')
  const condition = input.condition?.trim().replace(/_/g, ' ')
  const warranty = input.warranty?.trim()

  const seoTitle = compact(`${productPhrase} in Kenya | OREMITECH`, 60)
  const descriptionParts = [
    `Shop ${productPhrase} at OREMITECH Kenya.`,
    specs ? `${specs}.` : '',
    condition ? `Condition: ${condition}.` : '',
    warranty ? `${warranty}.` : '',
    'Order online for delivery across Kenya.',
  ].filter(Boolean)
  const seoDescription = compact(descriptionParts.join(' '), 160)
  const socialTitle = compact(`${productPhrase} | OREMITECH Kenya`, 60)

  return {
    slug: slugify(name),
    seo_title: seoTitle,
    seo_description: seoDescription,
    seo_focus_keyword: `${productPhrase} Kenya`,
    seo_secondary_keywords: [input.category, condition, specs, 'buy online Kenya']
      .filter(Boolean)
      .join(', '),
    seo_social_title: socialTitle,
    seo_social_description: seoDescription,
  }
}
