import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const menu = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/products', label: '📦 Products' },
  { path: '/admin/categories', label: '📁 Categories' },
]

const S = {
  layout: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
  sidebar: { width: '220px', background: '#1a1a2e', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  logo: { padding: '1.5rem', color: '#e94560', fontWeight: 800, fontSize: '1.2rem', borderBottom: '1px solid #2a2a4a' },
  nav: { flex: 1, padding: '1rem 0' },
  link: (active) => ({ display: 'block', padding: '12px 1.5rem', color: active ? '#fff' : '#aaa', background: active ? '#e94560' : 'transparent', textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.2s', borderLeft: active ? '3px solid #ff6b6b' : '3px solid transparent' }),
  footer: { padding: '1rem 1.5rem', borderTop: '1px solid #2a2a4a' },
  logoutBtn: { width: '100%', background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  content: { flex: 1, overflow: 'auto' },
  topbar: { background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: 700, fontSize: '1.1rem', color: '#1a1a2e' },
  userBadge: { background: '#f0f2f5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#555' },
  main: { padding: '2rem' },
}

export default function AdminLayout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/admin/login') }
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <div style={S.layout}>
      <aside style={S.sidebar}>
        <div style={S.logo}>🛍️ ShopZone Admin</div>
        <nav style={S.nav}>
          {menu.map(m => (
            <Link key={m.path} to={m.path} style={S.link(isActive(m.path, m.exact))}>
              {m.label}
            </Link>
          ))}
        </nav>
        <div style={S.footer}>
          <button onClick={handleLogout} style={S.logoutBtn}>🚪 Logout</button>
        </div>
      </aside>
      <div style={S.content}>
        <div style={S.topbar}>
          <span style={S.title}>{title || 'Admin Panel'}</span>
          <span style={S.userBadge}>👤 {user?.name || user?.email}</span>
        </div>
        <div style={S.main}>{children}</div>
      </div>
    </div>
  )
}
