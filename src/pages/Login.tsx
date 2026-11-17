import { useState, FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/Logo'
import { homeForRole } from '@/lib/permissions'
import { Mail, Lock, Unlock, User, Phone, ArrowRight, ShieldCheck, Info, Eye, EyeOff, Mail as MailIcon, AlertCircle } from 'lucide-react'

type AuthMode = 'signin' | 'signup' | 'forgot'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, resetPassword, user, isAuthenticated, error, errorCode, clearError } = useAuthStore()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [loading, setLoading] = useState(false)
  const [successNote, setSuccessNote] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })

  const from = (location.state as any)?.from || (isAuthenticated && user ? homeForRole(user.role) : '/')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()

    try {
      if (mode === 'signin') {
        const ok = await login(formData.email.trim(), formData.password)
        if (ok) {
          const currentUser = useAuthStore.getState().user
          navigate(from !== '/' && from !== '/login' ? from : homeForRole(currentUser?.role), { replace: true })
        }
      } else if (mode === 'signup') {
        if (!formData.fullName.trim()) {
          setLoading(false)
          return
        }
        const ok = await signup(formData.email.trim(), formData.password, formData.fullName.trim(), formData.phone.trim())
        if (ok) {
          navigate('/account', { replace: true })
        }
      } else {
        const ok = await resetPassword(formData.email.trim())
        if (ok) {
          setSuccessNote('If an account exists for this email, a password reset link has been sent. Check your inbox.')
          setMode('signin')
        }
      }
    } catch (err: any) {
      useAuthStore.setState({ error: err.message || 'An error occurred during authentication.', errorCode: 'unknown' })
    } finally {
      setLoading(false)
    }
  }

  const errorMessage = (() => {
    if (!error) return null
    switch (errorCode) {
      case 'email_not_confirmed':
        return error
      case 'invalid_credentials':
        return 'Invalid email or password. Please try again.'
      case 'network_error':
        return error
      case 'supabase_not_configured':
        return error
      case 'account_suspended':
        return error
      case 'no_profile':
        return error
      default:
        return error
    }
  })()

  return (
    <div className="wrap flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="flex justify-center pb-2">
            <Logo compact />
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">
            {mode === 'signin' ? 'Sign In to OREMITECH' : mode === 'signup' ? 'Create Customer Account' : 'Reset Your Password'}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {mode === 'signin'
              ? 'Access your customer orders, wishlist, or administrative console'
              : mode === 'signup'
                ? 'Sign up to track purchases, delivery coordinates, and receipts'
                : 'Enter your email address and we will send you a password reset link.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {successNote && (
          <div className="mt-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-semibold text-tealdeep flex items-center gap-2">
            <Info className="h-4 w-4" />
            {successNote}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-muted">Full Name *</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Samuel Ochieng"
                    className="input !h-10 w-full pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted">Kenyan Phone (Optional)</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0712 345 678"
                    className="input !h-10 w-full pl-9 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-bold text-muted">Email Address *</label>
              <div className="relative mt-1">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.co.ke"
                  className="input !h-10 w-full pl-9 text-xs"
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="rounded-lg border border-line bg-mist p-4 text-xs">
              <p className="text-muted">Enter your email address to receive a password reset link.</p>
            </div>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <div>
              <label className="block text-xs font-bold text-muted">Password *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input !h-10 w-full pl-9 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="mt-1 text-[10px] text-muted">Password must be at least 6 characters.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-emerald mt-2 w-full !h-11 text-xs font-bold shadow-md disabled:opacity-50"
          >
            {loading
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 border-t border-line pt-4 text-center text-xs">
          {mode === 'signin' ? (
            <>
              <p className="text-muted mb-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    clearError()
                  }}
                  className="font-bold text-teal hover:underline"
                >
                  Register as customer
                </button>
              </p>
              <p className="text-muted">
                Forgot your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    clearError()
                  }}
                  className="font-bold text-teal hover:underline"
                >
                  Reset password
                </button>
              </p>
            </>
          ) : mode === 'signup' ? (
            <p className="text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  clearError()
                }}
                className="font-bold text-teal hover:underline"
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p className="text-muted">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  clearError()
                }}
                className="font-bold text-teal hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-mist p-3.5 text-[11px] text-muted">
          <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
            <ShieldCheck className="h-4 w-4 text-teal" />
            <span>Role-Based Authentication:</span>
          </div>
          <p className="leading-relaxed">
            New signups are registered as standard customers. Staff roles (Owner, Manager, Researcher, Inventory Assistant, Sales) are assigned securely in Supabase PostgreSQL by the business owner.
          </p>
        </div>
      </div>
    </div>
  )
}

