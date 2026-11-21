import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import BlogListing from '@/pages/BlogListing'
import BlogArticle from '@/pages/BlogArticle'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import OrderTracking from '@/pages/OrderTracking'
import OrderConfirmation from '@/pages/OrderConfirmation'
import AboutUs from '@/pages/AboutUs'
import FAQ from '@/pages/FAQ'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import Account from '@/pages/Account'
import NotFound from '@/pages/NotFound'
import Wishlist from '@/pages/Wishlist'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminProducts from '@/pages/admin/Products'
import AdminProductForm from '@/pages/admin/ProductForm'
import AdminCategories from '@/pages/admin/Categories'
import AdminBlog from '@/pages/admin/BlogAdmin'
import AdminBlogPreview from '@/pages/admin/BlogPreview'
import AdminBrands from '@/pages/admin/Brands'
import AdminInventory from '@/pages/admin/Inventory'
import AdminOrders from '@/pages/admin/Orders'
import AdminResearch from '@/pages/admin/Research'
import AdminSuppliers from '@/pages/admin/Suppliers'
import AdminEmployees from '@/pages/admin/Employees'
import AdminFinance from '@/pages/admin/Finance'
import AdminSettings from '@/pages/admin/Settings'
import AdminDeliveryZones from '@/pages/admin/DeliveryZones'
import AdminProductImport from '@/pages/admin/ProductImport'
import AdminProductReview from '@/pages/admin/ProductReview'
import AdminProductPublishing from '@/pages/admin/ProductPublishing'
import AdminPricingRules from '@/pages/admin/PricingRules'
import EmployeeLayout from '@/pages/employee/EmployeeLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-tracking" element={<OrderTracking />} />
          <Route path="order-confirmation/:orderNumber" element={<OrderConfirmation />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Login />} />
          <Route path="blog" element={<BlogListing />} />
          <Route path="blog/:slug" element={<BlogArticle />} />
          <Route path="account" element={<Account />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Admin blog routes */}
        <Route path="admin/blog" element={<AdminBlog />} />
        <Route path="admin/blog/new" element={<AdminBlog />} />
        <Route path="admin/blog/edit/:id" element={<AdminBlog />} />
        <Route path="admin/blog/preview/:id" element={<AdminBlogPreview />} />

        {/* Admin routes — protected by Guard inside AdminLayout */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/products" element={<AdminProducts />} />
        <Route path="admin/products/new" element={<AdminProductForm />} />
        <Route path="admin/products/edit/:id" element={<AdminProductForm />} />
        <Route path="admin/categories" element={<AdminCategories />} />
        <Route path="admin/brands" element={<AdminBrands />} />
        <Route path="admin/inventory" element={<AdminInventory />} />
        <Route path="admin/orders" element={<AdminOrders />} />
        <Route path="admin/research" element={<AdminResearch />} />
        <Route path="admin/suppliers" element={<AdminSuppliers />} />
        <Route path="admin/employees" element={<AdminEmployees />} />
        <Route path="admin/finance" element={<AdminFinance />} />
        <Route path="admin/settings" element={<AdminSettings />} />
        <Route path="admin/delivery-zones" element={<AdminDeliveryZones />} />
        <Route path="admin/product-import" element={<AdminProductImport />} />
        <Route path="admin/product-review/:id" element={<AdminProductReview />} />
        <Route path="admin/product-publishing" element={<AdminProductPublishing />} />
        <Route path="admin/pricing-rules" element={<AdminPricingRules />} />

        {/* Employee routes — protected by Guard inside EmployeeLayout */}
        <Route path="employee" element={<EmployeeLayout />} />

        {/* Fallback */}
          <Route path="about" element={<AboutUs />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
