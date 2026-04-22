import { useState, useEffect } from 'react';
import { FiClock, FiCheck, FiPlay, FiDollarSign, FiCoffee, FiTruck, FiPlus, FiX, FiSmartphone } from 'react-icons/fi';
import axios from 'axios';

// ── Cấu hình MB Bank ───────────────────────────────────────────
const MB_ACCOUNT_NO   = '0949239191';
const MB_ACCOUNT_NAME = 'NGUYEN NGHIA TRUNG';
// ──────────────────────────────────────────────────────────────

const makeQrUrl = (amount, note) =>
  `https://img.vietqr.io/image/MB-${MB_ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(MB_ACCOUNT_NAME)}`;

const UI_MAP = {
  pending:   { color: '#FF9500', text: 'Chờ Quầy',    bg: 'rgba(255, 149, 0, 0.1)' },
  confirmed: { color: '#FF9500', text: 'Xác Nhận',    bg: 'rgba(255, 149, 0, 0.1)' },
  preparing: { color: '#0071E3', text: 'Đang Pha',    bg: 'rgba(0, 113, 227, 0.1)' },
  ready:     { color: '#FF3B30', text: 'Chờ Giao',    bg: 'rgba(255, 59, 48, 0.1)' },
  delivered: { color: '#34C759', text: 'Đã Giao',     bg: 'rgba(52, 199, 89, 0.1)' },
};

const getUi = (status) => UI_MAP[status] || { color: '#86868B', text: status || '...', bg: 'rgba(0,0,0,0.05)' };

const getTablePriorityStatus = (batches) => {
  if (batches.some(b => b.status === 'pending'))   return 'pending';
  if (batches.some(b => b.status === 'ready'))     return 'ready';
  if (batches.some(b => b.status === 'preparing')) return 'preparing';
  return 'delivered';
};

export default function StaffOrdersPage() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);

  const fetchActiveOrders = () => {
    axios.get('https://doigiohu.onrender.com/api/orders')
      .then(res => {
        const rawOrders = Array.isArray(res.data) ? res.data : [];
        const map = {};
        rawOrders.forEach(row => {
          const tId = row.table_id != null ? row.table_id : 'Mang đi';
          if (!map[tId]) map[tId] = { id: tId, table: `Bàn ${tId}`, total: 0, batches: [] };
          map[tId].total += parseFloat(row.total_amount) || 0;
          map[tId].batches.push({
            id: row.id,
            time: new Date(row.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: row.status,
            items: (row.items || []).map(it => ({ qty: it.quantity, name: it.name || '?', note: it.options?.note || '' })),
          });
        });
        setOrders(Object.values(map));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateBatchStatus = async (batchId, newStatus) => {
    try {
      await axios.put(`https://doigiohu.onrender.com/api/orders/${batchId}/status`, { status: newStatus });
      fetchActiveOrders();
    } catch (e) { alert('Lỗi cập nhật: ' + e.message); }
  };

  const openPayment = (tableObj) => setPaymentModal(tableObj);

  const confirmCash = async () => {
    if (!window.confirm(`Xác nhận thu ${paymentModal.total.toLocaleString()}đ tiền mặt?`)) return;
    try {
      for (const b of paymentModal.batches)
        await axios.put(`https://doigiohu.onrender.com/api/orders/${b.id}/status`, { status: 'completed' });
      setPaymentModal(null);
      fetchActiveOrders();
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  const confirmTransfer = async () => {
    if (!window.confirm(`Xác nhận đã nhận chuyển khoản ${paymentModal.total.toLocaleString()}đ?`)) return;
    try {
      for (const b of paymentModal.batches)
        await axios.put(`https://doigiohu.onrender.com/api/orders/${b.id}/status`, { status: 'completed' });
      setPaymentModal(null);
      fetchActiveOrders();
    } catch (e) { alert('Lỗi: ' + e.message); }
  };

  return (
    <>
      <div className="layout-container" style={{ paddingBottom: '120px' }}>
        {/* Apple Style Glass Header */}
        <div style={{ 
          padding: '40px 24px 20px', 
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
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Quản Lý Đơn</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.85rem', fontWeight: 600 }}>Cập nhật tự động • Live</p>
        </div>

        <div style={{ padding: '24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: 600 }}>Đang đồng bộ...</div>
          )}
          {!loading && orders.length === 0 && (
            <div className="modern-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontWeight: 700 }}>
              Hiện chưa có đơn nào! 🎉
            </div>
          )}

          {orders.map(o => {
            const mainStatus = getTablePriorityStatus(o.batches);
            const topUi = getUi(mainStatus);
            return (
              <div key={o.id} className="modern-card animate-up" style={{ marginBottom: '24px', border: '1px solid rgba(255,255,255,0.5)' }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{o.table}</h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: topUi.color, background: topUi.bg, padding: '6px 14px', borderRadius: '14px' }}>
                    {topUi.text}
                  </span>
                </div>

                {/* Batches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {o.batches.map((batch, index) => {
                    const bUi = getUi(batch.status);
                    return (
                      <div key={batch.id} style={{ 
                        background: 'rgba(0,0,0,0.02)', 
                        padding: '16px', 
                        borderRadius: '20px',
                        border: batch.status === 'pending' ? '1.5px solid rgba(255, 149, 0, 0.3)' : '1px solid transparent'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {index === 0 ? 'Lượt đầu' : `Ghi thêm #${index}`} • {batch.time}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: bUi.color }}>{bUi.text}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '1rem', marginBottom: '16px' }}>
                          {batch.items.map((it, idx) => (
                            <div key={idx} style={{ fontWeight: 600 }}><strong>{it.qty}x</strong> {it.name}</div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {batch.status === 'pending' && (
                            <button onClick={() => updateBatchStatus(batch.id, 'preparing')} className="btn-sleek" style={{ padding: '10px 20px', fontSize: '0.85rem', width: 'auto', background: '#0071E3' }}>
                              Bắt đầu pha
                            </button>
                          )}
                          {batch.status === 'preparing' && (
                            <button onClick={() => updateBatchStatus(batch.id, 'ready')} className="btn-sleek" style={{ padding: '10px 20px', fontSize: '0.85rem', width: 'auto', background: '#34C759' }}>
                              Xong, chờ giao
                            </button>
                          )}
                          {batch.status === 'ready' && (
                            <button onClick={() => updateBatchStatus(batch.id, 'delivered')} className="btn-sleek" style={{ padding: '10px 20px', fontSize: '0.85rem', width: 'auto', background: '#FF3B30' }}>
                              Giao tới bàn
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', marginTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {o.total.toLocaleString()}đ
                  </span>
                  <button onClick={() => openPayment(o)} className="btn-sleek" style={{ padding: '12px 24px', fontSize: '0.95rem', width: 'auto', background: '#1d1d1f' }}>
                    Thanh Toán
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apple Style Glass Modal */}
      {paymentModal && (
        <div className="animate-fade" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <div className="animate-up" style={{ 
            background: 'rgba(255,255,255,0.7)', 
            backdropFilter: 'blur(35px) saturate(200%)',
            WebkitBackdropFilter: 'blur(35px) saturate(200%)',
            borderRadius: '40px 40px 0 0', 
            width: '100%', 
            maxWidth: '480px', 
            overflow: 'hidden', 
            boxShadow: '0 -20px 60px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.4)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* Header */}
            <div style={{ padding: '30px 24px', position: 'relative' }}>
              <button onClick={() => setPaymentModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#1d1d1f', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={20} />
              </button>
              <div style={{ fontSize: '0.9rem', color: '#86868b', fontWeight: 600 }}>Thanh toán cho</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '4px' }}>{paymentModal.table}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '10px', color: '#1d1d1f' }}>
                {paymentModal.total.toLocaleString()}<span style={{ fontSize: '1rem', marginLeft: '6px' }}>đ</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button onClick={confirmCash} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.4)', cursor: 'pointer', textAlign: 'left', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '50px', height: '50px', background: 'rgba(52, 199, 89, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiDollarSign size={24} color="#34C759" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1d1d1f' }}>Tiền Mặt</div>
                  <div style={{ fontSize: '0.85rem', color: '#86868b', marginTop: '2px' }}>Hoàn tất nhanh tại chỗ</div>
                </div>
              </button>

              <button onClick={() => setPaymentModal({ ...paymentModal, showQr: true })} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.4)', cursor: 'pointer', textAlign: 'left', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '50px', height: '50px', background: 'rgba(0, 113, 227, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiSmartphone size={24} color="#0071E3" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1d1d1f' }}>MB Bank QR</div>
                  <div style={{ fontSize: '0.85rem', color: '#86868b', marginTop: '2px' }}>Quét mã chuyển khoản</div>
                </div>
              </button>

              {paymentModal.showQr && (() => {
                const allItems = paymentModal.batches.flatMap(b => b.items);
                const itemSummary = allItems.map(it => `${it.name} x${it.qty}`).join(', ');
                const qrNote = `${paymentModal.table} | ${itemSummary}`;
                return (
                <div className="animate-scale" style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.5)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.5)', marginTop: '10px' }}>
                  <img
                    src={makeQrUrl(paymentModal.total, qrNote)}
                    alt="QR MB Bank"
                    style={{ width: '220px', height: '220px', borderRadius: '16px', marginBottom: '15px' }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#1d1d1f', fontWeight: 700 }}>{qrNote}</div>
                  <button onClick={confirmTransfer} className="btn-sleek" style={{ marginTop: '20px', background: '#0071E3' }}>
                    Đã Nhận Tiền
                  </button>
                </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
