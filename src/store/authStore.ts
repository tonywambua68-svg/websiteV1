import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase'
import type { Profile } from '@/lib/domain'
import { errorText } from '@/lib/commerce'
import { useCartStore } from '@/store/cartStore'

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_not_found'
  | 'network_error'
  | 'supabase_not_configured'
  | 'account_suspended'
  | 'no_profile'
  | 'rate_limit'
  | 'unknown'

interface AuthState {
  user: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  errorCode: AuthErrorCode | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, fullName: string, phone?: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  clearError: () => void
}

function classifyAuthError(error: any): { message: string; code: AuthErrorCode } {
  const message = error?.message || error?.toString() || ''
  const lower = message.toLowerCase()

  if (lower.includes('invalid login') || lower.includes('wrong password') || lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
      return { message: 'Email not verified. Please check your inbox and confirm your account before signing in.', code: 'email_not_confirmed' }
    }
    return { message: 'Invalid email or password.', code: 'invalid_credentials' }
  }
  if (lower.includes('user not found') || lower.includes('no user') || lower.includes('email does not exist')) {
    return { message: 'Invalid email or password.', code: 'invalid_credentials' }
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('429')) {
    return { message: 'Too many login attempts. Please wait a moment and try again.', code: 'rate_limit' }
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) {
    return { message: 'Unable to reach Supabase. Please check your internet connection and Supabase configuration.', code: 'network_error' }
  }
  if (lower.includes('not configured')) {
    return { message: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', code: 'supabase_not_configured' }
  }
  return { message: errorText(error), code: 'unknown' }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  errorCode: null,

  login: async (email, password) => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ error: 'Supabase is not configured.', errorCode: 'supabase_not_configured', isLoading: false })
      return false
    }
    set({ isLoading: true, error: null, errorCode: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      const classified = classifyAuthError(error)
      set({ error: classified.message, errorCode: classified.code, isLoading: false })
      return false
    }
    await get().refreshProfile()
    return get().isAuthenticated
  },

  signup: async (email, password, fullName, phone) => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ error: 'Supabase is not configured.', errorCode: 'supabase_not_configured', isLoading: false })
      return false
    }
    set({ isLoading: true, error: null, errorCode: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone ?? '' } },
    })
    if (error) {
      const classified = classifyAuthError(error)
      set({ error: classified.message, errorCode: classified.code, isLoading: false })
      return false
    }
    if (!data.session) {
      set({
        error: 'Account created. Confirm the email if confirmation is enabled, then sign in. New accounts are customers until an owner assigns a staff role.',
        errorCode: null,
        isLoading: false,
      })
      return false
    }
    await get().refreshProfile()
    return get().isAuthenticated
  },

  logout: async () => {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false, error: null, errorCode: null })
  },

  resetPassword: async (email) => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ error: 'Supabase is not configured.', errorCode: 'supabase_not_configured' })
      return false
    }
    set({ isLoading: true, error: null, errorCode: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      const classified = classifyAuthError(error)
      set({ error: classified.message, errorCode: classified.code, isLoading: false })
      return false
    }
    set({
      error: 'If an account exists for this email, a password reset link has been sent. Check your inbox.',
      errorCode: null,
      isLoading: false,
    })
    return true
  },

  clearError: () => {
    set({ error: null, errorCode: null })
  },

  refreshProfile: async () => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }
    try {
      const { data: authUser, error } = await supabase.auth.getUser()
      if (error || !authUser.user) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .maybeSingle()
      if (profileError) throw profileError
      if (!profile || profile.account_status !== 'active') {
        await supabase.auth.signOut()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: profile ? 'This account is suspended.' : 'No profile was found for this account.',
          errorCode: profile ? 'account_suspended' : 'no_profile',
        })
        return
      }
      set({ user: profile as Profile, isAuthenticated: true, isLoading: false, error: null, errorCode: null })
      // Merge any local cart items with server cart on login
      try {
        await useCartStore.getState().syncFromServer()
      } catch {
        // Cart sync is best-effort; local cart persists via localStorage
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, error: errorText(error), errorCode: 'unknown' })
    }
  },

  checkAuth: async () => {
    await get().refreshProfile()
  },
}))
