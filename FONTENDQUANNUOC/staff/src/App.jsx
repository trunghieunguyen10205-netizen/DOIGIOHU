import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FiGrid, FiList, FiLogOut } from 'react-icons/fi';
import StaffTableMapPage from './pages/StaffTableMapPage';
import StaffTakeOrderPage from './pages/StaffTakeOrderPage';
import StaffOrdersPage from './pages/StaffOrdersPage';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';

// ─────────────────────────────────────────────────────────────
// Kiểm tra xem role hiện tại có phải là quản lý không
// Chấp nhận cả 'manager' lẫn 'admin' từ database
// ─────────────────────────────────────────────────────────────
const isManagerRole = (role) => {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'manager' || normalized === 'admin';
};

// ─────────────────────────────────────────────────────────────
// Guard: Bảo vệ route - redirect về /login nếu không có quyền
// ─────────────────────────────────────────────────────────────
const RequireRole = ({ type, children }) => {
  const role = localStorage.getItem('role');
  console.log(`[Guard] Checking access for Role: "${role}", Target Type: "${type}"`);

  if (!role) {
    console.log('[Guard] No role found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  const isManager = isManagerRole(role);
  console.log(`[Guard] Is Manager Role: ${isManager}`);

  if (type === 'manager' && !isManager) {
    console.log('[Guard] Unauthorized for manager route, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  if (type === 'staff' && role !== 'staff') {
    console.log('[Guard] Unauthorized for staff route, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[Guard] Access Granted!');
  return children;
};

// ─────────────────────────────────────────────────────────────
// BottomNav: Chỉ hiện cho nhân viên (staff), ẩn khi gọi món
// ─────────────────────────────────────────────────────────────
const BottomNav = () => {
  const location = useLocation();
  const role = localStorage.getItem('role');

  // Ẩn khi: chưa đăng nhập, là quản lý, đang ở trang login, đang gọi món
  if (!role || isManagerRole(role)) return null;
  if (location.pathname === '/login') return null;
  if (location.pathname.startsWith('/order/')) return null;

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <FiGrid />
        <span>Sơ Đồ Bàn</span>
      </Link>
      <Link to="/orders" className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`}>
        <FiList />
        <span>DS Đơn</span>
      </Link>
      <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <FiLogOut />
        <span>Thoát</span>
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LayoutWrapper: CSS khác nhau cho Manager vs Staff
// ─────────────────────────────────────────────────────────────
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isManager = location.pathname.startsWith('/manager');

  return (
    <div className={isManager ? 'manager-wrapper' : 'layout-container'}>
      {children}
      <BottomNav />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// App chính
// ─────────────────────────────────────────────────────────────
function App() {
  const role = localStorage.getItem('role');
  const defaultRedirect = !role
    ? '/login'
    : isManagerRole(role)
    ? '/manager'
    : '/';

  return (
    <BrowserRouter>
      <LayoutWrapper>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Staff routes */}
          <Route path="/" element={
            <RequireRole type="staff"><StaffTableMapPage /></RequireRole>
          } />
          <Route path="/order/:tableId" element={
            <RequireRole type="staff"><StaffTakeOrderPage /></RequireRole>
          } />
          <Route path="/orders" element={
            <RequireRole type="staff"><StaffOrdersPage /></RequireRole>
          } />

          {/* Manager routes — chấp nhận cả 'admin' và 'manager' */}
          <Route path="/manager" element={
            <RequireRole type="manager"><ManagerDashboard /></RequireRole>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}

export default App;
