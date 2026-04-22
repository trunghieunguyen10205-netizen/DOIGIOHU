import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiMinus, FiShoppingBag, FiX } from 'react-icons/fi';
import axios from 'axios';

const API_BASE = 'https://doigiohu.onrender.com/api';

export default function StaffTakeOrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('Tất cả');
  
  const [cart, setCart] = useState([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Modal State for Món
  const [selectedItem, setSelectedItem] = useState(null);
  const [options, setOptions] = useState({ ice: 'Bình thường', sugar: 'Bình thường', note: '' });

  // State kiểm tra bàn
  const [isOccupied, setIsOccupied] = useState(false);
  const [existingOrders, setExistingOrders] = useState([]);

  useEffect(() => {
    // Gọi Database thật nhe! Lấy all=true để thấy món tạm hết
    axios.get(`${API_BASE}/menu-items?all=true`).then(res => setMenuItems(res.data)).catch(console.error);
    
    // Gọi API lấy Categories thay vì mảng Fake
    axios.get(`${API_BASE}/categories`).then(res => {
      setCategories([{id: 0, name: 'Tất cả'}, ...res.data]);
    }).catch(console.error);

    // Xin Danh sách Đơn thực tế của Bàn Này (bỏ Mock)
    axios.get(`${API_BASE}/orders`).then(res => {
      const activeBatches = res.data.filter(o => String(o.table_id) === String(tableId));
      if (activeBatches.length > 0) {
        setIsOccupied(true);
        let itemsAggr = [];
        activeBatches.forEach(b => {
          b.items.forEach(it => {
            itemsAggr.push({ id: it.id, name: it.name, price: it.price_snapshot, qty: it.quantity, status: b.status });
          });
        });
        setExistingOrders(itemsAggr);
      } else {
        setIsOccupied(false);
        setExistingOrders([]);
      }
    }).catch(console.error);

  }, [tableId]);

  const existingTotal = existingOrders.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleQuickAdd = (item) => {
    // Unique ID cho giỏ hàng
    const cartId = item.id + '_' + Date.now();
    setCart(prev => [
      ...prev, 
      { 
        ...item, 
        cartId, 
        qty: 1, 
        selectedOptions: { ice: 'Bình thường', sugar: 'Bình thường', note: '' } 
      }
    ]);
  };

  const updateQty = (cartId, delta) => {
    setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const submitOrder = async () => {
    try {
      const payload = {
        table_id: tableId, 
        total_amount: cart.reduce((acc, i) => acc + i.price * i.qty, 0),
        note: 'Order từ Staff App',
        items: cart.map(i => ({
          menu_item_id: i.id,
          quantity: i.qty,
          price_snapshot: i.price,
          options: i.selectedOptions
        }))
      };
      
      await axios.post(`${API_BASE}/orders`, payload);
      alert('Đã đẩy lệnh Gọi Món thành công vào Cơ Sở Dữ Liệu! 🚀');
      navigate('/');
    } catch (error) {
      alert('Lỗi DB: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredItems = activeCat === 'Tất cả' 
    ? menuItems 
    : menuItems.filter(i => i.category_id === categories.find(c => c.name === activeCat)?.id);
    
  const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

  const handleDragStart = (e) => {
    const y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    e.currentTarget.setAttribute('data-starty', y);
  };
  
  const handleDragEnd = (e) => {
    const startY = parseFloat(e.currentTarget.getAttribute('data-starty') || '0');
    const endY = e.type.includes('mouse') ? e.clientY : e.changedTouches[0].clientY;
    if (startY - endY > 30) setIsCartExpanded(true);
    if (endY - startY > 30) setIsCartExpanded(false);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header Sticky */}
      <div style={{ padding: '15px 20px', background: 'white', display: 'flex', alignItems: 'center', gap: '15px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '12px', border: 'none' }}>
          <FiArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Bàn {tableId}</h2>
        </div>
        {isOccupied && (
          <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--status-occupied)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
            Đang bốc khói 🍲
          </span>
        )}
      </div>

      {/* Bill Hiện Tại */}
      {isOccupied && (
        <div style={{ padding: '15px 20px', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase' }}>
            📜 Món đã gọi trước đó
          </div>
          {existingOrders.map((itm, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: '700' }}>{itm.qty}x</span>
                <span>{itm.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: itm.status.includes('⏳') ? 'var(--status-pending)' : 'var(--status-free)', fontWeight: 'bold' }}>
                {itm.status}
              </span>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
            Tạm tính bill cũ: {existingTotal.toLocaleString()}đ
          </div>
        </div>
      )}

      {/* Tabs Phân Loại Món */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '15px 20px', gap: '10px' }}>
        {categories.map(c => (
          <button 
            key={c.id} onClick={() => setActiveCat(c.name)}
            style={{ 
              padding: '8px 20px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap',
              background: activeCat === c.name ? 'var(--text-main)' : 'white',
              border: '1px solid ' + (activeCat === c.name ? 'var(--text-main)' : 'var(--border)'),
              color: activeCat === c.name ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s', cursor: 'pointer'
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Món (Dữ liệu DB Thật) */}
      <div style={{ padding: '0 20px 80px' }}>
        <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Chọn món thêm vào Bill:</h4>
        {filteredItems.length === 0 && <p style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>Đang tải Data DB...</p>}
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => item.is_available && handleQuickAdd(item)} 
            className="modern-card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              cursor: item.is_available ? 'pointer' : 'not-allowed', 
              transition: 'all 0.2s',
              opacity: item.is_available ? 1 : 0.5,
              position: 'relative',
              padding: '12px'
            }}
          >
            <img 
              src={item.image ? (item.image.startsWith('http') ? item.image : `https://doigiohu.onrender.com/${item.image}`) : `https://placehold.co/60x60/6366f1/fff?text=${item.name[0]}`}
              alt={item.name}
              style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                {item.name} {!item.is_available && <span style={{color: '#ef4444', fontSize: '0.8rem', marginLeft: '5px'}}>(Tạm hết)</span>}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '4px' }}>{parseInt(item.price).toLocaleString()}đ</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tấm vé Chốt Bill nổi (Cart Floating Panel - Bottom Sheet) */}
      {cart.length > 0 && (
        <div 
          className="fade-in" 
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          style={{ 
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
            width: '100%', maxWidth: '480px', 
            padding: '10px 24px 30px', 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(30px) saturate(200%)',
            borderTopLeftRadius: '35px', borderTopRightRadius: '35px', 
            boxShadow: '0 -20px 60px rgba(0,0,0,0.15)', 
            zIndex: 2000,
            border: '1px solid rgba(255,255,255,0.4)',
            transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)'
          }}
        >
          {/* Drag Handle */}
          <div onClick={() => setIsCartExpanded(!isCartExpanded)} style={{ display: 'flex', justifyContent: 'center', paddingBottom: '15px', cursor: 'grab' }}>
            <div style={{ width: '50px', height: '5px', background: 'var(--border)', borderRadius: '10px' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }} onClick={() => setIsCartExpanded(!isCartExpanded)}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <FiShoppingBag color="var(--primary)"/> {isOccupied ? 'Gọi thêm' : 'Đang chọn'} ({cart.length})
            </h3>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>+{total.toLocaleString()}đ</span>
          </div>

          {isOccupied && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px dashed #cbd5e1', borderBottom: '1px solid #cbd5e1', marginBottom: '15px', background: '#FFF1F2', margin: '0 -24px 15px', padding: '10px 24px' }}>
              <span style={{ fontWeight: 700, color: '#F43F5E' }}>Tổng tiền bàn này mâm:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#E11D48' }}>{(existingTotal + total).toLocaleString()}đ</span>
            </div>
          )}

          <div style={{ maxHeight: isCartExpanded ? '55vh' : '150px', overflowY: 'auto', marginBottom: '20px', transition: 'max-height 0.3s ease-in-out' }}>
            {cart.map(c => (
              <div key={c.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{c.name}</div>
                  {/* Hiển thị options đã chọn ra màn hình để review trước khi chốt */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                     Đá: {c.selectedOptions.ice} | Đường: {c.selectedOptions.sugar} 
                     {c.selectedOptions.note && ` | Ghi chú: ${c.selectedOptions.note}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg-app)', padding: '6px 12px', borderRadius: '12px' }}>
                  <FiMinus size={18} color="var(--text-muted)" onClick={() => updateQty(c.cartId, -1)} style={{cursor:'pointer'}} />
                  <span style={{ fontWeight: '800', width: '22px', textAlign: 'center' }}>{c.qty}</span>
                  <FiPlus size={18} color="var(--text-muted)" onClick={() => updateQty(c.cartId, 1)} style={{cursor:'pointer'}} />
                </div>
              </div>
            ))}
          </div>

          <button className="btn-sleek" onClick={submitOrder}>
            {isOccupied ? 'BÁO BẾP GỌI THÊM 🚀' : 'MỞ BÀN & BÁO BẾP 🚀'}
          </button>
        </div>
      )}
    </div>
  );
}
