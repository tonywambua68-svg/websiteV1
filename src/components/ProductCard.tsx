import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };

  const discount = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const stock = product.stock ?? (product.inStock ? 10 : 0);

  return (
    <Link to={`/product/${product.id}`} className="group">
      <article className="group card relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-teal/40 hover:shadow-[0_18px_40px_-18px_rgba(10,31,28,0.28)]">
        {/* Product Image */}
        <div className="relative block aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(150deg, #0b7a6322, #0b7a6306 70%)` }}>
          <span className="dots-bg pointer-events-none absolute inset-0 opacity-60" />
          <img
            src={product.image || product.images?.[0] || '/images/products/laptop-placeholder.svg'}
            alt={product.name}
            className="absolute left-1/2 top-1/2 h-[86%] -translate-x-1/2 -translate-y-1/2 object-cover transition-transform duration-500 group-hover:scale-[1.06] group-hover:-rotate-1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/products/laptop-placeholder.svg';
            }}
          />
          {/* Badges */}
          <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {discount > 0 && (
              <span className="rounded-md bg-amber px-2 py-0.5 font-display text-[11px] font-bold text-ink shadow-sm">
                −{discount}%
              </span>
            )}
            {product.status === 'active' && (
              <span className="rounded-md bg-teal px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                New
              </span>
            )}
          </span>
          {stock === 0 && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-widest text-white/90">
              Out of stock
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-1 flex-col p-3.5 md:p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
            {product.brand} · {product.category}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-[15px] font-bold leading-snug transition group-hover:text-teal">
            {product.name}
          </h3>

          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted">
            <span className="text-teal">🛡️</span> {product.source || 'Genuine product'}
          </p>

          <div className="mt-2.5">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                KSh {product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <>
                  <span className="text-xs font-semibold line-through text-muted">
                    KSh {product.oldPrice.toLocaleString()}
                  </span>
                  <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-[11px] font-extrabold text-amberdeep">
                    −{discount}%
                  </span>
                </>
              )}
            </span>
          </div>

          <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-bold ${stock === 0 ? 'text-error' : stock <= 5 ? 'text-warning' : 'text-success'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stock === 0 ? 'bg-error' : stock <= 5 ? 'bg-warning' : 'bg-success'}`} />
            {stock === 0 ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : 'In stock'}
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="btn btn-amber btn-sm mt-3.5 w-full"
          >
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </button>
        </div>
      </article>
    </Link>
  );
}
