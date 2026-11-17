import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getSupabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { Mail, Lock, ArrowRight, ShieldCheck, Info, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const supabase = getSupabase()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const token = searchParams.get('access_token') || searchParams.get('refresh_token')
  const type = searchParams.get('type')

  useEffect(() => {
    if (supabase && token && type === 'recovery') {
      supabase.auth.setSession({ access_token: token, refresh_token: searchParams.get('refresh_token') ?? '' })
    }
  }, [supabase, token, type, searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase!.auth.updateUser({
        password: formData.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Your password has been reset successfully. You can now sign in.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (!supabase) {
    return (
      <div className="wrap flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-sm text-center">
          <div className="flex justify-center pb-2">
            <Logo compact />
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Password Reset</h1>
          <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error">
            Supabase is not configured.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap flex min-h-[calc(100vh-14rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="flex justify-center pb-2">
            <Logo compact />
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Reset Your Password</h1>
          <p className="mt-1 text-xs text-muted">
            Enter a new password for your OREMITECH account.
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error flex items-center gap-2">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-teal/30 bg-mint/50 p-3 text-xs font-semibold text-tealdeep flex items-center gap-2">
            <Info className="h-4 w-4" />
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted">New Password *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input !h-10 w-full pl-9 pr-10 text-xs"
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
            </div>

            <div>
              <label className="block text-xs font-bold text-muted">Confirm New Password *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input !h-10 w-full pl-9 pr-10 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-emerald mt-2 w-full !h-11 text-xs font-bold shadow-md disabled:opacity-50"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-line pt-4 text-center text-xs">
          <p className="text-muted">
            Already have a new password?{' '}
            <Link to="/login" className="font-bold text-teal hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-mist p-3.5 text-[11px] text-muted">
          <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
            <ShieldCheck className="h-4 w-4 text-teal" />
            <span>Secure Password Reset:</span>
          </div>
          <p className="leading-relaxed">
            Reset links are sent only to the email address on file and expire after a short period. If you did not request this reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  )
}

