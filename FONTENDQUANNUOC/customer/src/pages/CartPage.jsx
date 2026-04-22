import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiMinus, FiPlus, FiChevronLeft, FiShoppingBag, FiMessageSquare, FiCreditCard } from 'react-icons/fi';
import axios from 'axios';
import LogoHeader from '../components/LogoHeader';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalAmount, clearCart, tableId } = useCart();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        table_id: tableId || null,
        total_amount: totalAmount,
        note: note,
        items: cart
      };
      
      const res = await axios.post('https://doigiohu.onrender.com/api/orders', payload);
      clearCart();
      navigate(`/tracking/${res.data.orderCode}`);
    } catch (err) {
      alert('Có lỗi xảy ra khi đặt hàng');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="layout-container animate-up">
        <LogoHeader subtitle="Giỏ Hàng 🛒" />
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🛒</div>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.02em' }}>Giỏ hàng đang trống</h2>
          <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Hãy quay lại menu và chọn những món yêu thích của bạn nhé!</p>
          <button 
            onClick={() => navigate('/menu')}
            className="btn-sleek"
            style={{ marginTop: '35px', padding: '18px 45px', background: 'var(--primary)', color: 'white', fontWeight: '900', fontSize: '1.05rem' }}
          >
            Quay lại Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container animate-up">
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.4)' }}>
        <LogoHeader subtitle="Xác nhận đơn hàng ✅" />
        <button 
          onClick={() => navigate('/menu')}
          style={{ position: 'absolute', top: '25px', left: '15px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#1d1d1f', padding: '10px', borderRadius: '15px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <FiChevronLeft size={24} />
        </button>
      </div>

      <div style={{ padding: '25px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
           <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>{tableId ? `Bàn số ${tableId}` : 'Đơn mang đi'}</h2>
           <span style={{ background: 'rgba(0,113,227,0.1)', color: 'var(--primary)', padding: '6px 15px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>{cart.length} món</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '35px' }}>
          {cart.map((item, index) => (
            <div key={index} className="premium-card animate-scale" style={{ display: 'flex', padding: '15px', alignItems: 'center', gap: '18px', animationDelay: `${index * 0.1}s`, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <img src={item.image ? (item.image.startsWith('http') ? item.image : `https://doigiohu.onrender.com/${item.image}`) : `https://placehold.co/100x100/6366f1/FFFFFF/png?text=${encodeURIComponent(item.name)}`} alt={item.name} style={{ width: '85px', height: '85px', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 8px 15px rgba(0,0,0,0.08)' }} />
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', lineHeight: 1.2 }}>{item.name}</h4>
                <div style={{ fontSize: '0.78rem', color: '#86868b', fontWeight: '700', marginTop: '6px', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '8px', display: 'inline-block' }}>
                  🍹 Đá: {item.options?.ice} | Đường: {item.options?.sugar}
                </div>
                <p style={{ margin: '10px 0 0', color: 'var(--primary)', fontWeight: '900', fontSize: '1.15rem' }}>{parseInt(item.price_snapshot).toLocaleString()}đ</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={() => removeFromCart(index)}
                  style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                >
                  <FiTrash2 size={18} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: '15px', padding: '5px' }}>
                  <button onClick={() => updateQuantity(index, -1)} style={{ background: 'white', width: '32px', height: '32px', borderRadius: '10px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiMinus size={14}/></button>
                  <span style={{ padding: '0 12px', fontSize: '0.95rem', fontWeight: '900' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, 1)} style={{ background: 'white', width: '32px', height: '32px', borderRadius: '10px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiPlus size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiMessageSquare color="#86868b" />
            <label style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1d1d1f' }}>Ghi chú đặc biệt</label>
          </div>
          <textarea 
            placeholder="Ví dụ: Mang ra cùng lúc, ít đá, nhiều đường..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="glass-input-premium"
            style={{ width: '100%', height: '100px', resize: 'none', padding: '15px' }}
          />
        </div>

        <div className="premium-card" style={{ padding: '30px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: '#86868b', fontWeight: 600 }}>
            <span>Tạm tính ({cart.length} món):</span>
            <span>{totalAmount.toLocaleString()}đ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            <span>Tổng cộng:</span>
            <span style={{ color: 'var(--primary)' }}>{totalAmount.toLocaleString()}đ</span>
          </div>
          
          <button 
            onClick={handleOrder}
            disabled={isSubmitting}
            className="btn-sleek"
            style={{ 
              width: '100%', padding: '22px', 
              background: isSubmitting ? '#94a3b8' : 'var(--primary)', 
              color: 'white', fontWeight: '900', fontSize: '1.2rem',
              boxShadow: isSubmitting ? 'none' : '0 15px 35px rgba(0, 113, 227, 0.3)'
            }}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT MÓN 🚀'}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#86868b', marginTop: '18px', fontWeight: 600 }}>
            ⚡️ Đơn hàng sẽ được chuyển trực tiếp tới quầy pha chế
          </p>
        </div>
      </div>
      
      <style>{`
        .glass-input-premium { width: 100%; border-radius: 20px; border: 1.5px solid rgba(0,0,0,0.05); background: rgba(255,255,255,0.5); font-weight: 600; outline: none; transition: all 0.3s; font-size: 0.95rem; font-family: inherit; }
        .glass-input-premium:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(0,113,227,0.1); }
      `}</style>
    </div>
  );
}
