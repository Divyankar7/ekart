import { useNavigate } from 'react-router-dom';
import { PackageSearch, ArrowLeft, Package, CheckCircle2, Clock, Truck, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Demo orders — mock data for orders list
// ---------------------------------------------------------------------------
const DEMO_ORDERS = [
  {
    id: 'ORD-20260901-001',
    date: '1 Sep 2026',
    status: 'Delivered',
    total: 28917,
    currency: '₹',
    items: [
      { name: 'Sony WH-1000XM5 Wireless Headphones', qty: 1, price: 29069, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=60' },
    ],
  },
  {
    id: 'ORD-20260825-002',
    date: '25 Aug 2026',
    status: 'In Transit',
    total: 12449,
    currency: '₹',
    items: [
      { name: 'Nike Air Max 270 React Obsidian', qty: 1, price: 12449, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60' },
    ],
  },
];

const statusConfig = {
  Delivered: {
    icon: CheckCircle2,
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  },
  'In Transit': {
    icon: Truck,
    badge: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
  },
  Processing: {
    icon: Clock,
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  },
};

const OrdersPage = () => {
  const navigate     = useNavigate();
  const { authUser } = useAuth();

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-cyan-400 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Order History</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage and track your recent purchases</p>
          </div>
          {authUser && (
            <div className="self-start sm:self-auto bg-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span>Account: <span className="font-semibold text-zinc-200">{authUser.email}</span></span>
            </div>
          )}
        </div>

        {DEMO_ORDERS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center mb-4 text-zinc-500">
              <PackageSearch size={32} />
            </div>
            <h2 className="text-lg font-bold text-white mb-1.5">No orders recorded yet</h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-sm">Discover trending gadgets, streetwear and accessories in our catalogue.</p>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 transition active:scale-[0.98]"
            >
              Start Exploring Drops
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {DEMO_ORDERS.map((order) => {
              const { icon: StatusIcon, badge } = statusConfig[order.status] ?? statusConfig.Processing;
              return (
                <div
                  key={order.id}
                  className="bg-zinc-900/70 border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden hover:border-zinc-700 transition-all duration-200"
                >
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/5 bg-zinc-950/50">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Order ID</p>
                        <p className="text-sm font-bold text-cyan-400 font-mono tracking-wide">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Placed On</p>
                        <p className="text-sm font-medium text-zinc-300">{order.date}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">Amount</p>
                        <p className="text-sm font-extrabold text-white">{order.currency}{order.total.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full ${badge}`}>
                      <StatusIcon size={14} /> {order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <ul className="divide-y divide-white/5 px-6">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between py-4 text-sm">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200 hover:text-cyan-400 transition-colors cursor-pointer">{item.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">Quantity: {item.qty}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-zinc-100">₹{item.price.toLocaleString('en-IN')}</p>
                          <span className="text-[11px] text-emerald-400 font-medium">Free Delivery</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Footer actions */}
                  <div className="px-6 py-3 bg-zinc-950/30 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                      onClick={() => navigate('/shop')}
                      className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition"
                    >
                      Buy Again
                    </button>
                    <button
                      onClick={() => navigate(`/orders`)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition flex items-center gap-1.5"
                    >
                      <span>Track Shipment</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default OrdersPage;
