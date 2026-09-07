import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header          from './components/Header';
import CartDrawer      from './components/CartDrawer';
import AuthModal       from './components/AuthModal';
import ProtectedRoute  from './components/ProtectedRoute';
import DiscoveryFeed   from './pages/DiscoveryFeed';
import ProductDetail   from './pages/ProductDetail';
import ShopPage        from './pages/ShopPage';
import CheckoutPage    from './pages/CheckoutPage';
import OrdersPage      from './pages/OrdersPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Subtle background ambient light orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px]" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Header onSearch={setSearchQuery} />
        <CartDrawer />
        <AuthModal />

        <Routes>
          {/* Public */}
          <Route path="/"             element={<DiscoveryFeed searchQuery={searchQuery} />} />
          <Route path="/product/:id"  element={<ProductDetail />} />
          <Route path="/shop"         element={<ShopPage />} />

          {/* Protected */}
          <Route path="/checkout"     element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders"       element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/order-success/:orderId" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<DiscoveryFeed searchQuery={searchQuery} />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
