import { Navigate } from 'react-router-dom'

/**
 * Legacy AdminPanel route redirector.
 * The administration platform is now modularized under /admin/* with role-based access control.
 */
export default function AdminPanel() {
  return <Navigate to="/admin" replace />
}
