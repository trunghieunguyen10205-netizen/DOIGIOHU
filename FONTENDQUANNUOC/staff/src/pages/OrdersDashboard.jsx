import { useState, useEffect } from 'react';

// Dữ liệu giả lập ban đầu để bạn dễ hình dung giao diện
const MOCK_ORDERS = [
  {
    id: 1, order_code: 'ORD-1001', table_id: 'Bàn 1', status: 'pending', time: '18:30',
    total: 80000,
    items: [
      { name: 'Cà Phê Sữa Đá', qty: 2, note: 'Ít đá, nhiều sữa' },
      { name: 'Bạc Xỉu Sài Gòn', qty: 1, note: '' }
    ]
  },
  {
    id: 2, order_code: 'ORD-1002', table_id: 'Bàn 5', status: 'preparing', time: '18:25',
    total: 35000,
    items: [
      { name: 'Khô Gà Lá Chanh', qty: 1, note: '' }
    ]
  },
  {
    id: 3, order_code: 'ORD-1003', table_id: 'Mang đi', status: 'ready', time: '18:15',
    total: 55000,
    items: [
      { name: 'Trà Đào Cam Sả', qty: 1, note: 'Không đường' },
      { name: 'Bánh Mì Thịt Nướng', qty: 1, note: 'Nhiều ớt' }
    ]
  }
];

export default function OrdersDashboard() {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // Giả lập tự động nhận đơn mới (Realtime) cứ sau mỗi 15 giây
  useEffect(() => {
    const timer = setInterval(() => {
      const newOrder = {
        id: Date.now(),
        order_code: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`,
        table_id: `Bàn ${Math.floor(Math.random() * 10)}`,
        status: 'pending',
        time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
        total: 45000,
        items: [
          { name: 'Trà Vải Vỏ Mộc', qty: 1, note: '' },
          { name: 'Bánh Mì Opla', qty: 1, note: '' }
        ]
      };
      // Quăng đơn mới lên đầu
      setOrders(prev => [newOrder, ...prev]);
    }, 15000); // 15s có đơn mới cho vui

    return () => clearInterval(timer);
  }, []);

  const changeStatus = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const payOrder = (id) => {
    // Sẽ xóa khỏi board khi tính tiền xong
    if(window.confirm('Khách đã thanh toán xong?')) {
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // Group theo cột
  const cols = [
    { key: 'pending', label: '🛑 Chờ Xác Nhận', color: 'var(--status-pending)' },
    { key: 'preparing', label: '👨‍🍳 Đang Làm', color: 'var(--status-preparing)' },
    { key: 'ready', label: '🔔 Pha Xong (Chờ Bưng)', color: 'var(--status-ready)' }
  ];

  return (
    <div className="board fade-in">
      {cols.map(col => (
        <div className="board-col" key={col.key}>
          <div className="col-header" style={{ color: col.color }}>
            <span>{col.label}</span>
            <span className="badge">{orders.filter(o => o.status === col.key).length}</span>
          </div>

          <div className="col-cards">
            {orders.filter(o => o.status === col.key).map(order => (
              <div className="order-card" key={order.id}>
                
                <div className="card-top">
                  <span className="table-id">{order.table_id}</span>
                  <span className="order-time">{order.time}</span>
                </div>
                
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '10px' }}>
                  {order.order_code}
                </div>

                <div className="order-items">
                  {order.items.map((it, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      <div className="item-row">
                        <span className="item-name">{it.qty}x {it.name}</span>
                      </div>
                      {it.note && <div style={{ fontSize: '0.8rem', color: '#EF4444', fontStyle: 'italic' }}>* Ghi chú: {it.note}</div>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{order.total.toLocaleString()}đ</span>
                </div>

                {/* Các nút hành động thay đổi tùy cột */}
                <div className="card-actions">
                  {order.status === 'pending' && (
                    <>
                      <button className="btn btn-danger" onClick={() => changeStatus(order.id, 'cancelled')}>Hủy</button>
                      <button className="btn btn-primary" onClick={() => changeStatus(order.id, 'preparing')}>Xác Nhận & Pha</button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button className="btn btn-success" style={{ width: '100%' }} onClick={() => changeStatus(order.id, 'ready')}>Xong Món!</button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn" style={{ width: '100%', background: '#111827' }} onClick={() => payOrder(order.id)}>Thu Tiền 💵</button>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
