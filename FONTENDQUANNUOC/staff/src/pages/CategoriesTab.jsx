import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiTag } from 'react-icons/fi';
import axios from 'axios';
import { useNotification } from '../components/Notification';

const API = 'https://doigiohu.onrender.com/api';

const CATEGORY_EMOJIS = ['☕', '🧋', '🍵', '🥤', '🍹', '🧃', '🍺', '🍶', '🧊', '🍰', '🍩', '🍪', '🥗', '🍜', '🍕', '🥪'];

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null | 'new' | id
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { showToast, showConfirm, NotificationUI } = useNotification();

  const fetch = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const startAdd = () => {
    setForm({ name: '', description: '' });
    setEditingId('new');
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
  };

  const cancel = () => { setEditingId(null); setForm({ name: '', description: '' }); };

  const save = async () => {
    if (!form.name.trim()) return showToast('Thiếu thông tin', 'Vui lòng nhập tên danh mục', 'warning');
    setSaving(true);
    try {
      if (editingId === 'new') {
        await axios.post(`${API}/categories`, form);
        showToast('Thêm thành công! 🎉', `Đã tạo danh mục "${form.name}"`, 'success');
      } else {
        await axios.put(`${API}/categories/${editingId}`, form);
        showToast('Đã cập nhật', `Danh mục "${form.name}" đã được sửa`, 'success');
      }
      cancel();
      fetch();
    } catch (e) {
      showToast('Lỗi lưu', e.response?.data?.message || e.message, 'error');
    } finally { setSaving(false); }
  };

  const remove = async (cat) => {
    const ok = await showConfirm({
      icon: '🗑️',
      title: `Xóa "${cat.name}"?`,
      message: 'Danh mục phải không còn món nào bên trong mới có thể xóa được.',
      confirmText: 'Xóa ngay',
      cancelText: 'Giữ lại',
      danger: true,
    });
    if (!ok) return;
    try {
      await axios.delete(`${API}/categories/${cat.id}`);
      showToast('Đã xóa', `Danh mục "${cat.name}" đã bị xóa`, 'success');
      fetch();
    } catch (e) {
      showToast('Không thể xóa', e.response?.data?.message || e.message, 'error');
    }
  };

  const getEmoji = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('cà phê') || lower.includes('cafe')) return '☕';
    if (lower.includes('trà') || lower.includes('matcha')) return '🍵';
    if (lower.includes('nước') || lower.includes('ngọt')) return '🥤';
    if (lower.includes('sinh tố') || lower.includes('ép')) return '🍹';
    if (lower.includes('bia') || lower.includes('rượu')) return '🍺';
    if (lower.includes('bánh') || lower.includes('cake')) return '🍰';
    if (lower.includes('ăn') || lower.includes('food')) return '🍜';
    return '🧋';
  };

  return (
    <div className="animate-up">
      {NotificationUI}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', letterSpacing: '-0.02em' }}>
            Danh mục thực đơn
          </h3>
          <p style={{ color: '#86868b', fontSize: '0.82rem', fontWeight: 600, margin: '4px 0 0' }}>
            {categories.length} danh mục • Thêm, sửa, xóa tùy ý
          </p>
        </div>
        <button
          onClick={startAdd}
          className="btn-sleek"
          style={{ width: 'auto', padding: '12px 18px', background: '#0071E3', flexShrink: 0, fontSize: '0.9rem' }}
        >
          <FiPlus /> Thêm mới
        </button>
      </div>

      {/* Add form inline */}
      {editingId === 'new' && (
        <div className="modern-card animate-scale" style={{ marginBottom: '20px', border: '2px solid #0071E3', padding: '20px' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '16px', color: '#0071E3' }}>
            ✨ Tạo danh mục mới
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              autoFocus
              placeholder="Tên danh mục (VD: Nước ngọt, Bia, Đồ ăn...)"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && save()}
              style={{ padding: '13px 16px', borderRadius: '14px', border: '1.5px solid rgba(0,113,227,0.3)', background: '#fff', fontWeight: 600, fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Mô tả ngắn (tùy chọn)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ padding: '13px 16px', borderRadius: '14px', border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontWeight: 500, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={cancel} className="btn-sleek" style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: '#555', padding: '12px' }}>
                Huỷ
              </button>
              <button onClick={save} disabled={saving} className="btn-sleek" style={{ flex: 2, background: '#0071E3', color: '#fff', padding: '12px' }}>
                {saving ? 'Đang lưu...' : <><FiCheck /> Xác nhận tạo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#86868b', fontWeight: 600 }}>
          Đang tải...
        </div>
      )}

      {/* Category List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {categories.map((cat, idx) => (
          <div key={cat.id}>
            {/* Edit mode */}
            {editingId === cat.id ? (
              <div className="modern-card animate-scale" style={{ border: '2px solid #34C759', padding: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '14px', color: '#34C759' }}>
                  ✏️ Đang sửa: {cat.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    autoFocus
                    placeholder="Tên danh mục"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && save()}
                    style={{ padding: '12px 16px', borderRadius: '14px', border: '1.5px solid rgba(52,199,89,0.4)', background: '#fff', fontWeight: 600, fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <input
                    placeholder="Mô tả (tùy chọn)"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ padding: '12px 16px', borderRadius: '14px', border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontWeight: 500, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={cancel} className="btn-sleek" style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: '#555', padding: '11px' }}>
                      <FiX /> Huỷ
                    </button>
                    <button onClick={save} disabled={saving} className="btn-sleek" style={{ flex: 2, background: '#34C759', color: '#fff', padding: '11px' }}>
                      {saving ? 'Đang lưu...' : <><FiCheck /> Lưu thay đổi</>}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal card */
              <div
                className="modern-card animate-up"
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', animationDelay: `${idx * 0.04}s` }}
              >
                {/* Emoji avatar */}
                <div style={{
                  width: '52px', height: '52px', borderRadius: '18px',
                  background: 'linear-gradient(135deg, #0071E315, #0071E330)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0
                }}>
                  {getEmoji(cat.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1d1d1f' }}>{cat.name}</div>
                  {cat.description && (
                    <div style={{ fontSize: '0.82rem', color: '#86868b', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.description}
                    </div>
                  )}
                </div>

                {/* ID badge */}
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0071E3', background: 'rgba(0,113,227,0.1)', padding: '4px 10px', borderRadius: '10px', flexShrink: 0 }}>
                  #{cat.id}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(cat)} className="icon-btn-apple" style={{ background: 'rgba(0,113,227,0.1)', color: '#0071E3' }}>
                    <FiEdit2 />
                  </button>
                  <button onClick={() => remove(cat)} className="icon-btn-apple" style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && categories.length === 0 && (
          <div className="modern-card" style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
            <div style={{ fontWeight: 700 }}>Chưa có danh mục nào</div>
            <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Bấm "Thêm mới" để tạo danh mục đầu tiên</div>
          </div>
        )}
      </div>

      <style>{`
        .icon-btn-apple { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
        .icon-btn-apple:hover { transform: scale(1.1); }
      `}</style>
    </div>
  );
}
