/**
 * Marketplace adapters — modular, compliance-first.
 *
 * HOW INTAKE WORKS (no scraping, ever):
 *  • AliExpress — official Affiliate API / Affiliate Product CSV export,
 *    pasted/uploaded by the admin as JSON. (API keys stay SERVER-SIDE; the
 *    browser never holds them.)
 *  • Alibaba — official Open Platform / authorised sourcing feed JSON.
 *  • CSV/JSON — generic feed for any permitted supplier.
 *  • Sample — built-in static electronics data for safe testing.
 *
 * Product URLs are RECORDED so every import can be reviewed at its source.
 * They are never fetched automatically from the browser.
 */

import type { MarketplaceAdapter, RawFeedItem } from "./types";

function must(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/* ---------------- AliExpress (official affiliate feed JSON) ---------------- */
export const aliexpressAdapter: MarketplaceAdapter = {
  id: "aliexpress",
  label: "AliExpress",
  intake:
    "Paste the JSON from AliExpress's official Affiliate API / product-feed export. Keys understood: productId, productUrl/productDetailUrl, productTitle/productName, brand, model, sku, category/categoryName, price (or salePrice/originalPrice), currency, moq/minOrder, stock/totalAvailQuantity, sellerName/shopName, shippingInfo, deliveryTime, images/imageUrls.",
  isValidUrl: (url) => /^https?:\/\/(www\.)?(aliexpress\.(com|us)|s\.click\.aliexpress\.com)\/\S+/i.test(url.trim()),
  parseFeed: (json) => parseGeneric(json, "aliexpress"),
};

/* ---------------- Alibaba (official Open Platform feed JSON) ---------------- */
export const alibabaAdapter: MarketplaceAdapter = {
  id: "alibaba",
  label: "Alibaba",
  intake:
    "Paste the JSON from Alibaba's official Open Platform / authorised sourcing feed. Same key conventions as AliExpress; MOQ and supplier fields are honoured.",
  isValidUrl: (url) => /^https?:\/\/(www\.)?(alibaba\.com|detail\.1688\.com|offer\.alibaba\.com)\/\S+/i.test(url.trim()),
  parseFeed: (json) => parseGeneric(json, "alibaba"),
};

/* ---------------- Generic CSV/JSON ---------------- */
export const csvAdapter: MarketplaceAdapter = {
  id: "csv",
  label: "CSV / JSON feed",
  intake:
    "Paste JSON (array of products) or CSV with headers: name, brand, model, sku, category, price, currency, moq, stock, url, seller, description. CSV is converted automatically.",
  isValidUrl: (url) => /^https?:\/\/\S+/i.test(url.trim()),
  parseFeed: (json) => parseGeneric(json, "csv"),
};

export const ADAPTERS: MarketplaceAdapter[] = [aliexpressAdapter, alibabaAdapter, csvAdapter];
export const adapterById = (id: string) => ADAPTERS.find((a) => a.id === id) ?? csvAdapter;

/* ---------------- tolerant parser shared by all adapters ---------------- */
const pick = (o: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    const v = o[k] ?? o[k.toLowerCase()] ?? o[k.replace(/^./, (c) => c.toLowerCase())];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

export function csvToJson(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  must(lines.length >= 2, "CSV needs a header row and at least one product row.");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const o: Record<string, unknown> = {};
    headers.forEach((h, i) => (o[h] = cells[i]));
    return o;
  });
}

function parseGeneric(raw: string, source: string): RawFeedItem[] {
  const trimmed = raw.trim();
  let rows: Record<string, unknown>[];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("That JSON could not be parsed. Check for trailing commas or unquoted keys.");
    }
    const arr = Array.isArray(parsed)
      ? parsed
      : ((parsed as Record<string, unknown>).products ?? (parsed as Record<string, unknown>).items ?? (parsed as Record<string, unknown>).data);
    must(Array.isArray(arr), 'Expected a JSON array (or an object with a "products" array).');
    rows = arr as Record<string, unknown>[];
  } else {
    rows = csvToJson(trimmed);
  }
  must(rows.length > 0, "The feed contains no product rows.");

  const items: RawFeedItem[] = [];
  rows.forEach((r, i) => {
    const name = String(pick(r, ["productTitle", "productName", "title", "name"]) ?? "").trim();
    const url = String(pick(r, ["productUrl", "productDetailUrl", "url", "link"]) ?? "").trim();
    const priceRaw = pick(r, ["salePrice", "price", "originalPrice", "cost"]);
    if (!name || priceRaw === undefined) return; // skip invalid rows quietly; reported by caller
    const images = pick(r, ["images", "imageUrls", "imageUrl", "image"]);
    items.push({
      sourceProductId: String(pick(r, ["productId", "itemId", "id", "product_id"]) ?? `${source}-${i + 1}`),
      sourceUrl: url || `https://example.com/source/${source}-${i + 1}`,
      name,
      brand: String(pick(r, ["brand", "brandName"]) ?? "").trim() || undefined,
      model: String(pick(r, ["model", "modelNumber"]) ?? "").trim() || undefined,
      sku: String(pick(r, ["sku", "skuId"]) ?? "").trim() || undefined,
      description: String(pick(r, ["description", "productDescription", "desc"]) ?? "").trim() || undefined,
      specs: Array.isArray(r.specs) ? (r.specs as [string, string][]) : undefined,
      sourceCategory: String(pick(r, ["category", "categoryName", "categoryId", "category_name"]) ?? "Uncategorised"),
      currency: (String(pick(r, ["currency", "currencyCode"]) ?? "USD").toUpperCase() as RawFeedItem["currency"]) || "USD",
      price: Number(String(priceRaw).replace(/[^0-9.]/g, "")) || 0,
      moq: Number(pick(r, ["moq", "minOrder", "minOrderQuantity"]) ?? 1) || 1,
      stock: pick(r, ["stock", "totalAvailQuantity", "quantity"]) !== undefined ? Number(pick(r, ["stock", "totalAvailQuantity", "quantity"])) : undefined,
      seller: String(pick(r, ["sellerName", "shopName", "supplier", "seller"]) ?? "").trim() || undefined,
      shippingInfo: String(pick(r, ["shippingInfo", "shipping"]) ?? "").trim() || undefined,
      etaDays: String(pick(r, ["deliveryTime", "eta", "deliveryTimeEstimate"]) ?? "").trim() || undefined,
      imageUrls: Array.isArray(images)
        ? images.map(String)
        : typeof images === "string" && images
          ? [images]
          : undefined,
    });
  });
  must(items.length > 0, "No valid products found (each row needs at least a name and a price).");
  return items;
}

/* ---------------- built-in sample feed (safe testing) ---------------- */
export const SAMPLE_FEED: RawFeedItem[] = [
  {
    sourceProductId: "AE-100231", sourceUrl: "https://aliexpress.example/item/100231.html",
    name: "NBook 14 Ultrabook!!! 🔥 BEST QUALITY 🔥 free shipping 14 inch 2.2K IPS i7 16GB 512GB laptop computer notebook",
    brand: "NBook", model: "NB14-U7", sku: "NB14-U7-16512",
    description: "<p><b>TOP SELLER!</b> 2025 new NBook 14 ultrabook, aluminum body, <br/>2.2K IPS display, Intel-class 10-core processor, 16GB LPDDR5, 512GB NVMe SSD, backlit keyboard, fingerprint, 70Wh battery. Free shipping! Buy now!!!</p>",
    specs: [["display", '14" 2240×1400 IPS 300nit'], ["processor", "10-core, up to 4.4GHz"], ["ram", "16GB LPDDR5"], ["storage", "512GB NVMe SSD"], ["battery", "70Wh, up to 12h"], ["weight", "1.35kg"], ["os", "Windows 11 Pro"]],
    sourceCategory: "Laptop Computers", currency: "USD", price: 465, moq: 1, stock: 46, seller: "ShenTech Digital Store",
    shippingInfo: "AliExpress Standard Shipping", etaDays: "12–18 days",
    imageUrls: ["https://ae-pic.example/100231-1.jpg", "https://ae-pic.example/100231-2.jpg"],
  },
  {
    sourceProductId: "AE-100442", sourceUrl: "https://aliexpress.example/item/100442.html",
    name: "Gaming laptop 15.6 inch 144Hz RTX-class GPU 16GB RAM 1TB SSD RGB keyboard computer for gamers wholesale",
    brand: "DragonCore", model: "DC15-G", sku: "DC15-G-161T",
    description: "15.6\" FHD 144Hz gaming laptop, dedicated 8GB graphics, 16GB DDR5, 1TB NVMe, per-key RGB, dual-fan cooling.",
    specs: [["display", '15.6" FHD 144Hz'], ["graphics", "Dedicated 8GB GDDR6"], ["ram", "16GB DDR5"], ["storage", "1TB NVMe SSD"], ["battery", "55Wh"]],
    sourceCategory: "Gaming Laptops", currency: "USD", price: 899, moq: 1, stock: 12, seller: "DragonCore Official",
    shippingInfo: "DHL Express", etaDays: "7–10 days",
  },
  {
    sourceProductId: "AE-100587", sourceUrl: "https://aliexpress.example/item/100587.html",
    name: "Mini PC desktop computer Ryzen-class 8-core 32GB RAM 1TB SSD 4K dual display HDMI 2.1 WiFi 6E tiny pc",
    brand: "Kore", model: "K-Mini M8", sku: "KM8-321T",
    description: "Pocket desktop: 8-core CPU, 32GB DDR5 (2×SODIMM), 1TB NVMe, dual 4K@60Hz, 2.5G LAN + WiFi 6E, VESA mount.",
    specs: [["cpu", "8-core, up to 4.7GHz"], ["ram", "32GB DDR5 (expandable 64GB)"], ["storage", "1TB NVMe + 2.5\" SATA bay"], ["ports", "2×HDMI 2.1, 2×USB4, 2.5G LAN"], ["wifi", "WiFi 6E + BT 5.3"]],
    sourceCategory: "Mini PC", currency: "USD", price: 385, moq: 2, stock: 60, seller: "Kore Computing",
    shippingInfo: "AliExpress Standard Shipping", etaDays: "10–15 days",
  },
  {
    sourceProductId: "AE-100611", sourceUrl: "https://aliexpress.example/item/100611.html",
    name: 'Curved gaming monitor 27 inch 165Hz QHD 1500R freesync HDR400 1ms computer screen display wholesale',
    brand: "Orbita", model: "OV27-Q165", sku: "OV27Q165",
    description: "27\" 2560×1440 VA curved (1500R), 165Hz, 1ms MPRT, FreeSync Premium, HDR400, height-adjustable stand.",
    specs: [["panel", '27" VA 1500R'], ["resolution", "2560×1440 QHD"], ["refresh", "165Hz, 1ms MPRT"], ["hdr", "HDR400, 350nit"], ["stand", "Height/tilt/swivel"]],
    sourceCategory: "Monitors & Accessories", currency: "USD", price: 218, moq: 1, stock: 34, seller: "Orbita Display Store",
  },
  {
    sourceProductId: "AE-100725", sourceUrl: "https://aliexpress.example/item/100725.html",
    name: "Smartphone X20 Pro 6.7 inch AMOLED 120Hz 108MP camera 12GB 256GB 5G phone 100W charge NFC global version",
    brand: "Zuva", model: "X20 Pro", sku: "ZX20P-12256",
    description: "6.7\" AMOLED 120Hz, 108MP main + 8MP ultrawide, 12GB RAM, 256GB storage, 5000mAh, 100W wired charging, NFC, 5G dual SIM.",
    specs: [["display", '6.7" AMOLED 120Hz'], ["camera", "108MP + 8MP UW + 2MP macro"], ["ram/storage", "12GB / 256GB"], ["battery", "5000mAh, 100W"], ["network", "5G dual SIM, NFC"]],
    sourceCategory: "Smartphones", currency: "USD", price: 312, moq: 1, stock: 80, seller: "Zuva Mobile Official",
    shippingInfo: "AliExpress Standard Shipping", etaDays: "10–14 days",
  },
  {
    sourceProductId: "AE-100802", sourceUrl: "https://aliexpress.example/item/100802.html",
    name: "Tablet 11 inch 2K screen 8GB 128GB android 14 tablet pc 8000mAh quad speaker for students online learning",
    brand: "Nexon", model: "T11-S", sku: "NT11-8128",
    description: "11\" 2000×1200 display, 8GB RAM, 128GB + microSD, 8000mAh, quad speakers, metal body, Android 14.",
    specs: [["display", '11" 2000×1200 IPS'], ["ram/storage", "8GB / 128GB + microSD"], ["battery", "8000mAh, 18W"], ["os", "Android 14"], ["audio", "Quad speakers"]],
    sourceCategory: "Tablets & E-Readers", currency: "USD", price: 149, moq: 2, stock: 120, seller: "Nexon Digital",
  },
  {
    sourceProductId: "AE-100917", sourceUrl: "https://aliexpress.example/item/100917.html",
    name: "NVMe SSD 2TB PCIe Gen4 7000MB/s M.2 2280 solid state drive for laptop desktop ps5 heatsink version",
    brand: "Kore", model: "NV1-2T", sku: "KNV1-2TB",
    description: "2TB PCIe 4.0×4 NVMe, sequential read up to 7000MB/s, TLC NAND, graphene heatsink, 5-year maker warranty.",
    specs: [["capacity", "2TB"], ["interface", "PCIe 4.0 ×4 NVMe 1.4"], ["speed", "Up to 7000/6000 MB/s"], ["form", "M.2 2280"], ["warranty", "5-year limited"]],
    sourceCategory: "Computer Storage", currency: "USD", price: 96, moq: 5, stock: 200, seller: "Kore Storage Factory",
  },
  {
    sourceProductId: "AE-101034", sourceUrl: "https://aliexpress.example/item/101034.html",
    name: "DDR5 RAM 16GB 5600MHz SODIMM laptop memory 1.1V notebook ram single module wholesale",
    brand: "Voltik", model: "D5-5600-16S", sku: "VD5-16S56",
    description: "16GB DDR5-5600 SODIMM, 1.1V, CL46, for laptops and mini PCs. Single module.",
    specs: [["capacity", "16GB"], ["type", "DDR5 SODIMM"], ["speed", "5600MHz CL46"], ["voltage", "1.1V"]],
    sourceCategory: "Memory / RAM", currency: "USD", price: 34, moq: 10, stock: 500, seller: "Voltik Memory Store",
  },
  {
    sourceProductId: "AE-101158", sourceUrl: "https://aliexpress.example/item/101158.html",
    name: "Mechanical keyboard 75% hot swap gasket mount RGB wireless tri-mode 2.4G bluetooth wired for gaming office",
    brand: "Meshi", model: "K75-G", sku: "MK75-TRI",
    description: "75% gasket-mount mechanical keyboard, hot-swap sockets, tri-mode (2.4G/BT/USB-C), 4000mAh, south-facing RGB.",
    specs: [["layout", "75% (81 keys)"], ["switches", "Hot-swap, 3/5-pin"], ["modes", "2.4G + BT5.1 + USB-C"], ["battery", "4000mAh"]],
    sourceCategory: "Computer Peripherals", currency: "USD", price: 42, moq: 2, stock: 90, seller: "Meshi Peripherals",
  },
  {
    sourceProductId: "AE-101260", sourceUrl: "https://aliexpress.example/item/101260.html",
    name: "Wireless earbuds ANC 48dB bluetooth 5.4 headphones 40h playtime ENC calls earphones for phone laptop",
    brand: "Pulse", model: "AirPro 4", sku: "PAP4-ANC",
    description: "Hybrid ANC up to 48dB, BT 5.4, 10mm drivers, 40h total playtime with case, ENC quad-mic calls, IPX5.",
    specs: [["anc", "Hybrid, up to 48dB"], ["bluetooth", "5.4, multipoint"], ["playtime", "10h + 30h case"], ["mics", "4× ENC"], ["rating", "IPX5"]],
    sourceCategory: "Earphones & Headphones", currency: "USD", price: 27, moq: 5, stock: 300, seller: "Pulse Audio Official",
  },
  {
    sourceProductId: "AE-101371", sourceUrl: "https://aliexpress.example/item/101371.html",
    name: "WiFi 7 router BE5000 dual band 5000Mbps mesh gaming router 4x4 MU-MIMO 2.5G WAN LAN home wifi",
    brand: "Meshi", model: "M7-BE5000", sku: "MM7-5000",
    description: "WiFi 7 BE5000, dual-band 4×4, 2.5G WAN + 3×2.5G LAN, mesh-ready, game acceleration QoS.",
    specs: [["standard", "WiFi 7 (802.11be)"], ["speed", "BE5000 dual-band"], ["ports", "1×2.5G WAN + 3×2.5G LAN"], ["features", "Mesh, QoS, WPA3"]],
    sourceCategory: "Networking", currency: "USD", price: 89, moq: 1, stock: 44, seller: "Meshi Networking",
  },
  {
    sourceProductId: "AE-101488", sourceUrl: "https://aliexpress.example/item/101488.html",
    name: "Power bank 20000mAh 65W fast charging PD powerbank for laptop phone USB C digital display portable charger",
    brand: "Voltik", model: "PB20-65", sku: "VPB2065",
    description: "20,000mAh, 65W USB-C PD (charges laptops), dual output, digital display, airline-safe 74Wh.",
    specs: [["capacity", "20,000mAh / 74Wh"], ["output", "65W USB-C PD + 22.5W USB-A"], ["display", "LED % indicator"], ["recharge", "45W input, ~1.5h"]],
    sourceCategory: "Chargers & Power", currency: "USD", price: 31, moq: 5, stock: 250, seller: "Voltik Power Store",
  },
  {
    sourceProductId: "AE-101592", sourceUrl: "https://aliexpress.example/item/101592.html",
    name: "1080P webcam with microphone auto focus usb web camera for pc laptop streaming meetings privacy cover",
    brand: "Orbita", model: "W1080-AF", sku: "OWC-1080",
    description: "1080p30 webcam, autofocus, dual noise-cancelling mics, 75° FOV, privacy cover, plug-and-play USB-A.",
    specs: [["resolution", "1080p @ 30fps"], ["focus", "Auto, 10cm–∞"], ["mic", "Dual NC mics"], ["fov", "75°"], ["mount", "Clip + tripod thread"]],
    sourceCategory: "Webcams", currency: "USD", price: 18, moq: 10, stock: 400, seller: "Orbita Vision",
  },
  {
    sourceProductId: "AE-101655", sourceUrl: "https://aliexpress.example/item/101655.html",
    name: "USB C hub 8 in 1 dock hdmi 4k 60hz usb 3.0 pd 100w sd tf ethernet rj45 adapter for macbook laptop",
    brand: "Kore", model: "H8-PRO", sku: "KH8-PRO",
    description: "8-in-1: HDMI 4K@60Hz, 3×USB 3.0, 100W PD passthrough, SD/TF, gigabit Ethernet, aluminium shell.",
    specs: [["video", "HDMI 4K@60Hz"], ["usb", "3× USB-A 3.0"], ["pd", "100W passthrough"], ["card", "SD + TF"], ["ethernet", "Gigabit RJ45"]],
    sourceCategory: "Hubs & Adapters", currency: "USD", price: 16.5, moq: 10, stock: 600, seller: "Kore Accessories",
  },
];
