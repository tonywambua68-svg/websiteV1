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

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
              -{discount}%
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase">{product.brand}</span>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
