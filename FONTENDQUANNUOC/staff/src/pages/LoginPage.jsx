import { useState, useEffect } from 'react';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Đang gửi yêu cầu đăng nhập cho:', username);
      const res = await axios.post('https://doigiohu.onrender.com/api/auth/login', { username, password });
      
      const { token, user } = res.data;
      console.log('Kết quả từ Server:', res.data);
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);
      localStorage.setItem('user', JSON.stringify(user));

      alert(`ĐĂNG NHẬP THÀNH CÔNG!\n- Username: ${user.username}\n- Quyền (Role): [${user.role}]\n- Full Name: ${user.full_name}\n\nNhấn OK để hệ thống chuyển trang.`);

      // Chuyển hướng ngay lập tức
      const finalRole = String(user.role || '').trim().toLowerCase();
      if (finalRole === 'manager' || finalRole === 'admin') {
        window.location.href = '/manager';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(err.response?.data?.message || 'Đăng nhập thất bại! Kiểm tra lại tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '20px', 
      background: '#f5f5f7',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div className="mesh-gradient"></div>
      <div className="blob" style={{ top: '-10%', left: '-10%', width: '600px', height: '600px' }}></div>
      <div className="blob" style={{ bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.2), rgba(0, 113, 227, 0.2))', animationDelay: '-5s' }}></div>

      <div className="modern-card animate-up" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '50px 40px', 
        background: 'rgba(255,255,255,0.45)', 
        backdropFilter: 'blur(40px) saturate(200%)', 
        border: '1px solid rgba(255,255,255,0.5)', 
        borderRadius: '35px', 
        boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
           <div style={{ width: '70px', height: '70px', background: '#0071E3', borderRadius: '22px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', boxShadow: '0 15px 30px rgba(0,113,227,0.3)' }}>🔐</div>
           <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1d1d1f', letterSpacing: '-0.04em' }}>Đăng Nhập</h2>
           <p style={{ color: '#424245', marginTop: '8px', fontWeight: 600 }}>Hệ thống quản trị nội bộ</p>
        </div>

        {error && (
          <div className="animate-scale" style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', padding: '15px', borderRadius: '18px', marginBottom: '25px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(255, 59, 48, 0.1)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="input-group-apple">
            <input 
              value={username} onChange={e => setUsername(e.target.value)}
              type="text" placeholder="Tên đăng nhập" required
              className="glass-input-premium"
              style={{ paddingLeft: '20px' }}
            />
          </div>
          <div className="input-group-apple">
            <input 
              value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="Mật khẩu" required
              className="glass-input-premium"
              style={{ paddingLeft: '20px' }}
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-sleek" style={{ padding: '20px', fontSize: '1.1rem', marginTop: '10px', background: '#0071E3', color: 'white', boxShadow: '0 15px 30px rgba(0,113,227,0.3)' }}>
            {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP NGAY'}
          </button>
        </form>

        <div style={{ marginTop: '40px', textAlign: 'center', paddingTop: '30px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button onClick={() => window.location.href = 'http://localhost:5174/menu'} style={{ background: 'transparent', border: 'none', color: '#86868b', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
            Quay lại trang khách hàng
          </button>
        </div>
      </div>
      <style>{`
        .mesh-gradient {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          background: 
            radial-gradient(at 0% 0%, rgba(0, 113, 227, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(52, 199, 89, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(255, 149, 0, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(255, 59, 48, 0.1) 0px, transparent 50%);
          filter: blur(80px);
          opacity: 0.8;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          z-index: 0;
          background: linear-gradient(135deg, rgba(0, 113, 227, 0.2), rgba(175, 82, 222, 0.2));
          animation: float 20s infinite alternate;
        }
        @keyframes float {
          0% { transform: translate(-5%, -5%) rotate(0deg); }
          100% { transform: translate(5%, 5%) rotate(360deg); }
        }
        .glass-input-premium { width: 100%; padding: 18px; border-radius: 18px; border: 1.5px solid rgba(0,0,0,0.05); background: rgba(255,255,255,0.4); font-weight: 600; outline: none; transition: all 0.3s; font-size: 1rem; }
        .glass-input-premium:focus { border-color: #0071E3; background: #fff; box-shadow: 0 0 0 4px rgba(0,113,227,0.1); }
      `}</style>
    </div>
  );
}
