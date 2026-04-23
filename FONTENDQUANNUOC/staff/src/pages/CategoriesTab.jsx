import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useNotification } from '../components/Notification';

const API = 'https://doigiohu.onrender.com/api';

// ─── 150+ Emoji picker ───────────────────────────────────────────────────────
const EMOJI_GROUPS = {
  '☕ Đồ Uống':  ['☕','🍵','🧋','🥤','🍹','🧃','🍺','🍻','🥂','🍷','🍸','🍶','🧊','🧉','🫖','🍾','🥛','🍼'],
  '🍔 Đồ Ăn':   ['🍔','🍕','🌮','🍜','🍝','🍛','🍚','🍱','🥗','🥪','🌯','🫔','🍞','🥐','🧆','🥙','🍗','🥩'],
  '🍰 Bánh Ngọt':['🍰','🎂','🍩','🍪','🧁','🍫','🍬','🍭','🍮','🍯','🥧','🍡','🧇','🥞','🍦','🍨','🍧','🍿'],
  '🍓 Trái Cây': ['🍓','🍇','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍑','🍒','🥝','🫐','🍈','🫒','🍅','🥑'],
  '✨ Khác':     ['✨','⭐','🌟','💫','🎯','🔥','💎','🌈','🎪','🏷️','📦','🎁','🛒','🍃','🌿','🧸','🎨','🏆'],
};

// Mini Emoji Picker
const EmojiPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(Object.keys(EMOJI_GROUPS)[0]);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Chọn icon"
        style={{
          width: '50px', height: '50px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(0,113,227,0.1), rgba(0,113,227,0.2))',
          border: open ? '2px solid #0071E3' : '2px solid transparent',
          fontSize: '1.7rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {value || '🧋'}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 8000 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(30px)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            border: '1px solid rgba(0,0,0,0.08)',
            zIndex: 8001, width: '272px', overflow: 'hidden',
          }}>
            {/* Group tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 8px 0', gap: '5px', borderBottom: '1px solid #f0f0f0' }}>
              {Object.keys(EMOJI_GROUPS).map(g => (
                <button key={g} type="button" onClick={() => setActiveGroup(g)}
                  style={{
                    padding: '5px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    whiteSpace: 'nowrap', fontSize: '1rem', fontWeight: 700,
                    background: activeGroup === g ? '#0071E3' : 'transparent',
                    color: activeGroup === g ? '#fff' : '#555',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                  title={g}
                >
                  {g.split(' ')[0]}
                </button>
              ))}
            </div>
            {/* Emoji grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '1px', padding: '8px' }}>
              {EMOJI_GROUPS[activeGroup].map(emoji => (
                <button
                  key={emoji} type="button"
                  onClick={() => { onChange(emoji); setOpen(false); }}
                  style={{
                    background: emoji === value ? 'rgba(0,113,227,0.12)' : 'transparent',
                    border: 'none', borderRadius: '8px', fontSize: '1.3rem',
                    padding: '5px', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (emoji !== value) e.currentTarget.style.background = '#f5f5f7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = emoji === value ? 'rgba(0,113,227,0.12)' : 'transparent'; }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState({ name: '', description: '', icon: '🧋' });
  const [saving, setSaving]         = useState(false);
  const { showToast, showConfirm, NotificationUI } = useNotification();

  const fetchCats = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCats(); }, []);

  const startAdd  = () => { setForm({ name: '', description: '', icon: '🧋' }); setEditingId('new'); };
  const startEdit = (cat) => { setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '🧋' }); setEditingId(cat.id); };
  const cancel    = () => { setEditingId(null); setForm({ name: '', description: '', icon: '🧋' }); };

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
      cancel(); fetchCats();
    } catch (e) {
      showToast('Lỗi lưu', e.response?.data?.message || e.message, 'error');
    } finally { setSaving(false); }
  };

  const remove = async (cat) => {
    const ok = await showConfirm({
      icon: '🗑️', title: `Xóa "${cat.name}"?`,
      message: 'Danh mục phải không còn món nào bên trong mới có thể xóa.',
      confirmText: 'Xóa ngay', cancelText: 'Giữ lại', danger: true,
    });
    if (!ok) return;
    try {
      await axios.delete(`${API}/categories/${cat.id}`);
      showToast('Đã xóa', `Danh mục "${cat.name}" đã bị xóa`, 'success');
      fetchCats();
    } catch (e) {
      showToast('Không thể xóa', e.response?.data?.message || e.message, 'error');
    }
  };

  // Inline form component
  const InlineForm = ({ color = '#0071E3', label }) => (
    <div className="modern-card animate-scale" style={{ marginBottom: '16px', border: `2px solid ${color}`, padding: '20px' }}>
      <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '14px', color }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Emoji + Name row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <EmojiPicker value={form.icon} onChange={icon => setForm({ ...form, icon })} />
          <input
            autoFocus
            placeholder="Tên danh mục (VD: Nước ngọt, Bia...)"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && save()}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '14px', border: `1.5px solid ${color}40`, background: '#fff', fontWeight: 600, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <input
          placeholder="Mô tả ngắn (tùy chọn)"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          style={{ padding: '12px 16px', borderRadius: '14px', border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontWeight: 500, fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={cancel} className="btn-sleek" style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: '#555', padding: '12px' }}>
            <FiX style={{ marginRight: 4 }} /> Huỷ
          </button>
          <button onClick={save} disabled={saving} className="btn-sleek" style={{ flex: 2, background: color, color: '#fff', padding: '12px' }}>
            {saving ? 'Đang lưu...' : <><FiCheck style={{ marginRight: 4 }} /> {editingId === 'new' ? 'Xác nhận tạo' : 'Lưu thay đổi'}</>}
          </button>
        </div>
      </div>
    </div>
  );

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
            {categories.length} danh mục • Click vào emoji để đổi icon
          </p>
        </div>
        <button onClick={startAdd} className="btn-sleek"
          style={{ width: 'auto', padding: '12px 18px', background: '#0071E3', flexShrink: 0, fontSize: '0.9rem' }}>
          <FiPlus /> Thêm mới
        </button>
      </div>

      {/* Add form */}
      {editingId === 'new' && <InlineForm color="#0071E3" label="✨ Tạo danh mục mới" />}

      {loading && <div style={{ textAlign: 'center', padding: '60px', color: '#86868b', fontWeight: 600 }}>Đang tải...</div>}

      {/* Category List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {categories.map((cat, idx) => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <InlineForm color="#34C759" label={`✏️ Đang sửa: ${cat.name}`} />
            ) : (
              <div className="modern-card animate-up"
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', animationDelay: `${idx * 0.04}s` }}>
                {/* Emoji */}
                <div style={{
                  width: '50px', height: '50px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(0,113,227,0.08), rgba(0,113,227,0.18))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                }}>
                  {cat.icon || '🧋'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1d1d1f' }}>{cat.name}</div>
                  {cat.description && (
                    <div style={{ fontSize: '0.8rem', color: '#86868b', fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.description}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0071E3', background: 'rgba(0,113,227,0.1)', padding: '3px 9px', borderRadius: '9px', flexShrink: 0 }}>
                  #{cat.id}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(cat)} className="icon-btn-apple" style={{ background: 'rgba(0,113,227,0.1)', color: '#0071E3' }}><FiEdit2 /></button>
                  <button onClick={() => remove(cat)} className="icon-btn-apple" style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}><FiTrash2 /></button>
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
        .icon-btn-apple { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; font-size: 1rem; }
        .icon-btn-apple:hover { transform: scale(1.1); }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}
