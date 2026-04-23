import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import LogoHeader from '../components/LogoHeader';
import axios from 'axios';

const FOOD_KEYWORDS = ['Đồ Ăn', 'Ăn Vặt', 'Bánh', 'Tráng Miệng'];

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeType, setActiveType] = useState('drink');
  const [activeCat, setActiveCat] = useState(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        isInitial ? axios.get('https://doigiohu.onrender.com/api/categories') : Promise.resolve(null),
        axios.get('https://doigiohu.onrender.com/api/menu-items?all=true')
      ]);

      if (catsRes) setCategories(catsRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Cập nhật dữ liệu tức thì mỗi 3 giây (Giá, Hết hàng...)
    const timer = setInterval(() => fetchData(), 3000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const isFoodCat = (catName) => FOOD_KEYWORDS.some(kw => catName.includes(kw));
  
  const currentCategories = useMemo(() => {
    return categories.filter(cat =>
      activeType === 'food' ? isFoodCat(cat.name) : !isFoodCat(cat.name)
    );
  }, [categories, activeType]);

  useEffect(() => {
    if (currentCategories.length > 0) {
      const exists = currentCategories.find(c => c.id === activeCat);
      if (!exists) {
        setActiveCat(currentCategories[0].id);
      }
    }
  }, [currentCategories, activeCat]);

  const filteredItems = items.filter(item => item.category_id === activeCat);

  return (
    <div className="layout-container" style={{ paddingBottom: '40px' }}>
      {/* Header Premium */}
      <div className="animate-up" style={{ animationDelay: '0.1s' }}>
        <LogoHeader subtitle="Tinh hoa trà & cà phê 🌿" />
      </div>

      {/* Type Toggle */}
      <div className="animate-up" style={{ padding: '30px 25px 0', animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '35px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <button
            onClick={() => setActiveType('drink')}
            style={{
              flex: 1, padding: '14px 0', borderRadius: '30px', fontWeight: '800', border: 'none',
              background: activeType === 'drink' ? 'var(--primary)' : 'transparent',
              color: activeType === 'drink' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
              fontSize: '0.95rem'
            }}
          >
            🍹 Đồ Uống
          </button>
          <button
            onClick={() => setActiveType('food')}
            style={{
              flex: 1, padding: '14px 0', borderRadius: '30px', fontWeight: '800', border: 'none',
              background: activeType === 'food' ? 'var(--primary)' : 'transparent',
              color: activeType === 'food' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
              fontSize: '0.95rem'
            }}
          >
            🍕 Đồ Ăn
          </button>
        </div>
      </div>

      {/* Sub Categories */}
      {currentCategories.length > 0 && (
        <div className="animate-up" style={{ display: 'flex', overflowX: 'auto', padding: '25px 20px', gap: '15px', animationDelay: '0.3s' }}>
          {currentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={activeCat === cat.id ? 'tab-active' : ''}
              style={{
                padding: '12px 24px', borderRadius: '25px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                background: '#fff', color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.9rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)', transition: 'all 0.3s'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu Grid */}
      <div className="animate-up menu-grid" style={{ animationDelay: '0.4s' }}>
        {filteredItems.map((item, idx) => (
          <div
            key={item.id}
            className="premium-card animate-scale"
            style={{
              padding: '0',
              overflow: 'hidden',
              position: 'relative',
              animationDelay: `${0.05 * idx}s`,
              border: 'none',
              cursor: 'default'
            }}
          >
            {!item.is_available && (
              <div className="out-of-stock-overlay">
                <span style={{ background: 'var(--accent)', color: '#fff', padding: '6px 15px', borderRadius: '20px', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tạm hết</span>
              </div>
            )}

            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img
                src={item.image ? (item.image.startsWith('http') ? item.image : `https://doigiohu.onrender.com/${item.image}`) : `https://placehold.co/400x400/6366f1/FFFFFF/png?text=${encodeURIComponent(item.name)}`}
                alt={item.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
            </div>

            <div style={{ padding: '12px 15px 15px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', lineHeight: '1.3', color: 'var(--text-main)', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.6em' }}>
                {item.name}
              </h4>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                {parseInt(item.price).toLocaleString()}đ
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontWeight: '600' }}>
            🍃 Danh mục đang được cập nhật...
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div style={{
        textAlign: 'center',
        padding: '30px 20px 60px',
        color: '#fff',
        fontSize: '0.85rem',
        fontWeight: '700',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        letterSpacing: '0.5px'
      }}>
        Menu Digital by Đồi Gió Hú © 2026
      </div>
    </div>
  );
}
