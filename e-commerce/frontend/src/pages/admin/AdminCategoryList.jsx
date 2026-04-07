import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { adminApi } from '../../services/api.js'
import toast from 'react-hot-toast'

const S = {
  layout: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontSize: '0.875rem' },
  th: { background: '#f8f9fa', padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#555', fontSize: '0.8rem' },
  td: { padding: '12px 16px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  form: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  formTitle: { fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem', color: '#1a1a2e' },
  group: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  saveBtn: { background: '#e94560', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, width: '100%' },
  cancelBtn: { background: '#f0f2f5', color: '#555', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, width: '100%', marginTop: '8px' },
  editBtn: { background: '#f0f2f5', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 },
  delBtn: { background: '#fef2f2', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' },
  badge: (active) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: active ? '#dcfce7' : '#f5f5f5', color: active ? '#16a34a' : '#999' }),
}

const initForm = { name: '', description: '', imageUrl: '', sortOrder: 0 }

export default function AdminCategoryList() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminApi.getCategories()
      setCategories(r.data.data || [])
    } catch { toast.error('Failed to load categories') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const startEdit = (cat) => {
    setEditId(cat.id)
    setForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '', sortOrder: cat.sortOrder })
  }

  const cancelEdit = () => { setEditId(null); setForm(initForm) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Category name is required')
    setSaving(true)
    try {
      if (editId) {
        await adminApi.updateCategory(editId, form)
        toast.success('Category updated!')
      } else {
        await adminApi.createCategory(form)
        toast.success('Category created! 🎉')
      }
      cancelEdit()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      await adminApi.deleteCategory(id)
      toast.success('Category deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <AdminLayout title="📁 Categories">
      <div style={S.layout}>
        {/* Table */}
        <div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Slug</th>
                <th style={S.th}>Products</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Order</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#aaa' }}>⏳ Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#aaa' }}>No categories yet.</td></tr>
              ) : categories.map(c => (
                <tr key={c.id} style={{ background: editId === c.id ? '#fffbeb' : '' }}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{c.description.slice(0, 50)}...</div>}
                  </td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>{c.slug}</td>
                  <td style={S.td}><span style={{ fontWeight: 700 }}>{c.productCount}</span></td>
                  <td style={S.td}><span style={S.badge(c.isActive)}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={S.td}>{c.sortOrder}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={S.editBtn} onClick={() => startEdit(c)}>✏️ Edit</button>
                      <button style={S.delBtn} onClick={() => handleDelete(c.id, c.name)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form */}
        <div style={S.form}>
          <div style={S.formTitle}>{editId ? '✏️ Edit Category' : '➕ Add Category'}</div>
          <form onSubmit={handleSubmit}>
            <div style={S.group}>
              <label style={S.label}>Name *</label>
              <input style={S.input} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Footwear" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Description</label>
              <input style={S.input} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Brief description" />
            </div>
            <div style={S.group}>
              <label style={S.label}>Image URL</label>
              <input style={S.input} value={form.imageUrl} onChange={e => setF('imageUrl', e.target.value)} placeholder="https://..." />
              {form.imageUrl && <img src={form.imageUrl} alt="" style={{ width: '100%', borderRadius: '8px', marginTop: '8px', height: '100px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
            </div>
            <div style={S.group}>
              <label style={S.label}>Sort Order</label>
              <input style={S.input} type="number" value={form.sortOrder} onChange={e => setF('sortOrder', parseInt(e.target.value) || 0)} placeholder="0" />
            </div>
            <button type="submit" style={S.saveBtn} disabled={saving}>{saving ? '⏳ Saving...' : (editId ? '✅ Update' : '🚀 Create')}</button>
            {editId && <button type="button" style={S.cancelBtn} onClick={cancelEdit}>Cancel</button>}
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
