export type CategoryId =
  | "laptops" | "phones" | "tablets" | "gaming" | "audio"
  | "monitors" | "networking" | "accessories" | "smart";

export type ArtKind =
  | "laptop" | "phone" | "tablet" | "monitor" | "tv" | "keyboard" | "mouse"
  | "headphones" | "earbuds" | "speaker" | "powerbank" | "charger" | "watch"
  | "camera" | "router" | "ssd" | "webcam" | "printer" | "tower";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  art: ArtKind;
  hue: string;
  tagline: string;
  description: string;
  specs: [string, string][];
  stock: number;
  condition: "New" | "Certified Refurbished";
  tags: ("deal" | "new" | "bestseller")[];
  sold: number;
  ram?: string;
  storage?: string;
  screen?: string;
  processor?: string;
  graphics?: string;
  battery?: string;
  warranty: string;
  inBox: string[];
}

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  hue: string;
}

export const CATEGORIES: Category[] = [
  { id: "laptops", name: "Laptops", short: "Ultrabooks, student & pro machines", hue: "#0b7a63" },
  { id: "phones", name: "Phones", short: "Smartphones for every budget", hue: "#0e7490" },
  { id: "gaming", name: "Gaming", short: "Rigs, laptops & battle gear", hue: "#b45309" },
  { id: "audio", name: "Audio", short: "Headphones, earbuds & speakers", hue: "#7c3aed" },
  { id: "monitors", name: "Monitors & TVs", short: "Displays for work & play", hue: "#0369a1" },
  { id: "networking", name: "Networking", short: "Routers, mesh & connectivity", hue: "#4d7c0f" },
  { id: "accessories", name: "Accessories", short: "Chargers, storage & essentials", hue: "#be185d" },
  { id: "smart", name: "Smart Devices", short: "Watches, cameras & webcams", hue: "#c2410c" },
  { id: "tablets", name: "Tablets", short: "For school, work & kids", hue: "#0f766e" },
];

export const catName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

const P = (p: Product) => p;

export const PRODUCTS: Product[] = [
  // ---------------- LAPTOPS ----------------
  P({
    id: "p1", name: "Vyra AeroBook 14", brand: "Vyra", category: "laptops",
    price: 84999, oldPrice: 94999, rating: 4.8, reviews: 214, art: "laptop", hue: "#0b7a63",
    tagline: "The all-rounder professionals trust.",
    description: "A featherweight aluminium ultrabook built for long days. The 2.2K display, 16GB of RAM and all-day battery make it equally at home in a Nairobi boardroom or a university lecture hall.",
    specs: [["Display", '14" 2.2K IPS, 400 nits'], ["Processor", "VX-7 OctaCore, up to 4.6GHz"], ["Memory", "16GB LPDDR5"], ["Storage", "512GB NVMe SSD"], ["Graphics", "Integrated Vega-X"], ["Battery", "Up to 14 hours, 65W fast charge"], ["Weight", "1.32 kg"], ["OS", "Windows 11 Home"]],
    stock: 24, condition: "New", tags: ["bestseller"], sold: 310,
    ram: "16GB", storage: "512GB", screen: '14"', processor: "VX-7 OctaCore", graphics: "Vega-X", battery: "14 hrs",
    warranty: "24-month Imara warranty", inBox: ["AeroBook 14", "65W USB-C charger", "USB-C cable", "Sleeve (gift)"],
  }),
  P({
    id: "p2", name: "Nexon SwiftGo 15", brand: "Nexon", category: "laptops",
    price: 56500, oldPrice: 62000, rating: 4.5, reviews: 162, art: "laptop", hue: "#0e7490",
    tagline: "Big screen, sensible price.",
    description: "A dependable 15.6-inch workhorse with a full number pad — ideal for accounting, admin work and everyday browsing. Certified refurbished and tested to like-new condition.",
    specs: [["Display", '15.6" FHD anti-glare'], ["Processor", "QX-5 HexaCore, up to 4.1GHz"], ["Memory", "8GB DDR4 (expandable to 32GB)"], ["Storage", "512GB NVMe SSD"], ["Graphics", "Integrated"], ["Battery", "Up to 9 hours"], ["Weight", "1.7 kg"], ["OS", "Windows 11 Home"]],
    stock: 18, condition: "Certified Refurbished", tags: ["deal"], sold: 240,
    ram: "8GB", storage: "512GB", screen: '15.6"', processor: "QX-5 HexaCore", graphics: "Integrated", battery: "9 hrs",
    warranty: "12-month Imara warranty", inBox: ["SwiftGo 15", "45W charger", "Power cable"],
  }),
  P({
    id: "p3", name: "Vyra AeroBook Pro 16", brand: "Vyra", category: "laptops",
    price: 149999, oldPrice: 165000, rating: 4.9, reviews: 98, art: "laptop", hue: "#10312c",
    tagline: "Flagship power, crafted in aluminium.",
    description: "Our most advanced laptop. A stunning 3K 120Hz display, 32GB of unified memory and desktop-class graphics in a chassis that weighs less than your charger used to.",
    specs: [["Display", '16" 3K IPS, 120Hz, 500 nits'], ["Processor", "VX-9 Pro 12-core"], ["Memory", "32GB LPDDR5X"], ["Storage", "1TB NVMe SSD"], ["Graphics", "Vega-X Pro 8GB"], ["Battery", "Up to 16 hours, 100W charge"], ["Weight", "1.78 kg"], ["OS", "Windows 11 Pro"]],
    stock: 9, condition: "New", tags: ["new"], sold: 96,
    ram: "32GB", storage: "1TB", screen: '16"', processor: "VX-9 Pro", graphics: "Vega-X Pro 8GB", battery: "16 hrs",
    warranty: "24-month Imara warranty", inBox: ["AeroBook Pro 16", "100W GaN charger", "USB-C cable"],
  }),
  P({
    id: "p4", name: "Nexon SwiftGo 13 Student", brand: "Nexon", category: "laptops",
    price: 39999, oldPrice: 44500, rating: 4.3, reviews: 301, art: "laptop", hue: "#4d7c0f",
    tagline: "The campus favourite.",
    description: "Compact, light and easy on a student budget. Handles research, Zoom classes and streaming without breaking a sweat — or a bank balance.",
    specs: [["Display", '13.3" FHD'], ["Processor", "QX-3 QuadCore"], ["Memory", "8GB DDR4"], ["Storage", "256GB NVMe SSD"], ["Graphics", "Integrated"], ["Battery", "Up to 10 hours"], ["Weight", "1.25 kg"], ["OS", "Windows 11 Home"]],
    stock: 41, condition: "New", tags: ["bestseller"], sold: 520,
    ram: "8GB", storage: "256GB", screen: '13.3"', processor: "QX-3 QuadCore", graphics: "Integrated", battery: "10 hrs",
    warranty: "12-month Imara warranty", inBox: ["SwiftGo 13", "45W charger", "Power cable"],
  }),
  P({
    id: "p5", name: "Orbita FlexBook 14 2-in-1", brand: "Orbita", category: "laptops",
    price: 72000, rating: 4.6, reviews: 77, art: "laptop", hue: "#7c3aed",
    tagline: "Laptop, tent, tablet. Your call.",
    description: "A 360° hinge and included stylus turn this touchscreen laptop into a sketchbook or a movie stand. Great for creatives and presenters.",
    specs: [["Display", '14" FHD touchscreen, 360° hinge'], ["Processor", "QX-7 HexaCore"], ["Memory", "16GB DDR5"], ["Storage", "512GB NVMe SSD"], ["Graphics", "Integrated Iris"], ["Battery", "Up to 11 hours"], ["Weight", "1.45 kg"], ["OS", "Windows 11 Home"]],
    stock: 13, condition: "New", tags: ["new"], sold: 88,
    ram: "16GB", storage: "512GB", screen: '14"', processor: "QX-7 HexaCore", graphics: "Iris", battery: "11 hrs",
    warranty: "12-month Imara warranty", inBox: ["FlexBook 14", "Stylus pen", "65W charger"],
  }),

  // ---------------- GAMING ----------------
  P({
    id: "p6", name: "Riftcore Havoc 15", brand: "Riftcore", category: "gaming",
    price: 139999, oldPrice: 155000, rating: 4.7, reviews: 143, art: "laptop", hue: "#b45309",
    tagline: "144 frames or it didn't happen.",
    description: "A dedicated RX-8 graphics engine, 144Hz display and twin-fan cooling keep AAA titles smooth and temperatures down. RGB keyboard included, victory not guaranteed.",
    specs: [["Display", '15.6" FHD 144Hz'], ["Processor", "VX-9 8-core"], ["Memory", "16GB DDR5 (expandable)"], ["Storage", "1TB NVMe SSD"], ["Graphics", "RX-8 8GB dedicated"], ["Battery", "Up to 6 hours"], ["Weight", "2.3 kg"], ["OS", "Windows 11 Home"]],
    stock: 11, condition: "New", tags: ["deal"], sold: 180,
    ram: "16GB", storage: "1TB", screen: '15.6"', processor: "VX-9 8-core", graphics: "RX-8 8GB", battery: "6 hrs",
    warranty: "24-month Imara warranty", inBox: ["Havoc 15", "230W charger", "Gaming mousepad"],
  }),
  P({
    id: "p7", name: "Riftcore Havoc 17", brand: "Riftcore", category: "gaming",
    price: 189999, rating: 4.8, reviews: 64, art: "laptop", hue: "#dc2626",
    tagline: "Desktop killer, backpack size.",
    description: "The big one. A 17.3-inch 165Hz panel, 32GB of memory and our highest-wattage RX-9 graphics. Built for streamers and esports grinders.",
    specs: [["Display", '17.3" QHD 165Hz'], ["Processor", "VX-9 12-core"], ["Memory", "32GB DDR5"], ["Storage", "1TB NVMe SSD + free slot"], ["Graphics", "RX-9 12GB dedicated"], ["Battery", "Up to 5 hours"], ["Weight", "2.8 kg"], ["OS", "Windows 11 Pro"]],
    stock: 5, condition: "New", tags: ["new"], sold: 61,
    ram: "32GB", storage: "1TB", screen: '17.3"', processor: "VX-9 12-core", graphics: "RX-9 12GB", battery: "5 hrs",
    warranty: "24-month Imara warranty", inBox: ["Havoc 17", "280W charger", "Backpack"],
  }),
  P({
    id: "p8", name: "Riftcore Strike RGB Keyboard", brand: "Riftcore", category: "gaming",
    price: 8999, oldPrice: 11500, rating: 4.6, reviews: 428, art: "keyboard", hue: "#b45309",
    tagline: "Hot-swappable. Loud on purpose.",
    description: "Mechanical switches, per-key RGB and a solid aluminium top plate. Hot-swap sockets let you tune the feel without soldering.",
    specs: [["Layout", "75%, hot-swappable"], ["Switches", "Linear Red (pre-installed)"], ["Backlight", "Per-key RGB, 16.8M colours"], ["Connection", "USB-C, Bluetooth 5.2"], ["Battery", "4000mAh, up to 90 hrs"], ["Frame", "Aluminium top plate"]],
    stock: 56, condition: "New", tags: ["deal"], sold: 640,
    warranty: "12-month Imara warranty", inBox: ["Strike keyboard", "Keycap puller", "USB-C cable", "Extra switches ×4"],
  }),
  P({
    id: "p9", name: "Riftcore Viper 16K Mouse", brand: "Riftcore", category: "gaming",
    price: 4500, oldPrice: 5999, rating: 4.5, reviews: 512, art: "mouse", hue: "#dc2626",
    tagline: "58 grams of pure aim.",
    description: "An ultralight esports mouse with a 16,000 DPI optical sensor and flexible paracord cable. Flick-friendly, wrist-friendly.",
    specs: [["Sensor", "16,000 DPI optical"], ["Weight", "58 g"], ["Buttons", "6 programmable"], ["Polling rate", "1000 Hz"], ["Cable", "Paracord, 1.8 m"], ["Feet", "100% PTFE"]],
    stock: 74, condition: "New", tags: ["bestseller"], sold: 830,
    warranty: "12-month Imara warranty", inBox: ["Viper mouse", "Extra grip tape", "Sticker pack"],
  }),
  P({
    id: "p10", name: "Riftcore Halo 27 165Hz", brand: "Riftcore", category: "monitors",
    price: 34999, oldPrice: 39999, rating: 4.7, reviews: 119, art: "monitor", hue: "#b45309",
    tagline: "See the shot before they do.",
    description: "A 27-inch QHD fast-IPS panel with 165Hz refresh and 1ms response. Adaptive sync keeps every frame tear-free.",
    specs: [["Display", '27" QHD (2560×1440) Fast IPS'], ["Refresh rate", "165Hz, 1ms GtG"], ["Sync", "Adaptive-Sync / G-Sync compatible"], ["HDR", "HDR400"], ["Ports", "2× HDMI 2.1, DP 1.4, audio out"], ["Stand", "Height & tilt adjustable"]],
    stock: 16, condition: "New", tags: ["deal"], sold: 210,
    screen: '27"', warranty: "24-month Imara warranty", inBox: ["Halo 27 monitor", "DisplayPort cable", "Power cable"],
  }),

  // ---------------- PHONES ----------------
  P({
    id: "p11", name: "Zuva Nova X5", brand: "Zuva", category: "phones",
    price: 34500, oldPrice: 39999, rating: 4.6, reviews: 356, art: "phone", hue: "#0e7490",
    tagline: "Flagship feel, mid-range price.",
    description: "A vivid 6.6-inch AMOLED display, a 108MP main camera and two full days of battery. Dual SIM with dedicated M-Pesa quick-key support.",
    specs: [["Display", '6.6" AMOLED, 120Hz'], ["Processor", "ZT-8 OctaCore"], ["Memory", "8GB RAM + 256GB storage"], ["Camera", "108MP + 8MP ultrawide + 2MP macro"], ["Battery", "5000mAh, 67W fast charge"], ["SIM", "Dual SIM 4G/5G"]],
    stock: 33, condition: "New", tags: ["deal"], sold: 480,
    ram: "8GB", storage: "256GB", screen: '6.6"', processor: "ZT-8 OctaCore", battery: "5000mAh",
    warranty: "12-month Imara warranty", inBox: ["Nova X5", "67W charger", "Case", "Screen protector (fitted)"],
  }),
  P({
    id: "p12", name: "Zuva Nova S3", brand: "Zuva", category: "phones",
    price: 18999, oldPrice: 21500, rating: 4.4, reviews: 512, art: "phone", hue: "#0b7a63",
    tagline: "The everyday champion.",
    description: "Everything you actually use — a smooth 90Hz screen, a capable 50MP camera and battery that outlasts your day. Kenya's best value phone this year.",
    specs: [["Display", '6.5" IPS, 90Hz'], ["Processor", "ZT-6 OctaCore"], ["Memory", "6GB RAM + 128GB storage"], ["Camera", "50MP + 2MP depth"], ["Battery", "5000mAh, 33W charge"], ["SIM", "Dual SIM 4G"]],
    stock: 48, condition: "New", tags: ["bestseller"], sold: 940,
    ram: "6GB", storage: "128GB", screen: '6.5"', processor: "ZT-6 OctaCore", battery: "5000mAh",
    warranty: "12-month Imara warranty", inBox: ["Nova S3", "33W charger", "Case"],
  }),
  P({
    id: "p13", name: "Zuva Prime Ultra", brand: "Zuva", category: "phones",
    price: 74999, rating: 4.8, reviews: 87, art: "phone", hue: "#10312c",
    tagline: "The one to beat.",
    description: "Our finest phone. A 200MP camera system with real optical zoom, a 6.8-inch LTPO display and satellite SOS. Unapologetically premium.",
    specs: [["Display", '6.8" LTPO AMOLED, 1–120Hz'], ["Processor", "ZT-9 Pro"], ["Memory", "12GB RAM + 512GB storage"], ["Camera", "200MP + 50MP periscope + 12MP ultrawide"], ["Battery", "5500mAh, 100W charge"], ["Extras", "Satellite SOS, IP68"]],
    stock: 7, condition: "New", tags: ["new"], sold: 42,
    ram: "12GB", storage: "512GB", screen: '6.8"', processor: "ZT-9 Pro", battery: "5500mAh",
    warranty: "24-month Imara warranty", inBox: ["Prime Ultra", "100W charger", "Leather case"],
  }),

  // ---------------- TABLETS ----------------
  P({
    id: "p14", name: "Orbita Slate 11", brand: "Orbita", category: "tablets",
    price: 32999, oldPrice: 36500, rating: 4.5, reviews: 145, art: "tablet", hue: "#0f766e",
    tagline: "School, work and everything after.",
    description: "An 11-inch 2K display with quad speakers and a keyboard-ready design. The tablet half of a student's toolkit.",
    specs: [["Display", '11" 2K IPS, 90Hz'], ["Processor", "QX-7 HexaCore"], ["Memory", "8GB RAM + 128GB storage"], ["Battery", "8600mAh, 33W charge"], ["Extras", "Keyboard pins, stylus support"]],
    stock: 19, condition: "New", tags: ["deal"], sold: 160,
    ram: "8GB", storage: "128GB", screen: '11"', processor: "QX-7 HexaCore", battery: "8600mAh",
    warranty: "12-month Imara warranty", inBox: ["Slate 11", "33W charger", "USB-C cable"],
  }),

  // ---------------- AUDIO ----------------
  P({
    id: "p15", name: "Pulse BudsPro ANC", brand: "Pulse", category: "audio",
    price: 7999, oldPrice: 9999, rating: 4.6, reviews: 634, art: "earbuds", hue: "#7c3aed",
    tagline: "Silence the matatu. Keep the music.",
    description: "Active noise cancellation, transparency mode and 30 hours of total playtime with the case. Punchy bass tuned for Afrobeats.",
    specs: [["ANC", "Hybrid, up to -38dB"], ["Battery", "8 hrs buds + 22 hrs case"], ["Bluetooth", "5.3, multipoint"], ["Rating", "IPX5 sweat resistant"], ["Charging", "USB-C + wireless case"]],
    stock: 62, condition: "New", tags: ["bestseller"], sold: 1150,
    battery: "30 hrs total", warranty: "12-month Imara warranty", inBox: ["BudsPro", "Charging case", "3× ear tip sizes", "USB-C cable"],
  }),
  P({
    id: "p16", name: "Halcyon QuietMax 700", brand: "Halcyon", category: "audio",
    price: 15999, oldPrice: 18999, rating: 4.7, reviews: 208, art: "headphones", hue: "#0e7490",
    tagline: "Sixty hours of quiet.",
    description: "Over-ear ANC headphones with class-leading 60-hour battery, plush memory-foam cups and a foldable travel design.",
    specs: [["ANC", "Adaptive, 6-mic array"], ["Battery", "60 hrs (ANC on: 40 hrs)"], ["Driver", "40mm bio-cellulose"], ["Bluetooth", "5.3, LDAC Hi-Res"], ["Weight", "254 g"]],
    stock: 14, condition: "New", tags: ["deal"], sold: 290,
    battery: "60 hrs", warranty: "24-month Imara warranty", inBox: ["QuietMax 700", "Hard case", "USB-C cable", "3.5mm cable"],
  }),
  P({
    id: "p17", name: "Pulse BassBox Party", brand: "Pulse", category: "audio",
    price: 21999, rating: 4.5, reviews: 96, art: "speaker", hue: "#dc2626",
    tagline: "Bring the sherehe.",
    description: "A 60W party speaker with light show, karaoke mic input and 20 hours of battery. Pairs with a second BassBox for true stereo.",
    specs: [["Output", "60W RMS, 2.1 channels"], ["Battery", "20 hrs, built-in powerbank"], ["Rating", "IPX6 splash proof"], ["Inputs", "BT 5.2, USB, AUX, mic"], ["Extras", "RGB light ring"]],
    stock: 12, condition: "New", tags: [], sold: 130,
    battery: "20 hrs", warranty: "12-month Imara warranty", inBox: ["BassBox", "Wired mic", "Power cable"],
  }),
  P({
    id: "p18", name: "Pulse BassPro ANC", brand: "Pulse", category: "audio",
    price: 11500, oldPrice: 13999, rating: 4.5, reviews: 322, art: "headphones", hue: "#b45309",
    tagline: "Deep bass, deep focus.",
    description: "Wireless over-ear headphones tuned for bass lovers, with hybrid ANC and a 45-hour battery for long commutes.",
    specs: [["ANC", "Hybrid, -32dB"], ["Battery", "45 hrs (ANC on: 30 hrs)"], ["Driver", "40mm titanium-coated"], ["Bluetooth", "5.2, multipoint"], ["Fold", "Flat + foldable"]],
    stock: 27, condition: "New", tags: ["deal"], sold: 480,
    battery: "45 hrs", warranty: "12-month Imara warranty", inBox: ["BassPro ANC", "Soft case", "USB-C cable", "AUX cable"],
  }),
  P({
    id: "p19", name: "Halcyon Studio One", brand: "Halcyon", category: "audio",
    price: 24999, rating: 4.8, reviews: 96, art: "headphones", hue: "#10312c",
    tagline: "Hear what the artist heard.",
    description: "Reference-tuned planar drivers, detachable balanced cable and lambskin pads. For producers, editors and the beautifully obsessed.",
    specs: [["Driver", "50mm planar magnetic"], ["Response", "10Hz – 40kHz Hi-Res"], ["Impedance", "32Ω (plays from any phone)"], ["Cable", "Detachable 3.5mm + 4.4mm balanced"], ["Pads", "Lambskin memory foam"], ["Weight", "298 g"]],
    stock: 8, condition: "New", tags: ["new"], sold: 74,
    warranty: "24-month Imara warranty", inBox: ["Studio One", "Balanced cable", "3.5mm cable", "Hard case"],
  }),
  P({
    id: "p20", name: "Pulse BoomGo Speaker", brand: "Pulse", category: "audio",
    price: 9500, oldPrice: 12000, rating: 4.6, reviews: 287, art: "speaker", hue: "#b45309",
    tagline: "Party-grade. Pocket-size.",
    description: "360° sound with a passive bass radiator, IPX7 waterproofing and 18 hours per charge. Pair two for true stereo.",
    specs: [["Output", "20W, 360° soundstage"], ["Battery", "18 hrs at 60% volume"], ["Rating", "IPX7 waterproof"], ["Bluetooth", "5.2, stereo pairing"], ["Extras", "Built-in mic, powerbank mode"]],
    stock: 44, condition: "New", tags: ["deal"], sold: 410,
    battery: "18 hrs", warranty: "12-month Imara warranty", inBox: ["BoomGo", "USB-C cable", "Strap"],
  }),

  // ---------------- MONITORS & TV ----------------
  P({
    id: "p21", name: "Nexon ViewSharp 27 4K", brand: "Nexon", category: "monitors",
    price: 46999, oldPrice: 52000, rating: 4.7, reviews: 118, art: "monitor", hue: "#0369a1",
    tagline: "Every pixel earns its place.",
    description: "A 27-inch 4K IPS panel covering 98% DCI-P3 with USB-C that charges your laptop at 65W while it displays. One cable, clean desk.",
    specs: [["Display", '27" 4K UHD IPS'], ["Colour", "98% DCI-P3, factory calibrated"], ["USB-C", "Display + 65W power delivery"], ["Ports", "HDMI 2.0 ×2, DP 1.4, USB hub"], ["Stand", "Height, tilt, swivel, pivot"], ["HDR", "HDR10"]],
    stock: 12, condition: "New", tags: ["deal"], sold: 130,
    screen: '27"', warranty: "24-month Imara warranty", inBox: ["ViewSharp 27", "USB-C cable", "HDMI cable", "Calibration report"],
  }),
  P({
    id: "p22", name: "Nexon ViewSharp 24", brand: "Nexon", category: "monitors",
    price: 17500, rating: 4.5, reviews: 231, art: "monitor", hue: "#0e7490",
    tagline: "The office standard.",
    description: "A clean, borderless 24-inch FHD display with eye-care flicker-free backlight. The monitor half of Kenya's home offices.",
    specs: [["Display", '23.8" FHD IPS, borderless'], ["Refresh", "75Hz with FreeSync"], ["Eye care", "Flicker-free, low blue light"], ["Ports", "HDMI, VGA, DP"], ["Mount", "VESA 100×100"]],
    stock: 31, condition: "New", tags: [], sold: 350,
    screen: '24"', warranty: "24-month Imara warranty", inBox: ["ViewSharp 24", "HDMI cable", "Power cable"],
  }),
  P({
    id: "p23", name: "Halcyon Vision 55 Smart TV", brand: "Halcyon", category: "monitors",
    price: 79999, oldPrice: 89999, rating: 4.8, reviews: 74, art: "tv", hue: "#10312c",
    tagline: "Cinema night, upgraded.",
    description: "A 55-inch 4K QLED panel with Dolby Vision, hands-free voice remote and all your streaming apps pre-installed. Free wall bracket included.",
    specs: [["Display", '55" 4K QLED, Dolby Vision'], ["Smart OS", "VisionOS with app store"], ["Audio", "Dolby Atmos, 2×12W + bass port"], ["Ports", "HDMI 2.1 ×3, USB ×2, optical"], ["Connectivity", "Wi-Fi 6, Bluetooth 5.2, Ethernet"], ["Extras", "Voice remote, wall bracket included"]],
    stock: 6, condition: "New", tags: ["deal"], sold: 82,
    screen: '55"', warranty: "24-month Imara warranty + free installation in Nairobi",
    inBox: ["Vision 55 TV", "Voice remote", "Wall bracket", "Stand"],
  }),

  // ---------------- NETWORKING ----------------
  P({
    id: "p24", name: "Meshi Home Mesh (3-pack)", brand: "Meshi", category: "networking",
    price: 28999, oldPrice: 34500, rating: 4.6, reviews: 154, art: "router", hue: "#4d7c0f",
    tagline: "Wi-Fi in every corner. Even the backyard.",
    description: "Three mesh nodes blanket up to 400m² in fast, seamless Wi-Fi 6. Perfect for maisonettes, apartments with thick walls and compounds.",
    specs: [["Coverage", "Up to 400 m² (3-pack)"], ["Standard", "Wi-Fi 6 AX3000, dual band"], ["Ports", "2× Gigabit per node"], ["Devices", "Up to 150 connected"], ["Setup", "App-guided, 5 minutes"], ["Extras", "Parental controls, guest network"]],
    stock: 21, condition: "New", tags: ["deal"], sold: 170,
    warranty: "24-month Imara warranty", inBox: ["3 mesh nodes", "Ethernet cable", "3 power adapters"],
  }),
  P({
    id: "p25", name: "Meshi AX3000 Router", brand: "Meshi", category: "networking",
    price: 12500, oldPrice: 14000, rating: 4.4, reviews: 203, art: "router", hue: "#0b7a63",
    tagline: "Fibre-ready muscle.",
    description: "Dual-band Wi-Fi 6 with beamforming and four Gigabit ports. Squeezes every megabit out of your fibre or 5G router plan.",
    specs: [["Standard", "Wi-Fi 6 AX3000"], ["Antennas", "4× high-gain, beamforming"], ["Ports", "1× WAN + 3× LAN Gigabit"], ["Security", "WPA3, built-in firewall"], ["Extras", "Mesh-ready, app managed"]],
    stock: 29, condition: "New", tags: [], sold: 260,
    warranty: "24-month Imara warranty", inBox: ["AX3000 router", "Ethernet cable", "Power adapter"],
  }),

  // ---------------- ACCESSORIES ----------------
  P({
    id: "p26", name: "Voltik 20,000mAh Power Bank", brand: "Voltik", category: "accessories",
    price: 4999, oldPrice: 6500, rating: 4.6, reviews: 892, art: "powerbank", hue: "#b45309",
    tagline: "Blackouts, cancelled.",
    description: "Charges a phone four times over, with 22.5W fast charging in both directions and a digital charge display. KPLC's worst enemy.",
    specs: [["Capacity", "20,000mAh / 74Wh"], ["Output", "22.5W USB-C PD + USB-A"], ["Display", "Digital % readout"], ["Pass-through", "Yes — charge bank + phone together"], ["Weight", "398 g"]],
    stock: 88, condition: "New", tags: ["bestseller"], sold: 1400,
    warranty: "12-month Imara warranty", inBox: ["Power bank", "USB-C cable"],
  }),
  P({
    id: "p27", name: "Voltik 65W GaN Charger", brand: "Voltik", category: "accessories",
    price: 3999, oldPrice: 4999, rating: 4.7, reviews: 456, art: "charger", hue: "#0b7a63",
    tagline: "One brick to charge them all.",
    description: "GaN technology packs 65W into a plug smaller than a matchbox. Charges laptops, tablets and phones — two devices at once.",
    specs: [["Output", "65W max (45W + 20W dual)"], ["Ports", "2× USB-C, 1× USB-A"], ["Tech", "GaN II, surge protected"], ["Compatibility", "PD 3.0, QC 4.0, PPS"], ["Weight", "98 g"]],
    stock: 96, condition: "New", tags: ["deal"], sold: 720,
    warranty: "18-month Imara warranty", inBox: ["65W GaN charger", "100W USB-C cable"],
  }),
  P({
    id: "p28", name: "Kore NV1 1TB NVMe SSD", brand: "Kore", category: "accessories",
    price: 11999, oldPrice: 13999, rating: 4.8, reviews: 321, art: "ssd", hue: "#0369a1",
    tagline: "Revive any laptop in 10 minutes.",
    description: "Reads at 3,500MB/s and breathes new life into ageing machines. Clone your old drive with the included software, swap, done.",
    specs: [["Capacity", "1TB"], ["Interface", "NVMe PCIe Gen3 ×4, M.2 2280"], ["Read / Write", "3,500 / 3,000 MB/s"], ["Endurance", "600 TBW"], ["Extras", "Free cloning software"]],
    stock: 40, condition: "New", tags: ["deal"], sold: 380,
    storage: "1TB", warranty: "60-month Imara warranty", inBox: ["NV1 SSD", "Screwdriver", "M.2 screw"],
  }),
  P({
    id: "p29", name: "Vyra AeroDesk Combo", brand: "Vyra", category: "accessories",
    price: 5499, oldPrice: 6499, rating: 4.4, reviews: 176, art: "keyboard", hue: "#0e7490",
    tagline: "Quiet desk, tidy desk.",
    description: "A low-profile wireless keyboard and silent mouse that share one USB receiver. Six months of battery per charge cycle.",
    specs: [["Keyboard", "Low-profile, quiet scissor keys"], ["Mouse", "Silent-click 1600 DPI"], ["Connection", "2.4GHz shared receiver + BT"], ["Battery", "Rechargeable, ~6 months"], ["Layout", "Full size with number pad"]],
    stock: 35, condition: "New", tags: [], sold: 290,
    warranty: "12-month Imara warranty", inBox: ["Keyboard", "Mouse", "USB receiver", "Charging cable"],
  }),
  P({
    id: "p30", name: "Nexon PrintJet M200", brand: "Nexon", category: "accessories",
    price: 21999, rating: 4.3, reviews: 97, art: "printer", hue: "#5c716c",
    tagline: "Print. Scan. Copy. Repeat.",
    description: "An ink-tank all-in-one with genuinely cheap running costs — up to 6,000 pages per bottle set. Wi-Fi printing from any phone.",
    specs: [["Function", "Print, scan, copy"], ["Type", "Ink-tank, refillable"], ["Yield", "~6,000 pages black, 6,500 colour"], ["Speed", "10 ipm black, 5 ipm colour"], ["Connectivity", "Wi-Fi, USB, mobile app"]],
    stock: 0, condition: "New", tags: [], sold: 140,
    warranty: "12-month Imara warranty", inBox: ["PrintJet M200", "Ink bottle set", "Power cable", "USB cable"],
  }),

  // ---------------- SMART ----------------
  P({
    id: "p31", name: "Vyra Watch S2", brand: "Vyra", category: "smart",
    price: 19999, oldPrice: 23999, rating: 4.5, reviews: 267, art: "watch", hue: "#c2410c",
    tagline: "Your health, on your wrist.",
    description: "AMOLED always-on display, dual-band GPS, heart-rate and SpO2 tracking, and 10-day battery. Bluetooth calling included.",
    specs: [["Display", '1.43" AMOLED, always-on'], ["Sensors", "HR, SpO2, sleep, stress"], ["GPS", "Dual-band, 5 systems"], ["Battery", "10 days typical use"], ["Calling", "Bluetooth calls, mic + speaker"], ["Rating", "5ATM water resistant"]],
    stock: 26, condition: "New", tags: ["new"], sold: 320,
    battery: "10 days", warranty: "12-month Imara warranty",
    inBox: ["Watch S2", "Silicone strap", "Magnetic charger"],
  }),
  P({
    id: "p32", name: "Orbita ClearView 4K Webcam", brand: "Orbita", category: "smart",
    price: 13500, rating: 4.4, reviews: 88, art: "webcam", hue: "#0e7490",
    tagline: "Look sharp on every call.",
    description: "True 4K at 30fps with AI framing, auto low-light correction and a dual noise-cancelling mic. Plug in and look professional.",
    specs: [["Sensor", "4K UHD at 30fps / 1080p 60fps"], ["Field of view", "90° with AI framing"], ["Mic", "Dual stereo, noise cancelling"], ["Mount", "Universal clip + tripod thread"], ["Privacy", "Physical lens cover"]],
    stock: 17, condition: "New", tags: ["new"], sold: 95,
    warranty: "12-month Imara warranty", inBox: ["ClearView webcam", "USB-C cable", "Tripod adapter"],
  }),
  P({
    id: "p33", name: "Vyra AeroBook 14 Renewed", brand: "Vyra", category: "laptops",
    price: 64999, oldPrice: 84999, rating: 4.6, reviews: 58, art: "laptop", hue: "#7c3aed",
    tagline: "Flagship specs. Second-life price.",
    description: "A certified refurbished AeroBook 14, professionally inspected, cleaned and restored with a genuine battery. Same machine, smarter money.",
    specs: [["Display", '14" 2.2K IPS'], ["Processor", "VX-7 OctaCore"], ["Memory", "16GB LPDDR5"], ["Storage", "512GB NVMe SSD"], ["Battery", "New genuine cell, 90%+ health"], ["Grade", "A-grade, minimal wear"]],
    stock: 6, condition: "Certified Refurbished", tags: ["deal"], sold: 70,
    ram: "16GB", storage: "512GB", screen: '14"', processor: "VX-7 OctaCore", battery: "12 hrs",
    warranty: "12-month Imara warranty", inBox: ["AeroBook 14 Renewed", "65W charger", "Inspection certificate"],
  }),
  P({
    id: "p34", name: "Halcyon Studio One Renewed", brand: "Halcyon", category: "audio",
    price: 17999, oldPrice: 24999, rating: 4.7, reviews: 31, art: "headphones", hue: "#0369a1",
    tagline: "Reference sound, renewed.",
    description: "Certified refurbished Studio One headphones with new earpads and a fresh cable, tested against factory reference curves.",
    specs: [["Driver", "50mm planar magnetic"], ["Condition", "A-grade, new pads & cable"], ["Cable", "Detachable 3.5mm + 4.4mm"], ["Test", "Factory curve verified"], ["Grade", "A-grade"]],
    stock: 4, condition: "Certified Refurbished", tags: ["deal"], sold: 40,
    warranty: "12-month Imara warranty", inBox: ["Studio One Renewed", "Cables", "Hard case"],
  }),
];

/* ------------------------------------------------------------------
 * Published imports (Product Importer) join the live catalogue through
 * this single choke point. `getAllProducts()` feeds every list surface
 * (Shop, search, NOVA, deals) and `byId()` resolves imported products for
 * detail pages, cart, orders and reviews — no consumer changes needed.
 * ------------------------------------------------------------------ */
import { getPublished } from "../lib/importer/registry";
import { getApiProducts } from "../lib/productApi";

/**
 * The live catalogue, in priority order:
 *   1. Products served by the website API (server.mjs → /api/products), when online
 *   2. The bundled seed catalogue (this file) as the offline fallback
 * plus any imports the admin has PUBLISHED from the in-browser importer.
 */
export function getAllProducts(): Product[] {
  const base = getApiProducts() ?? PRODUCTS;
  const published = getPublished().filter((p) => !base.some((b) => b.id === p.id));
  return [...base, ...published];
}

export const byId = (id: string) => getAllProducts().find((p) => p.id === id);

export const discountOf = (p: Product) =>
  p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

export const fmt = (n: number) => "KSh " + n.toLocaleString("en-KE");

export const categoryFrom = (p: Product) => CATEGORIES.find((c) => c.id === p.category);

export const minPriceIn = (cat: CategoryId) => {
  const list = PRODUCTS.filter((p) => p.category === cat);
  return list.length ? Math.min(...list.map((p) => p.price)) : 0;
};

export const PRODUCTS_IN_CAT = (cat: CategoryId) => PRODUCTS.filter((p) => p.category === cat);
