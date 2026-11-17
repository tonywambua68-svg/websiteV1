import type { StaffRole } from '@/lib/domain'

export const STAFF_ROLES: StaffRole[] = [
  'owner',
  'manager',
  'product_researcher',
  'inventory_assistant',
  'sales_assistant',
]

export function isStaffRole(role: StaffRole | undefined): boolean {
  return Boolean(role && STAFF_ROLES.includes(role))
}

export function canManageCatalogue(role: StaffRole | undefined): boolean {
  return role === 'owner' || role === 'manager' || role === 'product_researcher'
}

export function canAdjustStock(role: StaffRole | undefined): boolean {
  return role === 'owner' || role === 'manager' || role === 'inventory_assistant'
}

export function canManageOrders(role: StaffRole | undefined): boolean {
  return role === 'owner' || role === 'manager' || role === 'sales_assistant'
}

export function canSeeSuppliers(role: StaffRole | undefined): boolean {
  return role === 'owner' || role === 'manager' || role === 'product_researcher' || role === 'inventory_assistant'
}

export function homeForRole(role: StaffRole | undefined): string {
  if (role === 'owner' || role === 'manager') return '/admin'
  if (isStaffRole(role)) return '/employee'
  return '/account'
}
