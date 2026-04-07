import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const S = {
  nav: { background: '#1a1a2e', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' },
  logo: { color: '#e94560', fontWeight: 800, fontSize: '1.4rem', textDecoration: 'none', letterSpacing: '-0.5px' },
  links: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  link: { color: '#ccc', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' },
  adminBtn: { background: '#e94560', color: '#fff', padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
}

export default function Navbar() {
  const { isAuth, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={S.nav} className="res-nav">
      <Link to="/" style={S.logo}>🛍️ ShopZone</Link>
      <div style={S.links} className="res-nav-links">
        <Link to="/products" style={S.link}>Products</Link>
        {/* Admin button is HIDDEN from public — access /admin by typing URL directly */}
        {isAuth && (
          <>
            <Link to="/admin" style={S.link}>Dashboard</Link>
            <button onClick={handleLogout} style={{ ...S.adminBtn, background: '#555', border: 'none', cursor: 'pointer' }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
