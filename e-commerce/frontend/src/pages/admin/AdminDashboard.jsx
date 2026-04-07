import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { adminApi } from '../../services/api.js'

const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' },
  statCard: (color) => ({ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}` }),
  statIcon: { fontSize: '2rem', marginBottom: '8px' },
  statValue: { fontSize: '2.2rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 },
  statLabel: { fontSize: '0.8rem', color: '#888', marginTop: '6px', fontWeight: 600 },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  actionCard: (color) => ({ background: color, borderRadius: '12px', padding: '1.5rem', textDecoration: 'none', color: '#fff', display: 'block', transition: 'transform 0.2s, box-shadow 0.2s' }),
  actionIcon: { fontSize: '2rem', marginBottom: '10px' },
  actionTitle: { fontWeight: 800, fontSize: '1rem', marginBottom: '4px' },
  actionDesc: { fontSize: '0.8rem', opacity: 0.85 },
  sectionTitle: { fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', marginBottom: '1rem' },
  alert: { background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#92400e', marginBottom: '1.5rem' },
}

const stats_config = [
  { key: 'totalProducts', label: 'Total Products', icon: '📦', color: '#6366f1' },
  { key: 'activeProducts', label: 'Active Products', icon: '✅', color: '#16a34a' },
  { key: 'totalCategories', label: 'Categories', icon: '📁', color: '#0891b2' },
  { key: 'totalReviews', label: 'Reviews', icon: '⭐', color: '#f59e0b' },
  { key: 'lowStockProducts', label: 'Low Stock', icon: '⚠️', color: '#d97706' },
  { key: 'featuredCount', label: 'Featured', icon: '🌟', color: '#e94560' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="📊 Dashboard">
      {stats?.lowStockProducts > 0 && (
        <div style={S.alert}>
          ⚠️ <strong>{stats.lowStockProducts} product(s)</strong> are running low on stock!
          <Link to="/admin/products?isActive=true" style={{ marginLeft: 'auto', color: '#92400e', fontWeight: 700, textDecoration: 'underline' }}>View</Link>
        </div>
      )}

      <div style={S.grid}>
        {stats_config.map(sc => (
          <div key={sc.key} style={S.statCard(sc.color)}>
            <div style={S.statIcon}>{sc.icon}</div>
            <div style={S.statValue}>{loading ? '...' : (stats?.[sc.key] ?? 0)}</div>
            <div style={S.statLabel}>{sc.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={S.sectionTitle}>Quick Actions</div>
        <div style={S.actionsGrid}>
          {[
            { to: '/admin/products/new', icon: '➕', title: 'Add New Product', desc: 'Create a product listing', color: '#e94560' },
            { to: '/admin/products', icon: '📦', title: 'Manage Products', desc: 'View, edit, delete products', color: '#6366f1' },
            { to: '/admin/categories', icon: '📁', title: 'Manage Categories', desc: 'Organise your catalogue', color: '#0891b2' },
            { to: '/', icon: '🌐', title: 'View Storefront', desc: 'See the customer-facing store', color: '#16a34a' },
          ].map(a => (
            <Link key={a.to} to={a.to} style={S.actionCard(a.color)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={S.actionIcon}>{a.icon}</div>
              <div style={S.actionTitle}>{a.title}</div>
              <div style={S.actionDesc}>{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: '0.85rem', color: '#888' }}>
        <strong>API Docs:</strong> <a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" style={{ color: '#e94560' }}>http://localhost:5000/api/docs</a>
        {' | '}
        <strong>Health:</strong> <a href="http://localhost:5000/health" target="_blank" rel="noreferrer" style={{ color: '#e94560' }}>http://localhost:5000/health</a>
      </div>
    </AdminLayout>
  )
}
