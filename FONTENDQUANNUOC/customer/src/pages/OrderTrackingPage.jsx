import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import LogoHeader from '../components/LogoHeader';
import { FiPackage, FiSearch, FiArrowLeft, FiCheckCircle, FiActivity } from 'react-icons/fi';

const statusMap = {
  'pending': { text: 'Chờ xác nhận', icon: '🔄', color: '#FF9500', step: 1, desc: 'Quán đã nhận đơn và đang kiểm tra' },
  'confirmed': { text: 'Đã xác nhận', icon: '👨‍🍳', color: '#5856D6', step: 2, desc: 'Đã báo đơn cho khu vực pha chế' },
  'preparing': { text: 'Đang pha chế', icon: '🍹', color: '#0071E3', step: 3, desc: 'Món của bạn đang được pha tỉ mỉ' },
  'ready': { text: 'Sẵn sàng!', icon: '🔔', color: '#34C759', step: 4, desc: 'Mời bạn lại quầy nhận món ngay nhé' },
  'completed': { text: 'Hoàn thành', icon: '✅', color: '#86868b', step: 5, desc: 'Chúc bạn ngon miệng!' },
  'cancelled': { text: 'Đã huỷ', icon: '❌', color: '#FF3B30', step: -1, desc: 'Rất tiếc, đơn hàng đã bị huỷ' }
};

export default function OrderTrackingPage() {
  const { orderCode } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/orders/track/${orderCode}`);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();

    const socket = io('http://localhost:3001');
    socket.emit('join:order_room', orderCode);
    
    socket.on('order:status_change', (data) => {
      setOrder(prev => prev ? { ...prev, status: data.status } : null);
    });

    return () => socket.disconnect();
  }, [orderCode]);

  if (loading) return (
    <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-up">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '20px', fontWeight: '800', color: '#86868b' }}>Đang tìm đơn hàng...</p>
      </div>
    </div>
  );

  if (!orderCode || !order) {
    return (
      <div className="layout-container animate-up">
        <LogoHeader subtitle="Theo dõi đơn hàng 🔍" />
        <div style={{ padding: '40px 20px' }}>
          <div className="premium-card" style={{ padding: '40px 30px', textAlign: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)' }}>
             <div style={{ width: '80px', height: '80px', background: 'rgba(0,113,227,0.1)', color: '#0071E3', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                <FiSearch size={40} />
             </div>
             <h2 style={{ marginBottom: '15px', fontWeight: '900', letterSpacing: '-0.02em' }}>Tìm kiếm đơn hàng</h2>
             <p style={{ color: '#86868b', marginBottom: '30px', fontSize: '0.95rem', fontWeight: 600 }}>Nhập mã đơn hàng ghi trên hóa đơn để xem trạng thái pha chế.</p>
             <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input
                  placeholder="Ví dụ: ORD12345"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  className="glass-input-premium"
                  style={{ textAlign: 'center', fontSize: '1.2rem', padding: '20px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/tracking/${searchInput}`);
                  }}
                />
             </div>
             <button 
               onClick={() => navigate(`/tracking/${searchInput}`)}
               className="btn-sleek"
               style={{ width: '100%', padding: '20px', background: '#0071E3', color: 'white', fontSize: '1.1rem' }}
             >
               TRA CỨU NGAY
             </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = statusMap[order.status] || statusMap['pending'];

  return (
    <div className="layout-container animate-up">
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.4)' }}>
        <LogoHeader subtitle="Tình trạng đơn hàng 🍹" />
        <button 
          onClick={() => navigate('/menu')}
          style={{ position: 'absolute', top: '25px', left: '15px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#1d1d1f', padding: '10px', borderRadius: '15px', cursor: 'pointer' }}
        >
          <FiArrowLeft size={24} />
        </button>
      </div>

      <div style={{ padding: '25px 20px' }}>
        <div className="premium-card animate-scale" style={{ padding: '40px 30px', textAlign: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(15px)', border: `2px solid ${currentStatus.color}20` }}>
          <div style={{ background: `${currentStatus.color}15`, color: currentStatus.color, padding: '8px 18px', borderRadius: '15px', display: 'inline-block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '25px' }}>
            MÃ ĐƠN: {order.order_code}
          </div>
          <div style={{ fontSize: '5rem', marginBottom: '20px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>{currentStatus.icon}</div>
          <h2 style={{ color: currentStatus.color, fontSize: '2.2rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.03em' }}>{currentStatus.text}</h2>
          <p style={{ color: '#86868b', fontWeight: '600', fontSize: '1rem' }}>{currentStatus.desc}</p>
          
          {currentStatus.step > 0 && currentStatus.step < 5 && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(currentStatus.step / 4) * 100}%`, background: `linear-gradient(to right, ${currentStatus.color}, #fff)`, borderRadius: '10px', transition: 'width 1.5s cubic-bezier(0.2, 0, 0, 1)', position: 'relative' }}>
                   <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '20px', background: '#fff', opacity: 0.5, filter: 'blur(5px)' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.72rem', color: '#86868b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span style={{ color: currentStatus.step >= 1 ? currentStatus.color : '' }}>Nhận đơn</span>
                <span style={{ color: currentStatus.step >= 2 ? currentStatus.color : '' }}>Xác nhận</span>
                <span style={{ color: currentStatus.step >= 3 ? currentStatus.color : '' }}>Pha chế</span>
                <span style={{ color: currentStatus.step >= 4 ? currentStatus.color : '' }}>Xong</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingLeft: '5px' }}>
           <FiPackage color="#86868b" />
           <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.02em' }}>Chi tiết món ({order.items.length})</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
          {order.items.map((item, idx) => (
            <div key={item.id} className="premium-card animate-scale" style={{ padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', animationDelay: `${idx * 0.1}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#0071E3', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', color: 'white', fontSize: '1.1rem', boxShadow: '0 5px 12px rgba(0,113,227,0.2)' }}>
                  {item.quantity}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#1d1d1f' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#86868b', fontWeight: '600', marginTop: '2px' }}>Phân loại: Đồ uống pha chế</div>
                </div>
              </div>
              <div style={{ fontWeight: '900', color: '#1d1d1f', fontSize: '1.1rem' }}>
                {parseInt(item.price_snapshot * item.quantity).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>
        
        <div className="premium-card" style={{ padding: '25px', background: '#1d1d1f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '25px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <FiCheckCircle color="#34C759" size={24} />
             <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '0.5px' }}>TỔNG CỘNG</span>
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: '900' }}>{parseInt(order.total_amount).toLocaleString()}đ</span>
        </div>

        <button 
          onClick={() => navigate('/menu')}
          className="btn-sleek"
          style={{ width: '100%', marginTop: '35px', padding: '22px', background: 'rgba(0,113,227,0.1)', color: '#0071E3', fontSize: '1.1rem', marginBottom: '50px', border: '2px solid rgba(0,113,227,0.1)' }}
        >
          QUAY LẠI MENU ĐẶT THÊM ☕
        </button>
      </div>

      <style>{`
        .glass-input-premium { width: 100%; border-radius: 20px; border: 1.5px solid rgba(0,0,0,0.05); background: rgba(255,255,255,0.5); font-weight: 600; outline: none; transition: all 0.3s; font-size: 0.95rem; font-family: inherit; }
        .glass-input-premium:focus { border-color: #0071E3; background: #fff; box-shadow: 0 0 0 4px rgba(0,113,227,0.1); }
        .loading-spinner { width: 45px; height: 45px; border: 4px solid rgba(0,113,227,0.1); border-top-color: #0071E3; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
