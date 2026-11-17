import type { Category, Brand } from '@/lib/domain'

export interface MenuLink {
  label: string
  to: string
}

export interface MenuColumn {
  title: string
  links: MenuLink[]
}

export interface MenuItem {
  label: string
  to: string
  columns: MenuColumn[]
  icon?: string
}

/**
 * Static mega menu configuration for OREMITECH.
 * All links use existing application routes and filters.
 * Dynamic data (brands, popular products) is fetched at runtime.
 */

export const MAIN_CATEGORIES: MenuItem[] = [
  {
    label: 'Laptops',
    to: '/shop?category=laptops',
    icon: 'Laptop',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=laptops&brand=hp' },
          { label: 'Dell', to: '/shop?category=laptops&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=laptops&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=laptops&brand=apple' },
          { label: 'ASUS', to: '/shop?category=laptops&brand=asus' },
          { label: 'Acer', to: '/shop?category=laptops&brand=acer' },
        ],
      },
      {
        title: 'Shop by Use',
        links: [
          { label: 'Business', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Students', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Programming', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Gaming', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Design & Video Editing', to: '/shop?category=laptops&menu_group=use' },
        ],
      },
      {
        title: 'Shop by Budget',
        links: [
          { label: 'Under KSh 30,000', to: '/shop?category=laptops&max=30000' },
          { label: 'KSh 30,000 – 50,000', to: '/shop?category=laptops&min=30000&max=50000' },
          { label: 'KSh 50,000 – 80,000', to: '/shop?category=laptops&min=50000&max=80000' },
          { label: 'Above KSh 80,000', to: '/shop?category=laptops&min=80000' },
        ],
      },
      {
        title: 'Shop by Specs',
        links: [
          { label: 'Core i5', to: '/shop?category=laptops&processor=Core i5' },
          { label: 'Core i7', to: '/shop?category=laptops&processor=Core i7' },
          { label: '8GB RAM', to: '/shop?category=laptops&ram=8GB' },
          { label: '16GB RAM', to: '/shop?category=laptops&ram=16GB' },
          { label: '256GB SSD', to: '/shop?category=laptops&storage=256GB' },
          { label: '512GB SSD', to: '/shop?category=laptops&storage=512GB' },
        ],
      },
    ],
  },
  {
    label: 'Desktops',
    to: '/shop?category=desktops',
    icon: 'Cpu',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=desktops&brand=hp' },
          { label: 'Dell', to: '/shop?category=desktops&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=desktops&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=desktops&brand=apple' },
          { label: 'ASUS', to: '/shop?category=desktops&brand=asus' },
          { label: 'Acer', to: '/shop?category=desktops&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Monitors',
    to: '/shop?category=monitors',
    icon: 'Monitor',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=monitors&brand=hp' },
          { label: 'Dell', to: '/shop?category=monitors&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=monitors&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=monitors&brand=apple' },
          { label: 'ASUS', to: '/shop?category=monitors&brand=asus' },
          { label: 'Acer', to: '/shop?category=monitors&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Storage & SSDs',
    to: '/shop?category=storage-devices',
    icon: 'HardDrive',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=storage-devices&brand=hp' },
          { label: 'Dell', to: '/shop?category=storage-devices&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=storage-devices&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=storage-devices&brand=apple' },
          { label: 'ASUS', to: '/shop?category=storage-devices&brand=asus' },
          { label: 'Acer', to: '/shop?category=storage-devices&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Accessories',
    to: '/shop?category=computer-accessories',
    icon: 'Phone',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=computer-accessories&brand=hp' },
          { label: 'Dell', to: '/shop?category=computer-accessories&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=computer-accessories&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=computer-accessories&brand=apple' },
          { label: 'ASUS', to: '/shop?category=computer-accessories&brand=asus' },
          { label: 'Acer', to: '/shop?category=computer-accessories&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Keyboards & Mice',
    to: '/shop?category=input-devices',
    icon: 'Cpu',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=input-devices&brand=hp' },
          { label: 'Dell', to: '/shop?category=input-devices&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=input-devices&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=input-devices&brand=apple' },
          { label: 'ASUS', to: '/shop?category=input-devices&brand=asus' },
          { label: 'Acer', to: '/shop?category=input-devices&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Networking',
    to: '/shop?category=networking',
    icon: 'Monitor',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=networking&brand=hp' },
          { label: 'Dell', to: '/shop?category=networking&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=networking&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=networking&brand=apple' },
          { label: 'ASUS', to: '/shop?category=networking&brand=asus' },
          { label: 'Acer', to: '/shop?category=networking&brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Other Electronics',
    to: '/shop?category=other-electronics',
    icon: 'ShieldCheck',
    columns: [
      {
        title: 'Shop by Brand',
        links: [
          { label: 'HP', to: '/shop?category=other-electronics&brand=hp' },
          { label: 'Dell', to: '/shop?category=other-electronics&brand=dell' },
          { label: 'Lenovo', to: '/shop?category=other-electronics&brand=lenovo' },
          { label: 'Apple', to: '/shop?category=other-electronics&brand=apple' },
          { label: 'ASUS', to: '/shop?category=other-electronics&brand=asus' },
          { label: 'Acer', to: '/shop?category=other-electronics&brand=acer' },
        ],
      },
    ],
  },
]

export const TOP_NAV_ITEMS: MenuItem[] = [
  {
    label: 'Laptops',
    to: '/shop?category=laptops',
    icon: 'Laptop',
    columns: MAIN_CATEGORIES[0]?.columns ?? [],
  },
  {
    label: 'By Use',
    to: '/shop?category=laptops',
    icon: 'Cpu',
    columns: [
      {
        title: 'Shop by Use',
        links: [
          { label: 'Business Laptops', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Student Laptops', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Gaming Laptops', to: '/shop?category=laptops&menu_group=use' },
          { label: 'Workstations', to: '/shop?category=laptops&menu_group=use' },
        ],
      },
    ],
  },
  {
    label: 'Accessories',
    to: '/shop?category=computer-accessories',
    icon: 'Phone',
    columns: [
      {
        title: 'Accessories',
        links: [
          { label: 'Computer Accessories', to: '/shop?category=computer-accessories' },
          { label: 'Monitors', to: '/shop?category=monitors' },
          { label: 'Storage Devices', to: '/shop?category=storage-devices' },
          { label: 'Networking Equipment', to: '/shop?category=networking' },
        ],
      },
    ],
  },
  {
    label: 'Brands',
    to: '/shop',
    icon: 'ShieldCheck',
    columns: [
      {
        title: 'All Brands',
        links: [
          { label: 'HP', to: '/shop?brand=hp' },
          { label: 'Dell', to: '/shop?brand=dell' },
          { label: 'Lenovo', to: '/shop?brand=lenovo' },
          { label: 'Apple', to: '/shop?brand=apple' },
          { label: 'ASUS', to: '/shop?brand=asus' },
          { label: 'Acer', to: '/shop?brand=acer' },
        ],
      },
    ],
  },
  {
    label: 'Offers',
    to: '/shop?offers=1',
    icon: 'ShieldCheck',
    columns: [],
  },
  {
    label: 'Blog',
    to: '/blog',
    icon: 'ShieldCheck',
    columns: [],
  },
]

/**
 * Icon name to lucide-react component mapping.
 * Kept here so the menu stays decoupled from icon imports.
 */
export const MENU_ICONS: Record<string, string> = {
  Laptop: 'Laptop',
  Cpu: 'Cpu',
  Monitor: 'Monitor',
  HardDrive: 'HardDrive',
  Phone: 'Phone',
  ShieldCheck: 'ShieldCheck',
}
