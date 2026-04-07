import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout.jsx'
import { adminApi } from '../../services/api.js'
import toast from 'react-hot-toast'

const S = {
  form: { background: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#333', marginBottom: '6px' },
  required: { color: '#e94560' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' },
  textarea: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', resize: 'vertical', minHeight: '100px', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', background: '#fff', outline: 'none', boxSizing: 'border-box' },
  sectionTitle: { fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', marginBottom: '1rem', paddingBottom: '8px', borderBottom: '2px solid #f0f2f5', marginTop: '1.5rem' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: '#333' },
  actions: { display: 'flex', gap: '12px', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f0f2f5' },
  saveBtn: (loading) => ({ background: loading ? '#ccc' : '#e94560', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem' }),
  cancelBtn: { background: '#f0f2f5', color: '#555', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' },
  imageRow: { display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' },
  imagePreview: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #e5e7eb' },
  removeImg: { background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', position: 'absolute', top: '-6px', right: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: '0.75rem', color: '#aaa', marginTop: '4px' },
  tagInput: { display: 'flex', gap: '8px' },
  tag: { background: '#f0f2f5', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '0.85rem', padding: 0 },
}

const initForm = {
  name: '', sku: '', description: '', shortDescription: '', price: '', compareAtPrice: '', costPrice: '',
  stock: '', lowStockThreshold: '5', brand: '', categoryId: '', isActive: true, isFeatured: false,
  metaTitle: '', metaDescription: '', metaKeywords: '',
  images: [{ url: '', altText: '', isPrimary: true }],
  tags: [],
}

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState(initForm)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    adminApi.getCategories().then(r => setCategories(r.data.data || [])).catch(() => {})
    if (isEdit) {
      setLoading(true)
      adminApi.getProduct(id).then(r => {
        const p = r.data.data
        setForm({
          name: p.name || '', sku: p.sku || '', description: p.description || '',
          shortDescription: p.shortDescription || '', price: p.price || '', compareAtPrice: p.compareAtPrice || '',
          costPrice: p.costPrice || '', stock: p.stock || '', lowStockThreshold: p.lowStockThreshold || '5',
          brand: p.brand || '', categoryId: p.categoryId || '', isActive: p.isActive,
          isFeatured: p.isFeatured, metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '',
          metaKeywords: p.metaKeywords || '',
          images: p.images?.length ? p.images : [{ url: '', altText: '', isPrimary: true }],
          tags: p.tags || [],
        })
      }).catch(() => toast.error('Failed to load product'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const setImg = (i, key, val) => {
    const imgs = [...form.images]
    imgs[i] = { ...imgs[i], [key]: val }
    set('images', imgs)
  }

  const addImage = () => set('images', [...form.images, { url: '', altText: '', isPrimary: false }])
  const removeImage = (i) => set('images', form.images.filter((_, idx) => idx !== i))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); setTagInput('') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Product name is required')
    if (!form.price) return toast.error('Price is required')
    if (!form.stock && form.stock !== 0) return toast.error('Stock is required')
    if (!form.categoryId) return toast.error('Please select a category')

    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        stock: parseInt(form.stock),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        images: form.images.filter(img => img.url.trim()),
      }

      if (isEdit) {
        await adminApi.updateProduct(id, payload)
        toast.success('Product updated! ✅')
      } else {
        await adminApi.createProduct(payload)
        toast.success('Product created! 🎉')
      }
      navigate('/admin/products')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    }
    setSaving(false)
  }

  if (loading) return <AdminLayout title="Loading..."><div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>⏳ Loading product...</div></AdminLayout>

  return (
    <AdminLayout title={isEdit ? '✏️ Edit Product' : '➕ New Product'}>
      <form onSubmit={handleSubmit} style={S.form}>

        {/* Basic Info */}
        <div style={S.sectionTitle}>Basic Information</div>
        <div style={S.grid2}>
          <div style={S.group}>
            <label style={S.label}>Product Name <span style={S.required}>*</span></label>
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Nike Air Max 270" />
          </div>
          <div style={S.group}>
            <label style={S.label}>SKU</label>
            <input style={S.input} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Auto-generated if empty" />
          </div>
        </div>

        <div style={S.group}>
          <label style={S.label}>Short Description</label>
          <input style={S.input} value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} placeholder="One-line product summary" />
        </div>
        <div style={S.group}>
          <label style={S.label}>Full Description <span style={S.required}>*</span></label>
          <textarea style={S.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed product description..." rows={5} />
        </div>

        {/* Pricing */}
        <div style={S.sectionTitle}>Pricing & Inventory</div>
        <div style={S.grid2}>
          <div style={S.group}>
            <label style={S.label}>Selling Price (₹) <span style={S.required}>*</span></label>
            <input style={S.input} type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="4999.00" />
          </div>
          <div style={S.group}>
            <label style={S.label}>Compare-at Price (₹) <span style={S.hint}>(for discount display)</span></label>
            <input style={S.input} type="number" step="0.01" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="5999.00" />
          </div>
          <div style={S.group}>
            <label style={S.label}>Cost Price (₹)</label>
            <input style={S.input} type="number" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="2500.00" />
          </div>
          <div style={S.group}>
            <label style={S.label}>Stock Quantity <span style={S.required}>*</span></label>
            <input style={S.input} type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="100" />
          </div>
          <div style={S.group}>
            <label style={S.label}>Low Stock Alert Threshold</label>
            <input style={S.input} type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} placeholder="5" />
          </div>
        </div>

        {/* Classification */}
        <div style={S.sectionTitle}>Classification</div>
        <div style={S.grid2}>
          <div style={S.group}>
            <label style={S.label}>Category <span style={S.required}>*</span></label>
            <select style={S.select} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={S.group}>
            <label style={S.label}>Brand</label>
            <input style={S.input} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Nike" />
          </div>
        </div>

        <div style={S.group}>
          <label style={S.label}>Tags</label>
          <div style={S.tagInput}>
            <input style={{ ...S.input, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag and press Enter"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
            <button type="button" onClick={addTag} style={{ ...S.saveBtn(false), padding: '10px 16px' }}>Add</button>
          </div>
          {form.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {form.tags.map(t => (
                <span key={t} style={S.tag}>
                  {t}
                  <button type="button" style={S.tagRemove} onClick={() => set('tags', form.tags.filter(x => x !== t))}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div style={S.sectionTitle}>Product Images</div>
        {form.images.map((img, i) => (
          <div key={i} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input style={{ ...S.input, marginBottom: '8px' }} value={img.url} onChange={e => setImg(i, 'url', e.target.value)} placeholder="Image URL (https://...)" />
                <input style={S.input} value={img.altText || ''} onChange={e => setImg(i, 'altText', e.target.value)} placeholder="Alt text (for SEO & accessibility)" />
              </div>
              {img.url && <img src={img.url} alt="" style={S.imagePreview} onError={e => e.target.style.display = 'none'} />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <label style={{ ...S.checkbox, fontSize: '0.75rem' }}>
                  <input type="checkbox" checked={img.isPrimary} onChange={e => { const imgs = form.images.map((x,j) => ({ ...x, isPrimary: j === i })); set('images', imgs) }} />
                  Primary
                </label>
                {form.images.length > 1 && (
                  <button type="button" style={S.delBtn || { background: '#fef2f2', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', fontSize: '0.8rem' }} onClick={() => removeImage(i)}>✕</button>
                )}
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addImage} style={{ background: '#f0f2f5', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          ➕ Add Another Image
        </button>

        {/* SEO */}
        <div style={S.sectionTitle}>SEO & Meta Tags</div>
        <div style={S.group}>
          <label style={S.label}>Meta Title</label>
          <input style={S.input} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} placeholder="SEO page title (defaults to product name)" />
        </div>
        <div style={S.group}>
          <label style={S.label}>Meta Description</label>
          <textarea style={{ ...S.textarea, minHeight: '70px' }} value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} placeholder="160-char SEO description" />
        </div>
        <div style={S.group}>
          <label style={S.label}>Meta Keywords</label>
          <input style={S.input} value={form.metaKeywords} onChange={e => set('metaKeywords', e.target.value)} placeholder="keyword1, keyword2, keyword3" />
        </div>

        {/* Settings */}
        <div style={S.sectionTitle}>Settings</div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <label style={S.checkbox}>
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            Active (visible to customers)
          </label>
          <label style={S.checkbox}>
            <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
            🌟 Featured Product
          </label>
        </div>

        {/* Actions */}
        <div style={S.actions}>
          <button type="submit" style={S.saveBtn(saving)} disabled={saving}>
            {saving ? '⏳ Saving...' : (isEdit ? '✅ Update Product' : '🚀 Create Product')}
          </button>
          <button type="button" style={S.cancelBtn} onClick={() => navigate('/admin/products')}>Cancel</button>
        </div>
      </form>
    </AdminLayout>
  )
}
