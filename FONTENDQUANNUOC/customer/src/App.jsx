import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';

function App() {
  return (
    <BrowserRouter>
      <div className="layout-container fade-in">
        <Routes>
          <Route path="/*" element={<MenuPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
