import { Link } from 'react-router-dom'

const availabilityColor = { in_stock: '#16a34a', low_stock: '#d97706', out_of_stock: '#dc2626' }
const availabilityLabel = { in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock' }

const S = {
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block' },
  img: { width: '100%', height: '220px', objectFit: 'cover', background: '#f5f5f5' },
  imgPlaceholder: { width: '100%', height: '220px', background: 'linear-gradient(135deg, #f0f2f5, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' },
  body: { padding: '1rem' },
  brand: { fontSize: '0.75rem', color: '#e94560', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  name: { fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e', margin: '4px 0 8px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  price: { fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e' },
  compare: { fontSize: '0.85rem', color: '#999', textDecoration: 'line-through' },
  discount: { background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  avail: (status) => ({ fontSize: '0.75rem', fontWeight: 600, color: availabilityColor[status] || '#999' }),
  rating: { fontSize: '0.8rem', color: '#666' },
}

export default function ProductCard({ product }) {
  const img = product.primaryImage?.url || (product.images?.[0]?.url)

  return (
    <Link to={`/products/${product.slug}`} style={S.card}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {img
        ? <img src={img} alt={product.name} style={S.img} className="res-card-img" loading="lazy" />
        : <div style={S.imgPlaceholder} className="res-card-img">🛍️</div>
      }
      <div style={S.body} className="res-card-body">
        {product.brand && <div style={S.brand}>{product.brand}</div>}
        <div style={S.name} className="res-card-name">{product.name}</div>
        <div style={S.priceRow}>
          <span style={S.price} className="res-card-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
          {product.compareAtPrice && <span style={S.compare}>₹{Number(product.compareAtPrice).toLocaleString('en-IN')}</span>}
          {product.discount > 0 && <span style={S.discount}>{product.discount}% OFF</span>}
        </div>
        <div style={S.footer} className="res-card-footer">
          <span style={S.avail(product.availability)}>{availabilityLabel[product.availability]}</span>
          {product.totalReviews > 0 && <span style={S.rating}>⭐ {product.averageRating || ''} ({product.totalReviews})</span>}
        </div>
      </div>
    </Link>
  )
}
