import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPrivateIp,
  isPrivateHostname,
  assertSafeUrl,
} from '../../supabase/functions/fetch-product-url/ssrf.ts'
import {
  extractHtmlSpecs,
  normalizeHardware,
  findProductJsonLd,
  parseAllJsonLd,
} from '../../supabase/functions/fetch-product-url/specs.ts'
import {
  detectPriceAndCurrency,
  calculateProvisionalPrice,
} from '../../supabase/functions/fetch-product-url/pricing.ts'
import {
  generateOremitechDescription,
  generateOremitechSeo,
} from '../../supabase/functions/fetch-product-url/content.ts'

// ============================================================================
// 1. SSRF & Security Protection Suite
// ============================================================================
test('SSRF: blocks loopback, private IPs, and cloud metadata IPs', () => {
  // IPv4 Private & Loopback
  assert.equal(isPrivateIp('127.0.0.1'), true)
  assert.equal(isPrivateIp('127.0.1.10'), true)
  assert.equal(isPrivateIp('10.0.0.1'), true)
  assert.equal(isPrivateIp('10.254.1.99'), true)
  assert.equal(isPrivateIp('172.16.0.1'), true)
  assert.equal(isPrivateIp('172.31.255.254'), true)
  assert.equal(isPrivateIp('192.168.1.1'), true)
  assert.equal(isPrivateIp('192.168.100.50'), true)
  assert.equal(isPrivateIp('0.0.0.0'), true)

  // AWS/GCP/Azure link-local cloud metadata
  assert.equal(isPrivateIp('169.254.169.254'), true)
  assert.equal(isPrivateIp('169.254.1.1'), true)

  // Carrier-grade NAT (100.64.0.0/10)
  assert.equal(isPrivateIp('100.64.0.1'), true)
  assert.equal(isPrivateIp('100.127.255.255'), true)

  // Multicast & Reserved
  assert.equal(isPrivateIp('224.0.0.1'), true)
  assert.equal(isPrivateIp('240.0.0.1'), true)

  // IPv6 Private & Local
  assert.equal(isPrivateIp('::1'), true)
  assert.equal(isPrivateIp('fe80::1'), true)
  assert.equal(isPrivateIp('fc00::1'), true)
  assert.equal(isPrivateIp('fd00::1'), true)

  // Public IP addresses must NOT be blocked
  assert.equal(isPrivateIp('8.8.8.8'), false)
  assert.equal(isPrivateIp('1.1.1.1'), false)
  assert.equal(isPrivateIp('104.26.10.12'), false)
  assert.equal(isPrivateIp('142.250.190.46'), false)
})

test('SSRF: blocks private hostnames and local domains', () => {
  assert.equal(isPrivateHostname('localhost'), true)
  assert.equal(isPrivateHostname('app.localhost'), true)
  assert.equal(isPrivateHostname('router.local'), true)
  assert.equal(isPrivateHostname('server.internal'), true)
  assert.equal(isPrivateHostname('metadata.google.internal'), true)
  assert.equal(isPrivateHostname('instance-data'), true)
  assert.equal(isPrivateHostname('127.0.0.1'), true)
  assert.equal(isPrivateHostname('169.254.169.254'), true)

  // Public domain must NOT be blocked
  assert.equal(isPrivateHostname('oremitech.co.ke'), false)
  assert.equal(isPrivateHostname('example.com'), false)
  assert.equal(isPrivateHostname('supplier.co.uk'), false)
})

test('SSRF: assertSafeUrl strictly enforces scheme, ports and target hostnames', () => {
  // Disallowed schemes
  assert.throws(() => assertSafeUrl('ftp://supplier.com/product'), /Only http and https/)
  assert.throws(() => assertSafeUrl('file:///etc/passwd'), /Only http and https/)
  assert.throws(() => assertSafeUrl('gopher://internal.com'), /Only http and https/)

  // Disallowed ports
  assert.throws(() => assertSafeUrl('http://supplier.com:8080/p'), /port that is not permitted/)
  assert.throws(() => assertSafeUrl('https://supplier.com:8443/p'), /port that is not permitted/)
  assert.throws(() => assertSafeUrl('http://supplier.com:22/p'), /port that is not permitted/)

  // Disallowed targets
  assert.throws(() => assertSafeUrl('http://localhost:80/secret'), /target is not permitted/)
  assert.throws(() => assertSafeUrl('http://169.254.169.254/metadata'), /target is not permitted/)
  assert.throws(() => assertSafeUrl('http://127.0.0.1/admin'), /target is not permitted/)
  assert.throws(() => assertSafeUrl('http://192.168.1.1/setup'), /target is not permitted/)

  // Valid URLs
  const u1 = assertSafeUrl('https://supplier.com/item/123')
  assert.equal(u1.hostname, 'supplier.com')
  const u2 = assertSafeUrl('http://laptopdeals.co.ke/hp-elitebook')
  assert.equal(u2.hostname, 'laptopdeals.co.ke')
})

// ============================================================================
// 2. Hardware Extraction & Normalization: HP EliteBook 850 G7
// ============================================================================
test('Extraction: HP EliteBook 850 G7 extracts full hardware specifications', () => {
  const title = 'HP EliteBook 850 G7 15.6" Laptop Intel Core i7-10610U 16GB RAM 512GB SSD Windows 10 Pro'
  const htmlTableSpecs = {
    'Processor': 'Intel Core i7-10610U 1.8GHz up to 4.9GHz',
    'Installed RAM': '16GB DDR4-2666 SDRAM',
    'Internal Storage': '512GB PCIe NVMe M.2 SSD',
    'Screen Size': '15.6 inch FHD (1920 x 1080) Anti-glare IPS',
    'Graphics Controller': 'Integrated Intel UHD Graphics',
    'Operating System': 'Windows 10 Pro 64-bit',
    'Condition': 'Refurbished (Ex-UK)',
    'Warranty': '6 Months OREMITECH Warranty',
    'Part Number': '204F2EA',
  }

  const { specs, provenance } = normalizeHardware(title, htmlTableSpecs)

  assert.equal(specs.brand, 'HP')
  assert.equal(specs.model, 'EliteBook 850 G7')
  assert.equal(specs.processor_manufacturer, 'Intel')
  assert.equal(specs.processor_model, 'Intel Core i7-10610U')
  assert.equal(specs.processor_generation, '10th Gen')
  assert.equal(specs.ram, '16 GB')
  assert.equal(specs.ram_type, 'DDR4')
  assert.equal(specs.storage_capacity, '512 GB')
  assert.equal(specs.storage_type, 'PCIe NVMe M.2 SSD')
  assert.equal(specs.screen_size, '15.6"')
  assert.equal(specs.screen_resolution, '1920 x 1080 (FHD)')
  assert.equal(specs.display_technology, 'IPS')
  assert.equal(specs.graphics, 'Intel UHD Graphics')
  assert.equal(specs.operating_system, 'Windows 10 Pro')
  assert.equal(specs.laptop_condition, 'Refurbished (Ex-UK)')
  assert.equal(specs.warranty, '6 Months OREMITECH Warranty')
  assert.equal(specs.category, 'laptops')
  assert.equal(specs.mpn, '204F2EA')

  // Verify that an extracted spec is NOT automatically verified
  assert.notEqual(provenance.processor_model.status, 'verified')
  assert.equal(provenance.processor_model.status, 'extracted')
})

// ============================================================================
// 3. Hardware Extraction & Normalization: HP EliteBook x360 1040 G8 (Touchscreen)
// ============================================================================
test('Extraction: HP EliteBook x360 1040 G8 detects convertible touch & 11th Gen i7', () => {
  const title = 'HP EliteBook x360 1040 G8 14-inch Touchscreen 2-in-1 Laptop'
  const htmlTableSpecs = {
    'CPU': 'Intel Core i7-1185G7 vPro processor',
    'Memory': '32 GB LPDDR4x-4266 MHz RAM',
    'Primary Drive': '1 TB PCIe NVMe M.2 SSD',
    'Display': '14.0" diagonal FHD IPS eDP BrightView Touch Screen (1920x1080)',
    'Video Adapter': 'Intel Iris Xe Graphics',
    'OS': 'Windows 11 Pro',
    'Condition': 'Brand New Factory Sealed',
    'Warranty': '1 Year Manufacturer Warranty',
  }

  const { specs } = normalizeHardware(title, htmlTableSpecs)

  assert.equal(specs.brand, 'HP')
  assert.equal(specs.model, 'EliteBook x360 1040 G8')
  assert.equal(specs.processor_model, 'Intel Core i7-1185G7')
  assert.equal(specs.processor_generation, '11th Gen')
  assert.equal(specs.ram, '32 GB')
  assert.equal(specs.ram_type, 'LPDDR4X')
  assert.equal(specs.storage_capacity, '1 TB')
  assert.equal(specs.screen_size, '14.0"')
  assert.equal(specs.screen_resolution, '1920 x 1080 (FHD)')
  assert.equal(specs.touchscreen, 'Yes (Touchscreen)')
  assert.equal(specs.graphics, 'Intel Iris Xe Graphics')
  assert.equal(specs.operating_system, 'Windows 11 Pro')
  assert.equal(specs.laptop_condition, 'Brand New Factory Sealed')
  assert.equal(specs.warranty, '1 Year Manufacturer Warranty')
})

// ============================================================================
// 4. Hardware Extraction & Normalization: Lenovo ThinkPad T14 Gen 1 (AMD Ryzen)
// ============================================================================
test('Extraction: Lenovo ThinkPad T14 Gen 1 AMD Ryzen 7 PRO normalization', () => {
  const title = 'Lenovo ThinkPad T14 Gen 1 14" Business Laptop'
  const rawSpecs = {
    'Processor': 'AMD Ryzen 7 PRO 4750U Processor',
    'RAM Size': '16GB DDR4 3200MHz',
    'Hard Drive': '512GB SSD M.2 2280 NVMe',
    'Screen': '14.0" FHD (1920 x 1080), IPS, anti-glare, non-touch',
    'GPU': 'Integrated AMD Radeon Graphics',
    'Operating System': 'Windows 10 Pro',
  }

  const { specs } = normalizeHardware(title, rawSpecs)

  assert.equal(specs.brand, 'Lenovo')
  assert.equal(specs.model, 'ThinkPad T14 Gen 1')
  assert.equal(specs.processor_manufacturer, 'AMD')
  assert.equal(specs.processor_model, 'AMD Ryzen 7 PRO 4750U')
  assert.equal(specs.processor_generation, '4000 Series')
  assert.equal(specs.ram, '16 GB')
  assert.equal(specs.ram_type, 'DDR4')
  assert.equal(specs.storage_capacity, '512 GB')
  assert.equal(specs.screen_size, '14.0"')
  assert.equal(specs.screen_resolution, '1920 x 1080 (FHD)')
  assert.equal(specs.display_technology, 'IPS')
  assert.equal(specs.touchscreen, 'No (Non-touch)')
  assert.equal(specs.graphics, 'AMD Radeon Graphics')
  assert.equal(specs.operating_system, 'Windows 10 Pro')
})

// ============================================================================
// 5. HTML Table and Definition List Extraction
// ============================================================================
test('Extraction: extracts specification tables and definition lists from HTML', () => {
  const sampleHtml = `
    <div class="product-specs">
      <table>
        <tr><th>Processor</th><td>Intel Core i5-1135G7</td></tr>
        <tr><th>RAM</th><td>8GB DDR4</td></tr>
        <tr><th>Storage</th><td>256GB NVMe SSD</td></tr>
      </table>
      <dl>
        <dt>Display Size</dt><dd>14.0 inch</dd>
        <dt>Operating System</dt><dd>Windows 11 Home</dd>
      </dl>
    </div>
  `

  const extracted = extractHtmlSpecs(sampleHtml)
  assert.equal(extracted['Processor'], 'Intel Core i5-1135G7')
  assert.equal(extracted['RAM'], '8GB DDR4')
  assert.equal(extracted['Storage'], '256GB NVMe SSD')
  assert.equal(extracted['Display Size'], '14.0 inch')
  assert.equal(extracted['Operating System'], 'Windows 11 Home')
})

// ============================================================================
// 6. Multi-Currency Detection & Tiered Pricing Engine
// ============================================================================
test('Pricing: detects foreign currencies and never assumes unstated price is KES', () => {
  // USD price
  const usd = detectPriceAndCurrency(650, 'USD')
  assert.equal(usd.originalCurrency, 'USD')
  assert.equal(usd.originalPrice, 650)
  assert.equal(usd.fxRateToKes, 132.5)
  assert.equal(usd.estimatedKesCost, 86125)

  // Explicit KES price
  const kes = detectPriceAndCurrency('45,000', 'KES')
  assert.equal(kes.originalCurrency, 'KES')
  assert.equal(kes.originalPrice, 45000)
  assert.equal(kes.estimatedKesCost, 45000)

  // AED price
  const aed = detectPriceAndCurrency('2,500', 'AED')
  assert.equal(aed.originalCurrency, 'AED')
  assert.equal(aed.originalPrice, 2500)
  assert.equal(aed.fxRateToKes, 36.1)
  assert.equal(aed.estimatedKesCost, 90250)

  // Text context parsing: $399
  const parsedFromText = detectPriceAndCurrency(null, null, 'Special clearance price: $399.00 while stocks last')
  assert.equal(parsedFromText.originalCurrency, 'USD')
  assert.equal(parsedFromText.originalPrice, 399)

  // Unstated currency without symbol: must NOT assume KES
  const unknownCur = detectPriceAndCurrency(500, null, 'Price 500 without currency symbol')
  assert.equal(unknownCur.originalCurrency, null)
  assert.equal(unknownCur.isConfidenceHigh, false)
})

test('Pricing: tiered markup rules applied accurately to acquisition costs', () => {
  // Item cost KSh 1,500 (Tier 0-2000 -> 35% markup)
  const tier1 = calculateProvisionalPrice(1500)
  assert.equal(tier1.markupPct, 35)
  assert.equal(tier1.provisionalPrice, 2100) // 1500 * 1.35 = 2025 -> rounded up to 2100

  // Item cost KSh 8,000 (Tier 5001-10000 -> 25% markup)
  const tier3 = calculateProvisionalPrice(8000)
  assert.equal(tier3.markupPct, 25)
  assert.equal(tier3.provisionalPrice, 10000)

  // Item cost KSh 45,000 (Tier 30001-60000 -> 15% markup)
  const tier5 = calculateProvisionalPrice(45000)
  assert.equal(tier5.markupPct, 15)
  assert.equal(tier5.provisionalPrice, 51800) // 45000 * 1.15 = 51750 -> rounded up to 51800

  // Item cost KSh 85,000 (Tier above 60000 -> 12% markup)
  const tier6 = calculateProvisionalPrice(85000)
  assert.equal(tier6.markupPct, 12)
  assert.equal(tier6.provisionalPrice, 95200) // 85000 * 1.12 = 95200
})

// ============================================================================
// 7. Structured 8-Section OREMITECH Description & SEO Generation
// ============================================================================
test('Content: generates all 8 required OREMITECH description sections without hallucination', () => {
  const specs = {
    product_name: 'HP EliteBook 850 G7',
    brand: 'HP',
    model: 'EliteBook 850 G7',
    processor_manufacturer: 'Intel',
    processor_model: 'Intel Core i7-10610U',
    processor_generation: '10th Gen',
    ram: '16 GB',
    ram_type: 'DDR4',
    storage_capacity: '512 GB',
    storage_type: 'PCIe NVMe M.2 SSD',
    screen_size: '15.6"',
    screen_resolution: '1920 x 1080 (FHD)',
    display_technology: 'IPS',
    touchscreen: 'No (Non-touch)',
    graphics: 'Intel UHD Graphics',
    operating_system: 'Windows 10 Pro',
    laptop_condition: 'Refurbished (Ex-UK)',
    warranty: '6 Months OREMITECH Warranty',
    category: 'laptops',
    mpn: '204F2EA',
    keyboard_layout: 'US QWERTY Backlit',
    colour: 'Silver',
    weight: '1.75 kg',
    battery_condition: 'Excellent (>85% health)',
  }

  const desc = generateOremitechDescription('HP EliteBook 850 G7', specs, 62000)

  // Verify all 8 structured sections exist in output
  assert.ok(desc.full_text.includes('### 1. Product Overview'))
  assert.ok(desc.full_text.includes('### 2. Processor Performance'))
  assert.ok(desc.full_text.includes('### 3. Memory and Multitasking'))
  assert.ok(desc.full_text.includes('### 4. Storage'))
  assert.ok(desc.full_text.includes('### 5. Display'))
  assert.ok(desc.full_text.includes('### 6. Design and Productivity'))
  assert.ok(desc.full_text.includes('### 7. Key Features and Specifications'))
  assert.ok(desc.full_text.includes('### 8. OREMITECH Verification & Delivery'))

  // Verify fact-checking: contains exact processor, ram, storage
  assert.ok(desc.processor.includes('Intel Core i7-10610U'))
  assert.ok(desc.processor.includes('10th Gen'))
  assert.ok(desc.memory.includes('16 GB'))
  assert.ok(desc.storage.includes('512 GB'))
  assert.ok(desc.display.includes('15.6"'))
  assert.ok(desc.contact_info.includes('Nairobi'))
})

test('SEO: generates Kenyan market-focused titles, meta descriptions, and slugs', () => {
  const specs = {
    product_name: 'Lenovo ThinkPad T14 Gen 1',
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 1',
    processor_manufacturer: 'AMD',
    processor_model: 'AMD Ryzen 7 PRO 4750U',
    processor_generation: '4000 Series',
    ram: '16 GB',
    ram_type: 'DDR4',
    storage_capacity: '512 GB',
    storage_type: 'SSD',
    screen_size: '14.0"',
    screen_resolution: '1920 x 1080 (FHD)',
    display_technology: 'IPS',
    touchscreen: 'No',
    graphics: 'AMD Radeon Graphics',
    operating_system: 'Windows 10 Pro',
    laptop_condition: 'Refurbished',
    warranty: '6 Months',
    category: 'laptops',
    mpn: '',
    keyboard_layout: '',
    colour: '',
    weight: '',
    battery_condition: '',
  }

  const seo = generateOremitechSeo('Lenovo ThinkPad T14 Gen 1', specs, 58000)

  assert.ok(seo.title.includes('Lenovo ThinkPad T14 Gen 1'))
  assert.ok(seo.title.includes('OREMITECH Kenya'))
  assert.ok(seo.title.length <= 65)
  assert.ok(seo.meta_description.includes('Kenya'))
  assert.ok(seo.meta_description.includes('Nairobi'))
  assert.ok(seo.meta_description.length <= 160)
  assert.equal(seo.slug, 'lenovo-thinkpad-t14-gen-1')
  assert.ok(seo.secondary_keywords.includes('Nairobi'))
})

// ============================================================================
// 8. Categories: Accessories and Other Electronics
// ============================================================================
test('Categories: recognizes computer accessories, storage, memory, monitors, and gadgets', () => {
  const mouse = normalizeHardware('Logitech MX Master 3S Wireless Performance Mouse', {})
  assert.equal(mouse.specs.category, 'computer-accessories')

  const ssd = normalizeHardware('Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD', {})
  assert.equal(ssd.specs.category, 'storage')

  const ram = normalizeHardware('Crucial 16GB DDR4 3200MHz SODIMM Laptop Memory Module', {})
  assert.equal(ram.specs.category, 'memory')

  const monitor = normalizeHardware('Dell UltraSharp 27 4K USB-C Hub Monitor (U2723QE)', {})
  assert.equal(monitor.specs.category, 'monitors')

  const desktop = normalizeHardware('HP EliteDesk 800 G6 Desktop Mini PC Intel Core i7 16GB 512GB SSD', {})
  assert.equal(desktop.specs.category, 'desktops')
})
