import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffTableMapPage() {
  const navigate = useNavigate();
  const [occupiedTables, setOccupiedTables] = useState([]);

  useEffect(() => {
    const fetchActiveOrders = () => {
      axios.get('http://localhost:3001/api/orders')
           .then(res => {
             const activeIds = res.data.map(o => String(o.table_id));
             setOccupiedTables([...new Set(activeIds)]);
           })
           .catch(console.error);
    };
    
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const tables = Array.from({ length: 40 }, (_, i) => {
    const id = String(i + 1);
    const isOccupied = occupiedTables.includes(id); 
    return { id, isOccupied };
  });

  return (
    <div className="layout-container">
      <div style={{ 
        padding: '40px 24px 25px', 
        background: 'rgba(255, 255, 255, 0.4)', 
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderBottomLeftRadius: '40px', 
        borderBottomRightRadius: '40px', 
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.4)',
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#1d1d1f' }}>Sơ Đồ Bàn</h2>
        <p style={{ color: '#86868b', marginTop: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Tình trạng bàn thực tế</p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: '16px', color: '#34c759', fontSize: '0.8rem', fontWeight: 800, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }}></div>
            Trống
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: '16px', color: '#ff3b30', fontSize: '0.8rem', fontWeight: 800, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }}></div>
            Có Khách
          </div>
        </div>
      </div>

      <div className="table-grid animate-up" style={{ padding: '24px' }}>
        {tables.map((t, idx) => (
          <button 
            key={t.id} 
            className={`table-btn ${t.isOccupied ? 'occupied' : 'free'}`}
            onClick={() => navigate(`/order/${t.id}`)}
            style={{ animationDelay: `${idx * 0.01}s` }}
          >
            {t.id}
          </button>
        ))}
      </div>
    </div>
  );
}
