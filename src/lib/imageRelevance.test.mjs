import test from 'node:test'
import assert from 'node:assert/strict'
import { buildProductIdentity, hasBlockingWords } from './imageRelevance.ts'
import {
  buildIdentity,
  extractScoredCandidates,
  pickCandidates,
  scoreImage,
} from '../../supabase/functions/fetch-product-url/scoring.ts'

const PRODUCTS = [
  {
    title: 'Dell Latitude 5420 Laptop',
    brand: 'Dell',
    model: 'Latitude 5420',
    categorySlug: 'laptops',
    query: 'Dell Latitude 5420 laptop product images',
    models: ['5420'],
    family: ['latitude'],
  },
  {
    title: 'HP EliteBook 840 G8 Laptop',
    brand: 'HP',
    model: '840 G8',
    categorySlug: 'laptops',
    query: 'HP EliteBook 840 G8 laptop product images',
    models: ['840'],
    family: ['elitebook'],
  },
  {
    title: 'Lenovo ThinkPad T14 Gen 2 Laptop',
    brand: 'Lenovo',
    model: 'T14 Gen 2',
    categorySlug: 'laptops',
    query: 'Lenovo ThinkPad T14 Gen 2 laptop product images',
    models: ['t14'],
    family: ['thinkpad'],
  },
]

test('image query uses brand + family + model + generation, never a category term', () => {
  for (const product of PRODUCTS) {
    const identity = buildProductIdentity({
      title: product.title,
      brand: product.brand,
      model: product.model,
      categorySlug: product.categorySlug,
    })
    assert.equal(identity.query, product.query)
    assert.deepEqual(identity.family, product.family)
    for (const model of product.models) assert.ok(identity.models.includes(model), `${model} missing`)
    assert.ok(!/^laptops? product images$/i.test(identity.query))
  }
})

test('identity is shared by the edge scorer', () => {
  for (const product of PRODUCTS) {
    const identity = buildIdentity({
      title: product.title,
      brand: product.brand,
      model: product.model,
      category: 'laptops',
    })
    assert.equal(identity.query, product.query)
  }
})

function image(url, alt, method = 'gallery', context = 'product gallery') {
  return { url, alt, context, method, width: 800, height: 600 }
}

test('exact model candidates are accepted and unrelated models rejected', () => {
  const identity = buildIdentity({ title: 'Dell Latitude 5420 Laptop', brand: 'Dell', category: 'laptops' })

  const exact = scoreImage(identity, image('https://cdn.example.com/dell-latitude-5420-front.jpg', 'Dell Latitude 5420 front'))
  assert.equal(exact.relevance, 'exact')

  const otherModel = scoreImage(identity, image('https://cdn.example.com/dell-latitude-5410-front.jpg', 'Dell Latitude 5410'))
  assert.notEqual(otherModel.relevance, 'exact')

  const bag = scoreImage(identity, image('https://cdn.example.com/laptop-bag.jpg', 'Laptop bag'))
  assert.equal(bag.relevance, 'rejected')

  const banner = scoreImage(identity, image('https://cdn.example.com/black-friday-banner.jpg', 'Sale banner'))
  assert.equal(banner.relevance, 'rejected')

  const related = scoreImage(identity, image('https://cdn.example.com/related-laptop.jpg', 'Related laptops'))
  assert.equal(related.relevance, 'rejected')
})

test('generic inline page images are dropped, gallery exact images kept', () => {
  const identity = buildIdentity({ title: 'HP EliteBook 840 G8 Laptop', brand: 'HP', category: 'laptops' })
  const scored = [
    scoreImage(identity, image('https://cdn.example.com/hero.jpg', 'Laptop', 'inline', 'page hero')),
    scoreImage(identity, image('https://cdn.example.com/hp-elitebook-840-g8.jpg', 'HP EliteBook 840 G8', 'gallery')),
  ]
  const picked = pickCandidates(scored)
  assert.equal(picked.length, 1)
  assert.equal(picked[0].relevance, 'exact')
})

test('HTML extraction separates gallery images from recommendations for each model', () => {
  const html = `
    <html><head>
      <meta property="og:image" content="/media/dell-latitude-5420-main.jpg" />
      <script type="application/ld+json">{"@type":"Product","name":"Dell Latitude 5420","brand":{"name":"Dell"},"image":["/media/5420-a.jpg","/media/5420-b.jpg"]}</script>
    </head><body>
      <div class="product-gallery">
        <img src="/media/5420-a.jpg" alt="Dell Latitude 5420 front" width="1200" height="900" />
        <img data-src="/media/5420-b.jpg" alt="Dell Latitude 5420 side" />
      </div>
      <div class="recommended-products">
        <img src="/media/hp-elitebook-840-g8.jpg" alt="HP EliteBook 840 G8" />
        <img src="/media/lenovo-thinkpad-t14.jpg" alt="Lenovo ThinkPad T14" />
      </div>
      <img src="/media/laptop-bag.jpg" alt="Laptop bag" />
      <img src="/media/black-friday-banner.jpg" alt="Sale banner" />
    </body></html>`

  const identity = buildIdentity({ title: 'Dell Latitude 5420 Laptop', brand: 'Dell', category: 'laptops' })
  const scored = extractScoredCandidates(identity, html, 'https://supplier.example.com/dell-latitude-5420')
  const accepted = pickCandidates(scored).filter((c) => c.relevance === 'exact' || c.relevance === 'likely')

  const urls = accepted.map((c) => c.url)
  assert.ok(urls.includes('https://supplier.example.com/media/5420-a.jpg'))
  assert.ok(urls.includes('https://supplier.example.com/media/5420-b.jpg'))
  assert.ok(!urls.some((u) => u.includes('hp-elitebook')), 'HP image must not appear on a Dell import')
  assert.ok(!urls.some((u) => u.includes('thinkpad')), 'ThinkPad image must not appear on a Dell import')
  assert.ok(!urls.some((u) => u.includes('bag')))
  assert.ok(!urls.some((u) => u.includes('banner')))
})

test('the three products never share accepted candidates', () => {
  const pages = [
    {
      title: 'Dell Latitude 5420 Laptop',
      brand: 'Dell',
      html: '<div class="product-gallery"><img src="/img/latitude-5420.jpg" alt="Dell Latitude 5420"/></div>',
      expected: 'latitude-5420',
    },
    {
      title: 'HP EliteBook 840 G8 Laptop',
      brand: 'HP',
      html: '<div class="product-gallery"><img src="/img/elitebook-840-g8.jpg" alt="HP EliteBook 840 G8"/></div>',
      expected: 'elitebook-840-g8',
    },
    {
      title: 'Lenovo ThinkPad T14 Gen 2 Laptop',
      brand: 'Lenovo',
      html: '<div class="product-gallery"><img src="/img/thinkpad-t14-gen2.jpg" alt="Lenovo ThinkPad T14 Gen 2"/></div>',
      expected: 'thinkpad-t14-gen2',
    },
  ]

  const acceptedByProduct = pages.map((page) => {
    const identity = buildIdentity({ title: page.title, brand: page.brand, category: 'laptops' })
    const scored = extractScoredCandidates(identity, page.html, 'https://supplier.example.com/p/1')
    return pickCandidates(scored)
      .filter((c) => c.relevance === 'exact' || c.relevance === 'likely')
      .map((c) => c.url)
  })

  assert.equal(acceptedByProduct[0].length, 1)
  assert.equal(acceptedByProduct[1].length, 1)
  assert.equal(acceptedByProduct[2].length, 1)
  assert.ok(acceptedByProduct[0][0].includes('latitude-5420'))
  assert.ok(acceptedByProduct[1][0].includes('elitebook-840-g8'))
  assert.ok(acceptedByProduct[2][0].includes('thinkpad-t14-gen2'))
})

test('accessory and banner blocking respects products that are themselves accessories', () => {
  const laptop = buildProductIdentity({ title: 'Dell Latitude 5420 Laptop', brand: 'Dell', categorySlug: 'laptops' })
  assert.ok(hasBlockingWords(laptop, { url: 'https://x/bag.jpg', alt: 'Laptop bag' }))

  const bagIdentity = buildProductIdentity({
    title: 'Dell laptop bag 15 inch',
    brand: 'Dell',
    categorySlug: 'computer-accessories',
  })
  assert.equal(hasBlockingWords(bagIdentity, { url: 'https://x/dell-bag.jpg', alt: 'Dell laptop bag' }), null)
})
