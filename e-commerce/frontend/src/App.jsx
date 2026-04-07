import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'

// Public pages
import ProductListPage from './pages/ProductListPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminProductList from './pages/admin/AdminProductList.jsx'
import AdminProductForm from './pages/admin/AdminProductForm.jsx'
import AdminCategoryList from './pages/admin/AdminCategoryList.jsx'

const ProtectedRoute = ({ children }) => {
  const { isAuth } = useAuth()
  return isAuth ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<ProductListPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:identifier" element={<ProductDetailPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute><AdminProductList /></ProtectedRoute>} />
      <Route path="/admin/products/new" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/admin/products/:id/edit" element={<ProtectedRoute><AdminProductForm /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute><AdminCategoryList /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
