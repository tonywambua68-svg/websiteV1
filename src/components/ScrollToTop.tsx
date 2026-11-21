import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Start new in-app destinations at the top while allowing browser Back to restore its position. */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search, hash, navigationType])

  return null
}
