import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: '1.8rem', fontWeight: 900, color: '#1a1a2e' },
  logoSub: { fontSize: '0.85rem', color: '#888', marginTop: '4px' },
  label: { display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.95rem', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', transition: 'border 0.2s' },
  btn: (loading) => ({ width: '100%', padding: '13px', background: loading ? '#ccc' : '#e94560', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }),
  hint: { background: '#f8f9fa', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', color: '#666', marginTop: '1.5rem', textAlign: 'center' },
  hintBold: { fontWeight: 700, color: '#1a1a2e' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' },
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      toast.success('Welcome back! 👋')
      navigate('/admin')
    } else {
      setError(result.message)
    }
  }

  const autoFill = () => { setEmail('admin@shop.com'); setPassword('Admin@123') }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoText}>🛍️ ShopZone</div>
          <div style={S.logoSub}>Admin Panel Login</div>
        </div>

        {error && <div style={S.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@shop.com" required
            onFocus={e => e.target.style.border = '1.5px solid #e94560'}
            onBlur={e => e.target.style.border = '1px solid #e5e7eb'}
          />
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            onFocus={e => e.target.style.border = '1.5px solid #e94560'}
            onBlur={e => e.target.style.border = '1px solid #e5e7eb'}
          />
          <button type="submit" style={S.btn(loading)} disabled={loading}>
            {loading ? '⏳ Logging in...' : '🔐 Login to Admin'}
          </button>
        </form>

        <div style={S.hint}>
          <div style={S.hintBold}>Default Credentials</div>
          <div>admin@shop.com / Admin@123</div>
          <button onClick={autoFill} style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px', textDecoration: 'underline' }}>
            Click to auto-fill
          </button>
        </div>
      </div>
    </div>
  )
}
