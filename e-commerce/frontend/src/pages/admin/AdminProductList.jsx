import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { adminApi } from '../../services/api.js'
import toast from 'react-hot-toast'

const S = {
  toolbar: { display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', minWidth: '220px' },
  addBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: '0.875rem' },
  th: { background: '#f8f9fa', padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: '0.8rem', borderBottom: '1px solid #e5e7eb' },
  td: { padding: '12px 16px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  img: { width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', background: '#f5f5f5' },
  imgPlaceholder: { width: '44px', height: '44px', borderRadius: '8px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' },
  name: { fontWeight: 700, color: '#1a1a2e', fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sku: { fontSize: '0.75rem', color: '#aaa' },
  price: { fontWeight: 800, color: '#1a1a2e' },
  badge: (active) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: active ? '#dcfce7' : '#f5f5f5', color: active ? '#16a34a' : '#999' }),
  actions: { display: 'flex', gap: '8px' },
  editBtn: { background: '#f0f2f5', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', color: '#333' },
  delBtn: { background: '#fef2f2', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' },
  pagination: { display: 'flex', gap: '8px', marginTop: '1.25rem', justifyContent: 'flex-end' },
  pageBtn: (active) => ({ padding: '6px 12px', borderRadius: '6px', border: active ? 'none' : '1px solid #e5e7eb', background: active ? '#e94560' : '#fff', color: active ? '#fff' : '#555', cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: '0.85rem' }),
  empty: { textAlign: 'center', padding: '3rem', color: '#aaa' },
  count: { fontSize: '0.85rem', color: '#888', marginLeft: 'auto' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#333', outline: 'none' },
}

export default function AdminProductList() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(params.get('q') || '')

  const page = parseInt(params.get('page') || '1')
  const q = params.get('q') || ''
  const sortBy = params.get('sortBy') || 'newest'

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getProducts({ q: q || undefined, page, limit: 15, sortBy })
      setProducts(res.data.data || [])
      setMeta(res.data.meta)
    } catch { toast.error('Failed to load products') }
    setLoading(false)
  }, [q, page, sortBy])

  useEffect(() => { fetch() }, [fetch])

  const updateParam = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('q', search.trim())
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"? (soft delete - can be recovered)`)) return
    try {
      await adminApi.deleteProduct(id)
      toast.success('Product deactivated')
      fetch()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout title="📦 Products">
      <div style={S.toolbar}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input style={S.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
          <button type="submit" style={{ ...S.addBtn, background: '#6366f1' }}>🔍</button>
        </form>
        <select style={S.select} value={sortBy} onChange={e => updateParam('sortBy', e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="name_asc">Name A-Z</option>
        </select>
        {meta && <span style={S.count}>{meta.total} products</span>}
        <Link to="/admin/products/new" style={S.addBtn}>➕ Add Product</Link>
      </div>

      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Image</th>
            <th style={S.th}>Product</th>
            <th style={S.th}>Category</th>
            <th style={S.th}>Price</th>
            <th style={S.th}>Stock</th>
            <th style={S.th}>Status</th>
            <th style={S.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#aaa' }}>⏳ Loading...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan={7} style={S.empty}>No products found.</td></tr>
          ) : products.map(p => (
            <tr key={p.id} style={{ transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <td style={S.td}>
                {p.primaryImage?.url
                  ? <img src={p.primaryImage.url} alt={p.name} style={S.img} />
                  : <div style={S.imgPlaceholder}>📦</div>
                }
              </td>
              <td style={S.td}>
                <div style={S.name}>{p.name}</div>
                <div style={S.sku}>{p.sku}</div>
              </td>
              <td style={S.td}>{p.category?.name || '—'}</td>
              <td style={S.td}>
                <span style={S.price}>₹{Number(p.price).toLocaleString('en-IN')}</span>
              </td>
              <td style={S.td}>
                <span style={{ color: p.stock === 0 ? '#dc2626' : p.stock <= 5 ? '#d97706' : '#16a34a', fontWeight: 700 }}>
                  {p.stock}
                </span>
              </td>
              <td style={S.td}>
                <span style={S.badge(p.isActive)}>{p.isActive ? 'Active' : 'Inactive'}</span>
                {p.isFeatured && <span style={{ marginLeft: '6px', fontSize: '0.8rem' }}>🌟</span>}
              </td>
              <td style={S.td}>
                <div style={S.actions}>
                  <Link to={`/admin/products/${p.id}/edit`} style={S.editBtn}>✏️ Edit</Link>
                  <button style={S.delBtn} onClick={() => handleDelete(p.id, p.name)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {meta && meta.totalPages > 1 && (
        <div style={S.pagination}>
          {page > 1 && <button style={S.pageBtn(false)} onClick={() => updateParam('page', page - 1)}>← Prev</button>}
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} style={S.pageBtn(p === page)} onClick={() => updateParam('page', p)}>{p}</button>
          ))}
          {page < meta.totalPages && <button style={S.pageBtn(false)} onClick={() => updateParam('page', page + 1)}>Next →</button>}
        </div>
      )}
    </AdminLayout>
  )
}
