import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Analytics from './Analytics'
import StructuredData from './StructuredData'
import ScrollToTop from './ScrollToTop'
import CompareBar from './CompareBar'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'

export default function Layout() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const loadSettings = useSettingsStore((s) => s.load)

  useEffect(() => {
    checkAuth()
    loadSettings()
  }, [checkAuth, loadSettings])

  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData />
      <ScrollToTop />
      <Analytics />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <CompareBar />
      <Footer />
    </div>
  )
}
