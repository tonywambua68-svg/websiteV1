// Mega menu configuration for the Imara Tech header.
// Category / brand data is derived from src/data/products.json so the menu
// always stays in sync with the catalogue.

import productsJson from '@/data/products.json';
import { Laptop, Smartphone, Gamepad2, Tags, Monitor, Keyboard, Mouse, Headphones, Cpu, HardDrive, BatteryCharging, ShieldCheck, Printer, Camera, Watch, Speaker, type LucideIcon } from 'lucide-react';

export interface MegaSublink {
  label: string;
  to: string;
}

export interface MegaColumn {
  title: string;
  links: MegaSublink[];
}

export interface FeaturedCard {
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  accent: 'amber' | 'teal' | 'ink';
}

export interface MegaMenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
  columns: MegaColumn[];
  featured: FeaturedCard[];
  footerLinks: MegaSublink[];
}

const catalogue = productsJson as Array<{ category: string; brand: string }>;

const brandsIn = (category: string) =>
  Array.from(new Set(catalogue.filter((p) => p.category === category).map((p) => p.brand))).sort();

const shopCat = (category: string, extra = '') =>
  `/shop?category=${encodeURIComponent(category)}${extra}`;

const brandLinks = (category: string): MegaSublink[] =>
  brandsIn(category).map((b) => ({
    label: b,
    to: `${shopCat(category)}&brand=${encodeURIComponent(b)}`,
  }));

const priceLink = (label: string, min?: number, max?: number) => ({
  label,
  to: `/shop${min ? `?minPrice=${min}` : ''}${min && max ? '&' : '?'}${max ? `maxPrice=${max}` : ''}`.replace('?&', '?'),
});

export const megaMenu: MegaMenuItem[] = [
  {
    label: 'Laptops',
    to: shopCat('Laptops'),
    icon: Laptop,
    columns: [
      {
        title: 'Shop by Brand',
        links: brandLinks('Laptops'),
      },
      {
        title: 'Popular Types',
        links: [
          { label: 'Business Laptops', to: `${shopCat('Laptops')}&search=business` },
          { label: 'Ultrabooks', to: `${shopCat('Laptops')}&search=carbon` },
          { label: 'Gaming Laptops', to: `${shopCat('Laptops')}&search=gaming` },
          { label: 'Student Laptops', to: `${shopCat('Laptops')}&search=vivobook` },
          { label: 'Refurbished Deals', to: shopCat('Deals') },
        ],
      },
      {
        title: 'Shop by Price',
        links: [
          priceLink('Under KSh 60,000', undefined, 60000),
          priceLink('KSh 60,000 – 90,000', 60000, 90000),
          priceLink('KSh 90,000 – 130,000', 90000, 130000),
          priceLink('Premium · Above KSh 130,000', 130000),
        ],
      },
    ],
    featured: [
      {
        title: 'MacBook Air M2',
        subtitle: 'All-day battery · From KSh 138,000',
        to: '/product/laptop-005',
        icon: Laptop,
        accent: 'ink',
      },
      {
        title: 'Weekly Laptop Deals',
        subtitle: 'Save up to KSh 15,000',
        to: shopCat('Deals'),
        icon: Tags,
        accent: 'amber',
      },
    ],
    footerLinks: [
      { label: 'Compare all laptops', to: shopCat('Laptops') },
      { label: 'Browse everything', to: '/shop' },
    ],
  },
  {
    label: 'Phones & Tablets',
    to: shopCat('Phones'),
    icon: Smartphone,
    columns: [
      {
        title: 'Shop by Brand',
        links: brandLinks('Phones'),
      },
      {
        title: 'Popular Searches',
        links: [
          { label: 'Android Phones', to: `${shopCat('Phones')}&search=android` },
          { label: 'iPhones', to: `${shopCat('Phones')}&search=iphone` },
          { label: 'Long Battery Life', to: `${shopCat('Phones')}&search=battery` },
          { label: 'Budget Phones', to: `${shopCat('Phones')}&maxPrice=40000` },
          { label: 'Flagship Phones', to: `${shopCat('Phones')}&minPrice=80000` },
        ],
      },
      {
        title: 'Shop by Price',
        links: [
          priceLink('Under KSh 30,000', undefined, 30000),
          priceLink('KSh 30,000 – 60,000', 30000, 60000),
          priceLink('KSh 60,000 – 100,000', 60000, 100000),
          priceLink('Above KSh 100,000', 100000),
        ],
      },
    ],
    featured: [
      {
        title: 'Samsung Galaxy Series',
        subtitle: 'Genuine · Warranty included',
        to: `${shopCat('Phones')}&brand=Samsung`,
        icon: Smartphone,
        accent: 'teal',
      },
      {
        title: 'Phone Offers',
        subtitle: 'M-PESA ready · Fast delivery',
        to: shopCat('Deals'),
        icon: Tags,
        accent: 'amber',
      },
    ],
    footerLinks: [
      { label: 'Compare all phones', to: shopCat('Phones') },
      { label: 'Browse everything', to: '/shop' },
    ],
  },
  {
    label: 'Gaming',
    to: shopCat('Gaming'),
    icon: Gamepad2,
    columns: [
      {
        title: 'Shop by Brand',
        links: brandLinks('Gaming'),
      },
      {
        title: 'Consoles & PCs',
        links: [
          { label: 'PlayStation', to: `${shopCat('Gaming')}&search=playstation` },
          { label: 'Xbox', to: `${shopCat('Gaming')}&search=xbox` },
          { label: 'Gaming Laptops', to: `${shopCat('Gaming')}&search=laptop` },
          { label: 'Gaming Monitors', to: `${shopCat('Gaming')}&search=monitor` },
          { label: 'Controllers', to: `${shopCat('Gaming')}&search=controller` },
        ],
      },
      {
        title: 'Peripherals',
        links: [
          { label: 'Keyboards', to: `${shopCat('Gaming')}&search=keyboard` },
          { label: 'Mice', to: `${shopCat('Gaming')}&search=mouse` },
          { label: 'Headsets', to: `${shopCat('Gaming')}&search=headset` },
          { label: 'Chairs & Desks', to: `${shopCat('Gaming')}&search=chair` },
        ],
      },
    ],
    featured: [
      {
        title: 'Razer Setup Essentials',
        subtitle: 'Level up your battle station',
        to: `${shopCat('Gaming')}&brand=Razer`,
        icon: Gamepad2,
        accent: 'ink',
      },
      {
        title: 'Gaming Deals',
        subtitle: 'Bundle offers this week',
        to: shopCat('Deals'),
        icon: Tags,
        accent: 'amber',
      },
    ],
    footerLinks: [
      { label: 'Shop all gaming gear', to: shopCat('Gaming') },
      { label: 'Browse everything', to: '/shop' },
    ],
  },
  {
    label: 'Accessories',
    to: '/shop?search=accessories',
    icon: Monitor,
    columns: [
      {
        title: 'Displays & Audio',
        links: [
          { label: 'Monitors', to: '/shop?search=monitor', },
          { label: 'Headphones & Earbuds', to: '/shop?search=headphones' },
          { label: 'Speakers', to: '/shop?search=speaker' },
          { label: 'Webcams', to: '/shop?search=webcam' },
        ],
      },
      {
        title: 'Power & Storage',
        links: [
          { label: 'Chargers & Cables', to: '/shop?search=charger' },
          { label: 'Power Banks', to: '/shop?search=power bank' },
          { label: 'SSDs & Hard Drives', to: '/shop?search=ssd' },
          { label: 'RAM Upgrades', to: '/shop?search=ram' },
        ],
      },
      {
        title: 'Protection & More',
        links: [
          { label: 'Laptop Bags', to: '/shop?search=bag' },
          { label: 'Phone Cases', to: '/shop?search=case' },
          { label: 'Screen Protectors', to: '/shop?search=screen protector' },
          { label: 'Cooling Pads', to: '/shop?search=cooling' },
        ],
      },
    ],
    featured: [
      {
        title: 'Complete Your Setup',
        subtitle: 'Monitors, audio & peripherals',
        to: '/shop',
        icon: Speaker,
        accent: 'teal',
      },
      {
        title: 'Trusted Accessories',
        subtitle: 'Genuine parts with warranty',
        to: '/shop?search=warranty',
        icon: ShieldCheck,
        accent: 'amber',
      },
    ],
    footerLinks: [
      { label: 'Shop all products', to: '/shop' },
      { label: 'This week\u2019s deals', to: shopCat('Deals') },
    ],
  },
  {
    label: 'Deals',
    to: shopCat('Deals'),
    icon: Tags,
    columns: [
      {
        title: 'Hot Categories',
        links: [
          { label: 'Laptop Deals', to: shopCat('Deals') },
          { label: 'Phone Deals', to: `${shopCat('Phones')}&maxPrice=50000` },
          { label: 'Gaming Deals', to: `${shopCat('Gaming')}&maxPrice=70000` },
          { label: 'Refurbished Business', to: `${shopCat('Laptops')}&search=elitebook` },
        ],
      },
      {
        title: 'Clearance',
        links: [
          { label: 'Under KSh 50,000', to: '/shop?maxPrice=50000' },
          { label: 'Reduced ThinkPads', to: '/shop?search=thinkpad' },
          { label: 'Xiaomi Value Picks', to: '/shop?search=xiaomi' },
          { label: 'View All Discounts', to: '/shop' },
        ],
      },
    ],
    featured: [
      {
        title: 'Weekend Flash Sale',
        subtitle: 'Up to 15% off selected items',
        to: shopCat('Deals'),
        icon: Tags,
        accent: 'amber',
      },
    ],
    footerLinks: [
      { label: 'Track my order', to: '/order-tracking' },
      { label: 'Browse everything', to: '/shop' },
    ],
  },
];

// Small icons used in the mobile accordion sub-sections
export const accessoryIcons = { Keyboard, Mouse, Headphones, Cpu, HardDrive, BatteryCharging, Printer, Camera, Watch };
