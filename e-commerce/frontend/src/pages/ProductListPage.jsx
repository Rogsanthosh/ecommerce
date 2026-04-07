import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar.jsx'
import ProductCard from '../components/ui/ProductCard.jsx'
import { productApi, categoryApi } from '../services/api.js'

const S = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  hero: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '3rem 2rem', textAlign: 'center' },
  heroTitle: { color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' },
  heroSub: { color: '#aaa', fontSize: '1rem', marginBottom: '2rem' },
  searchBox: { display: 'flex', maxWidth: '500px', margin: '0 auto', gap: '8px' },
  searchInput: { flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', fontSize: '1rem', outline: 'none' },
  searchBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  layout: { display: 'flex', gap: '2rem' },
  sidebar: { width: '220px', flexShrink: 0 },
  filterCard: { background: '#fff', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  filterTitle: { fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: '#1a1a2e' },
  filterItem: (active) => ({ display: 'block', padding: '8px 12px', borderRadius: '6px', background: active ? '#fef2f2' : 'transparent', color: active ? '#e94560' : '#555', cursor: 'pointer', fontSize: '0.85rem', border: 'none', width: '100%', textAlign: 'left', fontWeight: active ? 700 : 400 }),
  select: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#333' },
  // ── Price Range UI ──────────────────────────────────────────────────────
  priceInputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' },
  priceInputWrapper: { display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fafafa', transition: 'border-color 0.2s' },
  pricePrefix: { padding: '8px 10px', background: '#f0f2f5', color: '#888', fontWeight: 700, fontSize: '0.85rem', borderRight: '1px solid #e5e7eb', userSelect: 'none' },
  priceInput: { flex: 1, padding: '8px 10px', border: 'none', background: 'transparent', fontSize: '0.85rem', outline: 'none', color: '#333', width: '100%' },
  priceLabel: { fontSize: '0.75rem', color: '#888', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceError: { color: '#e94560', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' },
  priceApplyBtn: { width: '100%', padding: '9px', background: 'linear-gradient(135deg, #e94560, #c73652)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginTop: '4px', transition: 'opacity 0.2s' },
  priceClearBtn: { width: '100%', padding: '6px', background: 'none', color: '#aaa', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' },
  // ────────────────────────────────────────────────────────────────────────
  main: { flex: 1 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', background: '#fff', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  count: { fontSize: '0.9rem', color: '#555' },
  sortSelect: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '2rem' },
  pageBtn: (active) => ({ padding: '8px 14px', borderRadius: '6px', border: active ? 'none' : '1px solid #e5e7eb', background: active ? '#e94560' : '#fff', color: active ? '#fff' : '#555', cursor: 'pointer', fontWeight: active ? 700 : 400 }),
  loading: { textAlign: 'center', padding: '4rem', fontSize: '1.1rem', color: '#888' },
  empty: { textAlign: 'center', padding: '4rem', color: '#888' },
  tag: { display: 'inline-block', background: '#fef2f2', color: '#e94560', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, margin: '2px' },
  clearBtn: { background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '0.8rem', marginTop: '8px', textDecoration: 'underline' },
}

export default function ProductListPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(params.get('q') || '')

  const currentPage = parseInt(params.get('page') || '1')
  const currentQ = params.get('q') || ''
  const currentCat = params.get('category') || ''
  const currentSort = params.get('sortBy') || 'newest'
  const currentMin = params.get('minPrice') || ''
  const currentMax = params.get('maxPrice') || ''

  const [minPrice, setMinPrice] = useState(currentMin)
  const [maxPrice, setMaxPrice] = useState(currentMax)
  const [priceError, setPriceError] = useState('')

  useEffect(() => {
    categoryApi.getAll().then(r => setCategories(r.data.data || [])).catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productApi.search({
        q: currentQ || undefined,
        page: currentPage,
        limit: 12,
        category: currentCat || undefined,
        sortBy: currentSort,
        minPrice: currentMin || undefined,
        maxPrice: currentMax || undefined,
      })
      setProducts(res.data.data || [])
      setMeta(res.data.meta)
    } catch { setProducts([]) }
    setLoading(false)
  }, [currentQ, currentPage, currentCat, currentSort, currentMin, currentMax])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateParam = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateParam('q', searchInput.trim())
  }

  const applyPrice = () => {
    // Validate: min must be less than max if both provided
    if (minPrice && maxPrice && parseFloat(minPrice) >= parseFloat(maxPrice)) {
      setPriceError('Min price must be less than max price')
      return
    }
    setPriceError('')
    const next = new URLSearchParams(params)
    if (minPrice) next.set('minPrice', minPrice); else next.delete('minPrice')
    if (maxPrice) next.set('maxPrice', maxPrice); else next.delete('maxPrice')
    next.delete('page')
    setParams(next)
  }

  const clearPrice = () => {
    setMinPrice(''); setMaxPrice(''); setPriceError('')
    const next = new URLSearchParams(params)
    next.delete('minPrice'); next.delete('maxPrice')
    next.delete('page')
    setParams(next)
  }

  const clearAll = () => {
    setSearchInput(''); setMinPrice(''); setMaxPrice('')
    setParams({})
  }

  return (
    <div style={S.page}>
      <Navbar />

      <div style={S.hero} className="res-hero">
        <h1 style={S.heroTitle} className="res-hero-title">Find Your Perfect Product</h1>
        <p style={S.heroSub}>Shoes, Electronics, Clothing, Accessories & More</p>
        <form onSubmit={handleSearch} style={S.searchBox}>
          <input
            style={S.searchInput}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products, brands..."
          />
          <button type="submit" style={S.searchBtn}>Search</button>
        </form>
      </div>

      <div style={S.container} className="res-container">
        <div style={S.layout} className="res-layout">
          {/* SIDEBAR */}
          <aside style={S.sidebar} className="res-sidebar">
            <div style={S.filterCard}>
              <div style={S.filterTitle}>Categories</div>
              <button style={S.filterItem(!currentCat)} onClick={() => updateParam('category', '')}>All Categories</button>
              {categories.map(c => (
                <button key={c.id} style={S.filterItem(currentCat === c.slug)} onClick={() => updateParam('category', c.slug)}>
                  {c.name} <span style={{ color: '#bbb', fontSize: '0.75rem' }}>({c.productCount})</span>
                </button>
              ))}
            </div>

            <div style={S.filterCard}>
              <div style={S.filterTitle}>💰 Price Range</div>
              <div style={S.priceInputGroup}>
                <div>
                  <div style={S.priceLabel}>Min Price</div>
                  <div style={S.priceInputWrapper}>
                    <span style={S.pricePrefix}>₹</span>
                    <input
                      style={S.priceInput}
                      placeholder="0"
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={e => { setMinPrice(e.target.value); setPriceError('') }}
                      onKeyDown={e => e.key === 'Enter' && applyPrice()}
                    />
                  </div>
                </div>
                <div>
                  <div style={S.priceLabel}>Max Price</div>
                  <div style={S.priceInputWrapper}>
                    <span style={S.pricePrefix}>₹</span>
                    <input
                      style={S.priceInput}
                      placeholder="Any"
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={e => { setMaxPrice(e.target.value); setPriceError('') }}
                      onKeyDown={e => e.key === 'Enter' && applyPrice()}
                    />
                  </div>
                </div>
              </div>
              {priceError && (
                <div style={S.priceError}>⚠️ {priceError}</div>
              )}
              <button onClick={applyPrice} style={S.priceApplyBtn}>Apply Filter</button>
              {(minPrice || maxPrice) && (
                <button onClick={clearPrice} style={S.priceClearBtn}>✕ Clear price filter</button>
              )}
            </div>

            <div style={S.filterCard}>
              <div style={S.filterTitle}>Active Filters</div>
              {currentQ && <span style={S.tag}>🔍 {currentQ}</span>}
              {currentCat && <span style={S.tag}>📁 {currentCat}</span>}
              {currentMin && <span style={S.tag}>₹{currentMin}+</span>}
              {currentMax && <span style={S.tag}>≤₹{currentMax}</span>}
              {(currentQ || currentCat || currentMin || currentMax) && (
                <div><button style={S.clearBtn} onClick={clearAll}>Clear all</button></div>
              )}
              {!currentQ && !currentCat && !currentMin && !currentMax && (
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>No active filters</span>
              )}
            </div>
          </aside>

          {/* MAIN */}
          <main style={S.main}>
            <div style={S.toolbar} className="res-toolbar">
              <span style={S.count}>
                {meta ? `${meta.total} product${meta.total !== 1 ? 's' : ''} found` : ''}
                {currentQ && ` for "${currentQ}"`}
              </span>
              <select style={S.sortSelect} className="res-sort-select" value={currentSort} onChange={e => updateParam('sortBy', e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name A-Z</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {loading ? (
              <div style={S.loading}>⏳ Loading products...</div>
            ) : products.length === 0 ? (
              <div style={S.empty}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <div>No products found. Try a different search!</div>
              </div>
            ) : (
              <div style={S.grid} className="res-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div style={S.pagination}>
                {currentPage > 1 && (
                  <button style={S.pageBtn(false)} onClick={() => updateParam('page', currentPage - 1)}>← Prev</button>
                )}
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px', color: '#aaa' }}>...</span>}
                      <button style={S.pageBtn(p === currentPage)} onClick={() => updateParam('page', p)}>{p}</button>
                    </span>
                  ))
                }
                {currentPage < meta.totalPages && (
                  <button style={S.pageBtn(false)} onClick={() => updateParam('page', currentPage + 1)}>Next →</button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
