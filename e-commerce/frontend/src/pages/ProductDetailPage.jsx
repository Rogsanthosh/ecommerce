import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productApi } from '../services/api.js'
import Navbar from '../components/layout/Navbar.jsx'
import toast from 'react-hot-toast'

const availColor = { in_stock: '#16a34a', low_stock: '#d97706', out_of_stock: '#dc2626' }
const availLabel = { in_stock: '✅ In Stock', low_stock: '⚠️ Low Stock', out_of_stock: '❌ Out of Stock' }

const S = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  breadcrumb: { fontSize: '0.85rem', color: '#888', marginBottom: '1.5rem' },
  bcLink: { color: '#e94560', textDecoration: 'none' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  imgMain: { width: '100%', borderRadius: '12px', objectFit: 'cover', height: '420px', background: '#f5f5f5' },
  imgPlaceholder: { width: '100%', height: '420px', borderRadius: '12px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' },
  thumbs: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' },
  thumb: (active) => ({ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: active ? '2px solid #e94560' : '2px solid #eee' }),
  brand: { color: '#e94560', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' },
  name: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.3, marginBottom: '12px' },
  sku: { fontSize: '0.8rem', color: '#aaa', marginBottom: '16px' },
  ratingRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  stars: { fontSize: '1rem', color: '#f59e0b' },
  ratingCount: { fontSize: '0.85rem', color: '#888' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' },
  price: { fontSize: '2rem', fontWeight: 900, color: '#1a1a2e' },
  compare: { fontSize: '1.1rem', color: '#bbb', textDecoration: 'line-through' },
  badge: { background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem' },
  avail: (s) => ({ fontWeight: 700, fontSize: '0.9rem', color: availColor[s], marginBottom: '12px' }),
  divider: { borderColor: '#f0f2f5', margin: '16px 0' },
  label: { fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: '8px' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' },
  tag: { background: '#f0f2f5', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#555' },
  desc: { fontSize: '0.9rem', lineHeight: 1.7, color: '#555', marginBottom: '1.5rem' },
  cartBtn: (disabled) => ({ width: '100%', padding: '14px', background: disabled ? '#ccc' : '#e94560', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }),
  section: { background: '#fff', borderRadius: '12px', padding: '1.75rem', marginTop: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e', marginBottom: '1.5rem', paddingBottom: '12px', borderBottom: '2px solid #f0f2f5' },
  reviewItem: { paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f5f5f5' },
  reviewHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  reviewAuthor: { fontWeight: 700, fontSize: '0.9rem' },
  reviewDate: { fontSize: '0.8rem', color: '#aaa' },
  reviewTitle: { fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: '4px' },
  reviewComment: { fontSize: '0.85rem', color: '#666', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', resize: 'vertical', minHeight: '90px', outline: 'none' },
  submitBtn: { background: '#1a1a2e', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 },
  metaRow: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#777', marginTop: '12px' },
}

function StarRating({ rating, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          style={{ fontSize: '1.6rem', color: n <= (hover || rating) ? '#f59e0b' : '#ddd', transition: 'color 0.15s' }}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >★</span>
      ))}
    </div>
  )
}

export default function ProductDetailPage() {
  const { identifier } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [review, setReview] = useState({ rating: 5, title: '', comment: '', authorName: '', authorEmail: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    productApi.getByIdentifier(identifier)
      .then(r => {
        setProduct(r.data.data)
        // Update page meta tags dynamically
        const p = r.data.data
        document.title = `${p.metaTitle || p.name} | ShopZone`
        document.querySelector('meta[name="description"]')?.setAttribute('content', p.metaDescription || p.shortDescription || p.description?.slice(0, 160))
        document.querySelector('meta[name="keywords"]')?.setAttribute('content', p.metaKeywords || p.tags?.join(', '))
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', p.name)
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', p.shortDescription || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [identifier])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!review.rating) return toast.error('Please select a rating')
    if (!review.comment.trim()) return toast.error('Comment is required')
    if (!review.authorName.trim()) return toast.error('Your name is required')
    if (!review.authorEmail.trim()) return toast.error('Email is required')

    setSubmitting(true)
    try {
      await productApi.submitReview(product.id, review)
      toast.success('Review submitted! Thank you 🎉')
      setReview({ rating: 5, title: '', comment: '', authorName: '', authorEmail: '' })
      // Refresh product
      const r = await productApi.getByIdentifier(identifier)
      setProduct(r.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    }
    setSubmitting(false)
  }

  if (loading) return <div style={S.page}><Navbar /><div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>⏳ Loading product...</div></div>
  if (!product) return <div style={S.page}><Navbar /><div style={{ textAlign: 'center', padding: '4rem', color: '#e94560' }}>Product not found. <Link to="/">Go back</Link></div></div>

  const images = product.images || []
  const primaryImg = images[activeImg]?.url || images[0]?.url

  return (
    <div style={S.page}>
      <Navbar />
      <div style={S.container}>
        {/* Breadcrumb */}
        <div style={S.breadcrumb}>
          <Link to="/products" style={S.bcLink}>Home</Link> / <Link to={`/products?category=${product.category?.slug}`} style={S.bcLink}>{product.category?.name}</Link> / {product.name}
        </div>

        {/* Main Product Layout */}
        <div style={S.layout} className="res-detail-layout">
          {/* Images */}
          <div>
            {primaryImg
              ? <img src={primaryImg} alt={product.name} style={S.imgMain} className="res-detail-img" />
              : <div style={S.imgPlaceholder} className="res-detail-img">🛍️</div>
            }
            {images.length > 1 && (
              <div style={S.thumbs}>
                {images.map((img, i) => (
                  <img key={img.id} src={img.url} alt={img.altText} style={S.thumb(i === activeImg)} onClick={() => setActiveImg(i)} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && <div style={S.brand}>{product.brand}</div>}
            <h1 style={S.name} className="res-detail-name">{product.name}</h1>
            <div style={S.sku}>SKU: {product.sku}</div>

            {product.totalReviews > 0 && (
              <div style={S.ratingRow}>
                <span style={S.stars}>{'★'.repeat(Math.round(product.averageRating))}{'☆'.repeat(5 - Math.round(product.averageRating))}</span>
                <span style={{ fontWeight: 700 }}>{product.averageRating}</span>
                <span style={S.ratingCount}>({product.totalReviews} reviews)</span>
              </div>
            )}

            <div style={S.priceRow}>
              <span style={S.price} className="res-detail-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.compareAtPrice && <span style={S.compare}>₹{Number(product.compareAtPrice).toLocaleString('en-IN')}</span>}
              {product.discount > 0 && <span style={S.badge}>{product.discount}% OFF</span>}
            </div>

            <div style={S.avail(product.availability)}>{availLabel[product.availability]}</div>

            <hr style={S.divider} />

            {product.shortDescription && <p style={S.desc}>{product.shortDescription}</p>}

            {product.tags?.length > 0 && (
              <>
                <div style={S.label}>Tags</div>
                <div style={S.tags}>{product.tags.map(t => <span key={t} style={S.tag}>{t}</span>)}</div>
              </>
            )}

            <button
              style={S.cartBtn(product.availability === 'out_of_stock')}
              disabled={product.availability === 'out_of_stock'}
              onClick={() => toast.success('Added to cart! 🛒')}
            >
              {product.availability === 'out_of_stock' ? 'Out of Stock' : '🛒 Add to Cart'}
            </button>

            <div style={S.metaRow}>
              <span>📦 Category: {product.category?.name}</span>
              {product.brand && <span>🏷️ Brand: {product.brand}</span>}
              <span>🔢 Stock: {product.stock} units available</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={S.section} className="res-detail-section">
          <div style={S.sectionTitle}>📄 Product Description</div>
          <p style={S.desc}>{product.description}</p>
        </div>

        {/* Reviews */}
        <div style={S.section} className="res-detail-section">
          <div style={S.sectionTitle}>⭐ Customer Reviews ({product.totalReviews})</div>

          {product.reviews?.length === 0 && <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No reviews yet. Be the first to review!</p>}

          {product.reviews?.map(r => (
            <div key={r.id} style={S.reviewItem}>
              <div style={S.reviewHeader} className="res-review-header">
                <span style={S.reviewAuthor}>{r.authorName} {r.isVerified && '✅'}</span>
                <span style={S.reviewDate}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div style={{ color: '#f59e0b', marginBottom: '4px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              {r.title && <div style={S.reviewTitle}>{r.title}</div>}
              <div style={S.reviewComment}>{r.comment}</div>
            </div>
          ))}

          {/* Review Form */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #f0f2f5' }}>
            <div style={{ fontWeight: 800, marginBottom: '1rem', color: '#1a1a2e' }}>Write a Review</div>
            <form onSubmit={handleReviewSubmit} style={S.form}>
              <div>
                <div style={S.label}>Rating *</div>
                <StarRating rating={review.rating} onChange={v => setReview(r => ({ ...r, rating: v }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="res-detail-form-grid">
                <input style={S.input} placeholder="Your Name *" value={review.authorName} onChange={e => setReview(r => ({ ...r, authorName: e.target.value }))} />
                <input style={S.input} placeholder="Email *" type="email" value={review.authorEmail} onChange={e => setReview(r => ({ ...r, authorEmail: e.target.value }))} />
              </div>
              <input style={S.input} placeholder="Review Title (optional)" value={review.title} onChange={e => setReview(r => ({ ...r, title: e.target.value }))} />
              <textarea style={S.textarea} placeholder="Write your review... *" value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} />
              <button type="submit" style={S.submitBtn} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
