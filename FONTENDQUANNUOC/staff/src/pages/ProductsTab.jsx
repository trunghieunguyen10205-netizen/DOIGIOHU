import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiImage, FiType, FiTag, FiDollarSign, FiAlignLeft, FiChevronDown } from 'react-icons/fi';
import axios from 'axios';

const API = 'https://doigiohu.onrender.com/api';

const EMPTY = { name: '', price: '', category_id: '', description: '', image: '' };

// Custom Glass Dropdown Component
const GlassSelect = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input-premium"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer',
          padding: '14px 20px 14px 45px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: selectedOption ? '#1d1d1f' : '#86868b' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.3s', color: '#86868b' }} />
      </div>

      {isOpen && (
        <div 
          className="animate-up"
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            left: 0, 
            right: 0, 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(30px) saturate(200%)',
            borderRadius: '20px', 
            padding: '8px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', 
            zIndex: 1000,
            border: '1px solid rgba(255,255,255,0.5)',
            maxHeight: '250px',
            overflowY: 'auto'
          }}
        >
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{ 
                padding: '12px 18px', 
                borderRadius: '12px', 
                cursor: 'pointer', 
                fontWeight: 600,
                fontSize: '0.95rem',
                color: String(value) === String(opt.value) ? '#0071E3' : '#1d1d1f',
                background: String(value) === String(opt.value) ? 'rgba(0,113,227,0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (String(value) !== String(opt.value)) e.target.style.background = 'rgba(0,0,0,0.03)'; }}
              onMouseLeave={(e) => { if (String(value) !== String(opt.value)) e.target.style.background = 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProductsTab() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | item-object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const fetchAll = async () => {
    try {
      const [mi, cats] = await Promise.all([
        axios.get(`${API}/menu-items?all=true`),
        axios.get(`${API}/categories`),
      ]);
      setItems(mi.data);
      setCategories(cats.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (item) => {
    setForm({ name: item.name, price: item.price, category_id: item.category_id, description: item.description || '', image: item.image || '' });
    setModal(item);
  };

  const save = async () => {
    if (!form.name) return alert('Vui lòng nhập Tên món!');
    if (!form.price) return alert('Vui lòng nhập Giá món!');
    if (!form.category_id) return alert('Vui lòng chọn Danh mục!');
    
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), category_id: Number(form.category_id) };
      if (modal === 'add') {
        await axios.post(`${API}/menu-items`, payload);
      } else {
        await axios.put(`${API}/menu-items/${modal.id}`, payload);
      }
      setModal(null);
      fetchAll();
    } catch (e) { alert('Lỗi: ' + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Xóa "${item.name}"?`)) return;
    try { await axios.delete(`${API}/menu-items/${item.id}`); fetchAll(); }
    catch (e) { alert('Lỗi xóa: ' + e.message); }
  };

  const toggle = async (item) => {
    try { await axios.patch(`${API}/menu-items/${item.id}/toggle`); fetchAll(); }
    catch (e) { alert('Lỗi: ' + e.message); }
  };

  const displayed = filterCat === 'all' ? items : items.filter(i => String(i.category_id) === filterCat);
  const catName = (id) => categories.find(c => c.id === id)?.name || '—';

  return (
    <div className="animate-up">
      {/* Apple Style Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Danh mục sản phẩm</h3>
          <p style={{ color: '#86868b', fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>Quản lý menu và tình trạng kho hàng</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', minWidth: '350px' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ position: 'relative' }}>
              <FiTag style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: '#86868b' }} />
              <GlassSelect 
                value={filterCat}
                onChange={setFilterCat}
                placeholder="Tất cả danh mục"
                options={[{ value: 'all', label: 'Tất cả danh mục' }, ...categories.map(c => ({ value: String(c.id), label: c.name }))]}
              />
            </div>
          </div>

          <button onClick={openAdd} className="btn-sleek" style={{ width: 'auto', padding: '12px 24px', background: '#0071E3', flexShrink: 0 }}>
            <FiPlus /> Thêm Món Mới
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
           <div className="loading-spinner"></div>
           <p style={{ marginTop: '20px', color: '#86868b', fontWeight: 600 }}>Đang tải thực đơn...</p>
        </div>
      )}

      {/* Modern Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {displayed.map((item, idx) => (
          <div key={item.id} className="modern-card animate-scale" style={{ padding: 0, overflow: 'hidden', animationDelay: `${idx * 0.05}s`, opacity: item.is_available ? 1 : 0.8 }}>
            <div style={{ position: 'relative', height: '180px' }}>
              <img
                src={item.image ? (item.image.startsWith('http') ? item.image : `https://doigiohu.onrender.com/${item.image}`) : `https://placehold.co/400x220/0071e3/fff?text=${encodeURIComponent(item.name)}`}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!item.is_available && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: '#FF3B30', color: '#fff', fontWeight: 900, padding: '8px 20px', borderRadius: '30px', fontSize: '0.8rem', letterSpacing: '1px' }}>TẠM HẾT HÀNG</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: '15px', left: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', color: '#1d1d1f', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {catName(item.category_id)}
                </span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 5px', fontSize: '1.15rem', fontWeight: 800 }}>{item.name}</h4>
              <p style={{ margin: '0 0 15px', color: '#86868b', fontSize: '0.85rem', fontWeight: 500, height: '2.4em', overflow: 'hidden' }}>{item.description || 'Chưa có mô tả cho món này.'}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0071E3' }}>{parseInt(item.price).toLocaleString()}đ</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(item)} className="icon-btn-apple" style={{ background: 'rgba(0,113,227,0.1)', color: '#0071E3' }}><FiEdit2 /></button>
                  <button onClick={() => remove(item)} className="icon-btn-apple" style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}><FiTrash2 /></button>
                </div>
              </div>

              <button 
                onClick={() => toggle(item)} 
                className="btn-sleek" 
                style={{ 
                  background: item.is_available ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 113, 227, 0.1)', 
                  color: item.is_available ? '#34C759' : '#0071E3',
                  fontSize: '0.85rem'
                }}
              >
                {item.is_available ? '✓ Đang mở bán' : '↺ Mở bán lại'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Glassmorphism Modal */}
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(15px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modern-card animate-scale" style={{ width: '100%', maxWidth: '500px', padding: '35px', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)', overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>{modal === 'add' ? 'Thêm món mới' : 'Chỉnh sửa món'}</h3>
              <button onClick={() => setModal(null)} className="icon-btn-apple" style={{ background: 'rgba(0,0,0,0.05)' }}><FiX size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group-apple">
                <FiType className="input-icon" />
                <input placeholder="Tên món ăn / đồ uống" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="glass-input-premium" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px' }}>
                <div className="input-group-apple">
                  <FiDollarSign className="input-icon" />
                  <input type="number" placeholder="Giá bán" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="glass-input-premium" />
                </div>
                <div className="input-group-apple">
                  <FiTag className="input-icon" />
                  <GlassSelect 
                    value={form.category_id}
                    onChange={val => setForm({ ...form, category_id: val })}
                    placeholder="Chọn danh mục"
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </div>

              <div className="input-group-apple">
                <FiAlignLeft className="input-icon" />
                <textarea placeholder="Mô tả ngắn về sản phẩm..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input-premium" rows="3" style={{ height: 'auto', padding: '15px 15px 15px 45px' }} />
              </div>

              <div className="input-group-apple">
                <FiImage className="input-icon" />
                <input placeholder="Đường dẫn ảnh (URL hoặc uploads/name.jpg)" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="glass-input-premium" />
              </div>

              {form.image && (
                <div style={{ borderRadius: '20px', overflow: 'hidden', height: '140px', border: '2px solid rgba(0,0,0,0.05)' }}>
                  <img src={form.image.startsWith('http') ? form.image : `https://doigiohu.onrender.com/${form.image}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '35px' }}>
              <button onClick={() => setModal(null)} className="btn-sleek" style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: '#1d1d1f' }}>Hủy bỏ</button>
              <button onClick={save} disabled={saving} className="btn-sleek" style={{ flex: 2, background: '#0071E3', color: '#fff' }}>
                {saving ? 'Đang lưu...' : <><FiCheck /> Xác nhận lưu</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .glass-input-premium { width: 100%; padding: 14px 15px 14px 45px; border-radius: 16px; border: 1.5px solid rgba(0,0,0,0.05); background: rgba(0,0,0,0.02); font-weight: 600; outline: none; transition: all 0.3s; font-size: 0.95rem; }
        .glass-input-premium:focus { border-color: #0071E3; background: #fff; box-shadow: 0 0 0 4px rgba(0,113,227,0.1); }
        .input-group-apple { position: relative; width: 100%; }
        .input-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #86868b; font-size: 1.1rem; }
        .icon-btn-apple { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s; font-size: 1.2rem; }
        .icon-btn-apple:hover { transform: scale(1.1); }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid rgba(0,113,227,0.1); border-top-color: #0071E3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
