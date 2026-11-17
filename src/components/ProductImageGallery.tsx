import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  X as XIcon,
} from 'lucide-react'

const PLACEHOLDER = '/images/products/laptop-placeholder.svg'

interface ProductImage {
  url: string
  alt: string
}

interface ProductImageGalleryProps {
  images: ProductImage[]
  mainImage?: string
  altText?: string
  className?: string
}

export default function ProductImageGallery({
  images: imagesProp,
  mainImage: initialMainImage,
  altText: initialAltText,
  className,
}: ProductImageGalleryProps) {
  const images =
    imagesProp.length > 0
      ? imagesProp
      : [{ url: initialMainImage || PLACEHOLDER, alt: initialAltText || 'Product image' }]

  const [mainIndex, setMainIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [currentZoomX, setCurrentZoomX] = useState(0)
  const [currentZoomY, setCurrentZoomY] = useState(0)

  const mainImageRef = useRef<HTMLImageElement>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)

  const mainImage = images[mainIndex]
  const hasMultiple = images.length > 1

  // Touch swipe handling for mobile gallery
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setTouchStartX(e.touches[0].clientX)
      setTouchStartY(e.touches[0].clientY)
    },
    []
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartX || !touchStartY) return
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = endX - touchStartX
      const diffY = endY - touchStartY

      // Only treat as swipe if horizontal movement dominates
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swiped right -> previous image
          setMainIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
        } else {
          // Swiped left -> next image
          setMainIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
        }
      }
    },
    [touchStartX, touchStartY, images.length]
  )

  const selectImage = useCallback(
    (index: number) => {
      setMainIndex(index)
      setIsZoomed(false)
    },
    []
  )

  const nextImage = useCallback(() => {
    setMainIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const prevImage = useCallback(() => {
    setMainIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  // Close lightbox on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, nextImage, prevImage])

  const openLightbox = () => {
    if (hasMultiple) setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setIsZoomed(false)
  }

  const handleZoom = (e: React.MouseEvent) => {
    if (!mainImageRef.current) return
    const rect = mainImageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setCurrentZoomX(x)
    setCurrentZoomY(y)
    setIsZoomed((prev) => !prev)
  }

  return (
    <div className={`${className ?? ''} w-full`}>
      {/* Main image container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-card shadow-sm group">
        <img
          ref={mainImageRef}
          src={mainImage.url}
          alt={mainImage.alt || initialAltText || 'Product image'}
          loading="lazy"
          className="h-full w-full object-contain transition-opacity duration-300"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER
          }}
          onClick={openLightbox}
          onMouseMove={isZoomed ? handleZoom : undefined}
          style={{
            transformOrigin: `${currentZoomX}% ${currentZoomY}%`,
            transform: isZoomed ? 'scale(2)' : 'scale(1)',
          }}
        />

        {/* Zoom indicator on hover */}
        {!isLightboxOpen && !isZoomed && hasMultiple && (
          <div className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/50 backdrop-blur-sm text-white">
            <Maximize2 className="h-4 w-4" />
          </div>
        )}

        {/* Wishlist button (kept for compatibility with ProductDetail layout) */}
        {/* Rendered by parent to avoid prop drilling; this slot is reserved */}

        {/* Image counter overlay */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-3 grid h-6 min-w-6 place-items-center rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-1.5">
            {mainIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="mt-4">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {images.map((img, idx) => (
              <button
                key={img.url}
                type="button"
                onClick={() => selectImage(idx)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`shrink-0 h-20 w-20 overflow-hidden rounded-lg border p-1 bg-card transition-all duration-200 ${
                  mainIndex === idx
                    ? 'border-teal ring-2 ring-teal/30 shadow-sm'
                    : 'border-line hover:border-muted hover:shadow-sm'
                }`}
                aria-label={`Image ${idx + 1} of ${images.length}`}
                aria-pressed={mainIndex === idx}
              >
                <img
                  src={img.url}
                  alt={img.alt || ''}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen lightbox */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 md:p-8"
          onClick={(e) => {
            if (e.target === lightboxRef.current) closeLightbox()
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Lightbox controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
            <button
              type="button"
              onClick={closeLightbox}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition"
              aria-label="Close gallery"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-white">
              {mainIndex + 1} / {images.length}
            </span>
          </div>

          {/* Main lightbox image */}
          <div className="relative flex-1 flex items-center justify-center max-w-full max-h-full overflow-hidden">
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="Previous image"
              disabled={!hasMultiple}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <img
              src={mainImage.url}
              alt={mainImage.alt || initialAltText || 'Product image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = PLACEHOLDER
              }}
            />

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 grid h-12 w-12 place-items-center rounded-full bg-white/10 backdrop-blur text-white hover:bg-white/20 transition opacity-0 hover:opacity-100 group-hover:opacity-100"
              aria-label="Next image"
              disabled={!hasMultiple}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Lightbox thumbnail strip */}
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {images.map((img, idx) => (
              <button
                key={img.url}
                type="button"
                onClick={() => {
                  setMainIndex(idx)
                  setIsZoomed(false)
                }}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border p-0.5 transition-all ${
                  mainIndex === idx
                    ? 'border-amber ring-1 ring-amber/50'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || ''}
                  loading="lazy"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER
                  }}
                />
              </button>
            ))}
          </div>

          {/* Instructions */}
          <p className="mt-3 text-[10px] text-white/50 text-center">
            {hasMultiple ? 'Swipe or use arrows to navigate · Press ESC to close' : 'Press ESC to close'}
          </p>
        </div>
      )}
    </div>
  )
}
