import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { StaffRole } from '@/lib/domain'

export default function Guard({ roles, children }: { roles: StaffRole[]; children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()
  if (isLoading) return <p className="wrap py-16 text-sm font-semibold">Checking your session…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!user || !roles.includes(user.role) || user.account_status !== 'active') {
    return (
      <div className="wrap py-16">
        <h1 className="font-display text-2xl font-bold">This area is restricted</h1>
        <p className="mt-2 text-sm text-muted">Your role does not include this page.</p>
      </div>
    )
  }
  return <>{children}</>
}
