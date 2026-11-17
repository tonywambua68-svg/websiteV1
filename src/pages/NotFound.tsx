import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="bg-mist min-h-screen flex flex-col">
      <div className="wrap py-20 text-center flex-grow">
        <div className="mx-auto w-16 h-16 rounded-full bg-mist/50 flex items-center justify-center text-error mb-6">
          <span className="text-4xl">404</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-3">Page Not Found</h1>
        <p className="text-lg text-muted mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-ink btn-sm">
            Go to Homepage
          </Link>
          <Link to="/shop" className="btn btn-outline btn-sm">
            Browse Products
          </Link>
          <Link to="/blog" className="btn btn-outline btn-sm">
            Read the Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
