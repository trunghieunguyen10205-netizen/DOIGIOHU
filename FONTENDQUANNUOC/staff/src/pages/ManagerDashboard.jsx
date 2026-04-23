import { useState, useEffect } from 'react';
import { FiClock, FiCheck, FiPlay, FiDollarSign, FiCoffee, FiTruck,
         FiShoppingBag, FiBarChart2, FiLogOut, FiUsers, FiGrid, FiRefreshCw, FiPackage, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCalendar, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import ProductsTab from './ProductsTab';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { io } from 'socket.io-client';

const API = 'https://doigiohu.onrender.com/api';
const SOCKET_URL = 'https://doigiohu.onrender.com';

const UI_MAP = {
  pending:   { color: '#FF9500', text: 'Chờ Pha',        bg: 'rgba(255, 149, 0, 0.1)', icon: <FiClock /> },
  preparing: { color: '#0071E3', text: 'Đang Làm',        bg: 'rgba(0, 113, 227, 0.1)', icon: <FiPlay /> },
  ready:     { color: '#FF3B30', text: 'Xong, Chờ Giao', bg: 'rgba(255, 59, 48, 0.1)', icon: <FiCheck /> },
  delivered: { color: '#34C759', text: 'Đã Lên Bàn',     bg: 'rgba(52, 199, 89, 0.1)', icon: <FiCoffee /> }
};

const TABS = [
  { key: 'orders',   icon: <FiShoppingBag />, label: 'Đơn Hàng' },
  { key: 'products', icon: <FiPackage />,     label: 'Sản Phẩm' },
  { key: 'stats',    icon: <FiBarChart2 />,   label: 'Doanh Thu' },
  { key: 'staff',    icon: <FiUsers />,       label: 'Nhân Viên' },
];

export default function ManagerDashboard() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('orders');
  
  // Staff State
  const [staff, setStaff]     = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ username: '', password: '', full_name: '', role: 'staff' });
  
  // Stats State
  const [revenueData, setRevenueData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [summary, setSummary] = useState({ day: 0, month: 0, year: 0 });
  
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchOrders = () => {
    axios.get(`${API}/orders`).then(res => {
      const map = {};
      res.data.forEach(row => {
        const key = row.table_id || 'Mang đi';
        if (!map[key]) map[key] = { id: key, table: `Bàn ${key}`, total: 0, batches: [] };
        map[key].total += parseFloat(row.total || row.total_amount || 0);
        map[key].batches.push({
          id: row.id, status: row.status,
          time: new Date(row.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          items: row.items.map(it => ({ qty: it.quantity, name: it.name, options: it.options }))
        });
      });
      setOrders(Object.values(map));
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  const fetchStaff = () => {
    axios.get(`${API}/users`, getAuthHeader()).then(res => setStaff(res.data)).catch(console.error);
  };

  const fetchStats = async () => {
    try {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const from = lastWeek.toISOString().split('T')[0];
      const to = today.toISOString().split('T')[0];

      const [revRes, topRes, sumRes] = await Promise.all([
        axios.get(`${API}/reports/range?from=${from}&to=${to}`, getAuthHeader()),
        axios.get(`${API}/reports/top-items`, getAuthHeader()),
        axios.get(`${API}/reports/summary`, getAuthHeader())
      ]);

      setRevenueData(revRes.data.map(d => ({
        date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        revenue: parseFloat(d.total_revenue)
      })));
      setTopItems(topRes.data);
      setSummary(sumRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join_staff_room');
    socket.on('order:updated', fetchOrders);
    socket.on('order:new', fetchOrders);
    socket.on('revenue:update', () => { fetchStats(); fetchOrders(); });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (tab === 'staff') fetchStaff();
    if (tab === 'stats') fetchStats();
  }, [tab]);

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await axios.put(`${API}/users/${editingStaff.id}`, staffForm, getAuthHeader());
      } else {
        await axios.post(`${API}/users`, staffForm, getAuthHeader());
      }
      setShowStaffForm(false);
      setEditingStaff(null);
      setStaffForm({ username: '', password: '', full_name: '', role: 'staff' });
      fetchStaff();
    } catch (err) { 
      const msg = err.response?.data?.message || 'Lỗi xử lý (Network/Server Error)';
      alert(`Lỗi: ${msg}`); 
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    try {
      await axios.delete(`${API}/users/${id}`, getAuthHeader());
      fetchStaff();
    } catch (err) { alert('Không thể xóa tài khoản này'); }
  };

  // Rendering Tabs as Functions to avoid focus loss issue
  const renderOrdersTab = () => (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', letterSpacing: '-0.02em' }}>Đơn hàng hiện tại</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34C759', fontWeight: 800, fontSize: '0.8rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor' }}></div>
          LIVE
        </div>
      </div>
      <div className="manager-order-grid">
        {orders.map(o => {
          const priority = getPriority(o.batches);
          const topUi = UI_MAP[priority];
          return (
            <div key={o.id} className="modern-card animate-up" style={{ borderTop: `6px solid ${topUi.color}` }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>{o.table}</h3>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: topUi.color, background: topUi.bg, padding: '6px 14px', borderRadius: '14px' }}>
                  {topUi.text}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {o.batches.map((b, idx) => {
                  const bui = UI_MAP[b.status] || UI_MAP.pending;
                  return (
                    <div key={b.id} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '20px', padding: '18px', borderLeft: `5px solid ${bui.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#86868b' }}>{b.time}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: bui.color }}>{bui.text}</span>
                      </div>
                      {b.items.map((it, i) => (
                        <div key={i} style={{ fontWeight: 600, fontSize: '1.05rem' }}>{it.qty}x {it.name}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0071E3' }}>{o.total.toLocaleString()}đ</span>
                <span style={{ fontSize: '0.85rem', color: '#86868b', fontWeight: 700 }}>Theo dõi Live 🛰️</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="animate-up">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', letterSpacing: '-0.02em' }}>Báo cáo doanh thu</h3>
      </div>

      {/* Revenue Summary Cards - Stack on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Hôm nay', value: summary.day,   color: '#0071E3', icon: <FiActivity />, emoji: '📅' },
          { label: 'Tháng này', value: summary.month, color: '#34C759', icon: <FiDollarSign />, emoji: '💰' },
          { label: 'Năm nay', value: summary.year,  color: '#AF52DE', icon: <FiCalendar />, emoji: '🏆' }
        ].map(s => (
          <div key={s.label} className="modern-card animate-scale" style={{ padding: '20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ color: '#86868b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>{s.label}</span>
              <div style={{ color: s.color, background: `${s.color}18`, padding: '8px', borderRadius: '12px', fontSize: '0.9rem' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>
              {(s.value || 0).toLocaleString()}đ
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Stack on mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="modern-card" style={{ padding: '20px', height: '280px' }}>
          <h4 style={{ marginBottom: '16px', fontWeight: 800, fontSize: '1rem' }}>Biểu đồ 7 ngày</h4>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#86868b', fontSize: 11}} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#86868b', fontSize: 10}} width={50} />
              <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)' }} />
              <Line type="monotone" dataKey="revenue" stroke="#0071E3" strokeWidth={3} dot={{ r: 5, fill: '#0071E3', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="modern-card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '20px', fontWeight: 800, fontSize: '1rem' }}>Top món bán chạy</h4>
          {topItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#86868b', padding: '30px', fontWeight: 600 }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topItems.slice(0, 5).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>{idx+1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ width: `${(item.total_sold / (topItems[0]?.total_sold || 1)) * 100}%`, height: '6px', background: '#0071E3', borderRadius: '4px', marginTop: '5px', minWidth: '8px', transition: 'width 0.5s' }}></div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{item.total_sold} <span style={{fontSize: '0.75rem', color: '#86868b'}}>bán</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div className="animate-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Quản trị nhân sự</h3>
        <button 
          onClick={() => { setShowStaffForm(true); setEditingStaff(null); setStaffForm({ username: '', password: '', full_name: '', role: 'staff' }); }} 
          className="btn-sleek" style={{ width: 'auto', padding: '12px 24px' }}
        >
          <FiPlus /> Thêm tài khoản
        </button>
      </div>

      {showStaffForm && (
        <div className="modern-card animate-scale" style={{ marginBottom: '30px', border: '1px solid #0071E3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <h4 style={{ fontWeight: 800 }}>{editingStaff ? 'Cập nhật tài khoản' : 'Tạo nhân viên mới'}</h4>
            <button onClick={() => setShowStaffForm(false)} style={{ background: 'none', border: 'none', color: '#86868b' }}><FiX size={24}/></button>
          </div>
          <form onSubmit={handleStaffSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <input placeholder="Họ và tên" value={staffForm.full_name} onChange={e => setStaffForm({...staffForm, full_name: e.target.value})} required style={{ padding: '15px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', fontWeight: 600 }} />
            <input placeholder="Tên đăng nhập" value={staffForm.username} onChange={e => setStaffForm({...staffForm, username: e.target.value})} required disabled={!!editingStaff} style={{ padding: '15px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', fontWeight: 600 }} />
            <input placeholder={editingStaff ? "Để trống nếu không đổi pass" : "Mật khẩu"} type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} required={!editingStaff} style={{ padding: '15px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', fontWeight: 600 }} />
            <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} style={{ padding: '15px', borderRadius: '18px', border: '1.5px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', fontWeight: 600 }}>
              <option value="staff">Nhân viên phục vụ</option>
              <option value="manager">Quản lý hệ thống</option>
            </select>
            <button type="submit" className="btn-sleek" style={{ gridColumn: '1 / -1', padding: '18px' }}><FiSave /> Xác nhận lưu</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {staff.map(s => (
          <div key={s.id} className="modern-card animate-up" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: '#0071E3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900 }}>
              {s.full_name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{s.full_name}</div>
              <div style={{ fontSize: '0.85rem', color: '#86868b', fontWeight: 600 }}>@{s.username} • {s.role === 'manager' ? 'ADMIN' : 'STAFF'}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditingStaff(s); setStaffForm({ username: s.username, full_name: s.full_name, role: s.role, password: '' }); setShowStaffForm(true); }} style={{ padding: '10px', borderRadius: '14px', background: 'rgba(0,113,227,0.1)', color: '#0071E3', border: 'none' }}><FiEdit2 /></button>
              <button onClick={() => deleteStaff(s.id)} style={{ padding: '10px', borderRadius: '14px', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', border: 'none' }}><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getPriority = (batches) => {
    if (batches.some(b => b.status === 'pending'))   return 'pending';
    if (batches.some(b => b.status === 'ready'))     return 'ready';
    if (batches.some(b => b.status === 'preparing')) return 'preparing';
    return 'delivered';
  };

  const renderContent = () => {
    switch(tab) {
      case 'orders': return renderOrdersTab();
      case 'products': return <ProductsTab />;
      case 'stats': return renderStatsTab();
      case 'staff': return renderStaffTab();
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        .manager-layout { 
          display: flex; 
          min-height: 100vh; 
          background: #f5f5f7; 
          position: relative;
          overflow: hidden;
        }
        
        /* Animated Mesh Gradient Background */
        .mesh-gradient {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          background: 
            radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 0%, rgba(175, 82, 222, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(52, 199, 89, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255, 149, 0, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(255, 59, 48, 0.1) 0px, transparent 50%);
          filter: blur(80px);
          opacity: 0.8;
        }

        .blob {
          position: absolute;
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, rgba(0, 113, 227, 0.2), rgba(175, 82, 222, 0.2));
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          animation: float 20s infinite alternate;
        }

        @keyframes float {
          0% { transform: translate(-10%, -10%) rotate(0deg); }
          100% { transform: translate(10%, 10%) rotate(360deg); }
        }

        .sidebar-title { font-size: 1.5rem; font-weight: 900; background: linear-gradient(to right, #0071e3, #00c7be, #0071e3); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shineText 3s linear infinite; }
        @keyframes shineText { to { background-position: 200% center; } }
        .premium-header-bg { background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(40px) saturate(200%); box-shadow: 0 1px 0 rgba(0,0,0,0.05); }
        .manager-sidebar { display: none; width: 280px; flex-shrink: 0; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(40px) saturate(200%); border-right: 1px solid rgba(255,255,255,0.4); padding: 40px 25px; position: sticky; top: 0; height: 100vh; flex-direction: column; justify-content: space-between; z-index: 10; }
        @media (min-width: 768px) { .manager-sidebar { display: flex; } .manager-bottom-nav { display: none !important; } .manager-main { padding: 40px 50px; } .manager-order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 25px; } .mobile-header { display: none !important; } }
        @media (max-width: 767px) { .manager-main { padding: 25px 20px 100px; } .manager-order-grid { display: flex; flex-direction: column; gap: 20px; } }
        .manager-bottom-nav { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(20px) !important; border-top: 1px solid rgba(0,0,0,0.05); }
        .manager-bottom-nav .nav-item { color: #86868b; transition: all 0.3s; }
        .manager-bottom-nav .nav-item.active { background: #0071E3 !important; color: white !important; border-radius: 18px; box-shadow: 0 10px 20px rgba(0,113,227,0.3); }
        .manager-bottom-nav .nav-item.active span { color: white !important; }
        .manager-main { position: relative; z-index: 5; }
      `}</style>
      <div className="manager-layout">
        <div className="mesh-gradient"></div>
        <div className="blob" style={{ top: '-10%', left: '-10%' }}></div>
        <div className="blob" style={{ bottom: '-10%', right: '-10%', animationDelay: '-5s', background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.2), rgba(255, 149, 0, 0.2))' }}></div>
        
        <aside className="manager-sidebar">
          <div>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '24px', background: '#0071E3', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 25px rgba(0,113,227,0.3)', border: '4px solid white' }}><FiCoffee size={38} color="white" /></div>
              <h1 className="sidebar-title">Đồi Gió Hú</h1>
              <p style={{ fontSize: '0.8rem', color: '#86868b', marginTop: '6px', fontWeight: 800, letterSpacing: '1px' }}>ADMIN CONSOLE</p>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', transition: 'all 0.4s', background: tab === t.key ? '#0071E3' : 'transparent', color: tab === t.key ? 'white' : '#1d1d1f', boxShadow: tab === t.key ? '0 8px 20px rgba(0,113,227,0.3)' : 'none' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px', borderRadius: '22px', border: 'none', cursor: 'pointer', fontWeight: 800, background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', width: '100%' }}><FiLogOut /> Đăng xuất</button>
        </aside>
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '25px 20px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-header premium-header-bg">
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: '#1d1d1f' }}>Đồi Gió Hú</h2>
            <button onClick={handleLogout} style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '10px 18px', borderRadius: '15px', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}>THOÁT</button>
          </div>
          <div className="manager-main">{renderContent()}</div>
        </main>
      </div>
      <div className="bottom-nav manager-bottom-nav">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`nav-item ${tab === t.key ? 'active' : ''}`} style={{ background: 'none', border: 'none' }}>{t.icon}<span>{t.label}</span></button>
        ))}
      </div>
    </>
  );
}
