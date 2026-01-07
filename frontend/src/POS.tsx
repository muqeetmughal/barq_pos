import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  Settings, 
  LayoutGrid, 
  X,
  History,
  CheckCircle2,
  ScanBarcode,
  Package,
  AlertCircle,
  Calculator,
  User,
  ArrowRight,
  TrendingUp,
  Ticket,
  Ban,
  StickyNote,
  UserPlus,
  Layers,
  Clock,
  Printer,
  Receipt,
  Cpu,
  Wifi,
  Database,
  Calendar
} from 'lucide-react';

// --- TYPES & INTERFACES ---
interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  category: string;
  img: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  time: string;
  items: number;
  total: number;
  method: 'Card' | 'Cash' | 'Digital';
  status: 'Completed' | 'Refunded' | 'Pending';
}

interface ParkedOrder {
  id: number;
  items: CartItem[];
  customer: string | null;
  timestamp: string;
}

interface Toast {
  msg: string;
  type: 'success' | 'error' | 'info';
}

type ViewType = 'pos' | 'history' | 'analytics' | 'settings';

// --- MOCK DATA ---
const PRODUCTS: Product[] = [
  { id: 1, sku: '1001', name: 'Black Silk Roast', price: 42.00, category: 'Coffee', img: '☕', stock: 12 },
  { id: 2, sku: '1002', name: 'Vessel Mug (Black)', price: 25.00, category: 'Accessories', img: '🍶', stock: 45 },
  { id: 3, sku: '2001', name: 'Tech Jacket v2', price: 185.00, category: 'Apparel', img: '🧥', stock: 4 },
  { id: 4, sku: '2002', name: 'Merino Beanie', price: 35.00, category: 'Apparel', img: '🧢', stock: 20 },
  { id: 5, sku: '3001', name: 'Carbon Wallet', price: 85.00, category: 'Accessories', img: '💳', stock: 0 },
  { id: 6, sku: '3002', name: 'Apex Keychain', price: 12.00, category: 'Accessories', img: '🔑', stock: 150 },
  { id: 7, sku: '4001', name: 'Studio Monitor 24"', price: 450.00, category: 'Tech', img: '🖥️', stock: 3 },
  { id: 8, sku: '1003', name: 'Matcha Kit', price: 55.00, category: 'Coffee', img: '🍵', stock: 8 },
  { id: 9, sku: '2003', name: 'Cargo Pants', price: 120.00, category: 'Apparel', img: '👖', stock: 14 },
  { id: 10, sku: '3003', name: 'Minimalist Belt', price: 45.00, category: 'Accessories', img: '🎗️', stock: 10 },
];

const CATEGORIES: string[] = ['All', 'Coffee', 'Apparel', 'Accessories', 'Tech'];

const POS: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('pos');

  // POS State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([
    { id: 'TX-9921', time: '12:42 PM', items: 3, total: 145.20, method: 'Card', status: 'Completed' },
    { id: 'TX-9920', time: '11:15 AM', items: 1, total: 42.00, method: 'Cash', status: 'Completed' },
    { id: 'TX-9919', time: '10:30 AM', items: 5, total: 890.45, method: 'Card', status: 'Refunded' },
  ]);

  // Transaction State
  const [discount, setDiscount] = useState<number>(0);
  const [customer, setCustomer] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'payment' | 'success'>('payment');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Feedback State
  const [scanAnimation, setScanAnimation] = useState<boolean>(false);
  const [cartPulse, setCartPulse] = useState<boolean>(false);
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [toast, setToast] = useState<Toast | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- CALCULATIONS ---
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => 
      (activeCategory === 'All' || p.category === activeCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.includes(searchQuery))
    );
  }, [activeCategory, searchQuery]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discAmount = subtotal * (discount / 100);
    const tax = (subtotal - discAmount) * 0.10;
    const final = subtotal - discAmount + tax;
    return { subtotal, tax, discount: discAmount, total: final, change: Math.max(0, cashTendered - final) };
  }, [cart, discount, cashTendered]);

  // --- ACTIONS ---
  const triggerToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const addToCart = (product: Product, qty: number = 1) => {
    if (product.stock === 0) {
      triggerToast('Item out of stock', 'error');
      return;
    }
    setCartPulse(true);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + qty } 
          : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setTimeout(() => setCartPulse(false), 300);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const parkOrder = () => {
    if (cart.length === 0) return;
    setParkedOrders([...parkedOrders, { id: Date.now(), items: cart, customer, timestamp: new Date().toLocaleTimeString() }]);
    setCart([]);
    setCustomer(null);
    triggerToast('Order Parked', 'info');
  };

  const resumeOrder = (order: ParkedOrder) => {
    setCart(order.items);
    setCustomer(order.customer);
    setParkedOrders(parkedOrders.filter(o => o.id !== order.id));
    setCurrentView('pos');
  };

  const finalizeTransaction = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newOrder: Order = {
        id: `TX-${Math.floor(Math.random() * 9000) + 1000}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: cart.reduce((acc, item) => acc + item.quantity, 0),
        total: totals.total,
        method: cashTendered > 0 ? 'Cash' : 'Card',
        status: 'Completed'
      };
      setOrderHistory([newOrder, ...orderHistory]);
      setIsProcessing(false);
      setCheckoutStep('success');
      triggerToast('Payment Verified');
    }, 1500);
  };

  const resetTerminal = () => {
    setCart([]);
    setDiscount(0);
    setCustomer(null);
    setCashTendered(0);
    setIsCheckoutOpen(false);
    setCheckoutStep('payment');
  };

  const simulateScan = () => {
    setScanAnimation(true);
    setTimeout(() => {
      const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      addToCart(randomProduct);
      setScanAnimation(false);
    }, 250);
  };

  const handleNumpad = (val: string) => {
    if (val === 'C') setNumpadValue('');
    else if (numpadValue.length < 10) setNumpadValue(v => v + val);
  };

  const submitNumpad = () => {
    const found = PRODUCTS.find(p => p.sku === numpadValue);
    if (found) {
      addToCart(found);
      setNumpadValue('');
    } else {
      triggerToast('SKU not found', 'error');
    }
  };

  // --- SUB-COMPONENTS ---

  const HistoryView: React.FC = () => (
    <div className="flex-1 flex flex-col p-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-5xl font-black tracking-tighter uppercase italic">Order Log</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">Historical Transaction Data</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-zinc-800 transition-all text-white">
            <Calendar size={16} /> Filter Date
          </button>
          <button className="px-6 py-3 bg-white text-black rounded-2xl font-bold text-xs hover:bg-zinc-200 transition-all">
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/20 border border-zinc-900 rounded-[3rem] overflow-hidden flex flex-col">
        <div className="grid grid-cols-6 p-8 border-b border-zinc-900 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          <span>Transaction ID</span>
          <span>Time</span>
          <span>Items</span>
          <span>Method</span>
          <span>Status</span>
          <span className="text-right">Total</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {orderHistory.map(order => (
            <div key={order.id} className="grid grid-cols-6 p-8 border-b border-zinc-900/50 hover:bg-zinc-900/40 transition-colors group">
              <span className="font-bold text-white tracking-tighter">{order.id}</span>
              <span className="text-zinc-400 font-medium">{order.time}</span>
              <span className="text-zinc-400 font-medium">{order.items} Units</span>
              <span className="text-zinc-400 font-medium">{order.method}</span>
              <span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                  order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                  order.status === 'Refunded' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-500/10 text-zinc-500'
                }`}>
                  {order.status}
                </span>
              </span>
              <span className="text-right font-black text-white">${order.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalyticsView: React.FC = () => (
    <div className="flex-1 flex flex-col p-10 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="mb-10 text-white">
        <h2 className="text-5xl font-black tracking-tighter uppercase italic">Sales Pulse</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">Live Performance Metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {[
          { label: 'Net Revenue', val: '$14,240.00', trend: '+12.4%', icon: <TrendingUp className="text-emerald-500" /> },
          { label: 'Avg Order', val: '$52.10', trend: '+4.2%', icon: <Receipt className="text-indigo-500" /> },
          { label: 'Active Sessions', val: '04', trend: 'Stable', icon: <User className="text-zinc-400" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900/30 border border-zinc-900 p-8 rounded-[2.5rem] flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{stat.label}</p>
              <h4 className="text-3xl font-black tracking-tighter">{stat.val}</h4>
              <p className="text-[10px] font-bold text-emerald-500 mt-1">{stat.trend} from yesterday</p>
            </div>
            <div className="p-5 bg-zinc-950 rounded-3xl">{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-white">
        <div className="bg-zinc-900/30 border border-zinc-900 p-10 rounded-[3rem]">
          <h5 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8">Hourly Traffic</h5>
          <div className="h-64 flex items-end gap-3">
             {[40, 65, 30, 85, 45, 90, 55, 70, 40, 60, 80, 50].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-indigo-500/20 rounded-t-xl hover:bg-indigo-500 transition-all relative group" style={{ height: `${h}%` }}>
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${h * 12}
                      </div>
                  </div>
                  <span className="text-[9px] font-black text-zinc-700">{i+8}h</span>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-900 p-10 rounded-[3rem]">
          <h5 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8">Top Categories</h5>
          <div className="space-y-6">
            {[
              { name: 'Coffee', perc: 45, color: 'bg-amber-500' },
              { name: 'Apparel', perc: 30, color: 'bg-emerald-500' },
              { name: 'Accessories', perc: 15, color: 'bg-indigo-500' },
              { name: 'Tech', perc: 10, color: 'bg-rose-500' },
            ].map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span>{cat.name}</span>
                  <span>{cat.perc}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className={`${cat.color} h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${cat.perc}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsView: React.FC = () => (
    <div className="flex-1 flex flex-col p-10 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="mb-10 text-white">
        <h2 className="text-5xl font-black tracking-tighter uppercase italic">Terminal Config</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mt-2">Hardware & System Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="space-y-8">
           <div className="bg-zinc-900/30 border border-zinc-900 p-10 rounded-[3rem] text-white">
              <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Cpu size={14} /> Hardware Status
              </h5>
              <div className="space-y-4">
                 {[
                   { name: 'Receipt Printer', status: 'Online', icon: <Printer size={16} />, color: 'text-emerald-500' },
                   { name: 'Barcode Scanner', status: 'Online', icon: <ScanBarcode size={16} />, color: 'text-emerald-500' },
                   { name: 'Card Terminal', status: 'Idle', icon: <CreditCard size={16} />, color: 'text-zinc-500' },
                   { name: 'Cash Drawer', status: 'Secured', icon: <Database size={16} />, color: 'text-emerald-500' },
                 ].map(hw => (
                   <div key={hw.name} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-3 text-zinc-300 font-bold text-sm">
                        {hw.icon} {hw.name}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${hw.color}`}>{hw.status}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-zinc-900/30 border border-zinc-900 p-10 rounded-[3rem] text-white">
              <h5 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings size={14} /> General Settings
              </h5>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase block mb-2 tracking-widest">Terminal Identifier</label>
                  <input type="text" value="NX-TERMINAL-ALPHA-01" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-white" readOnly />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase block mb-2 tracking-widest">Tax Rate (%)</label>
                  <input type="number" value="10.0" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-white" readOnly />
                </div>
              </div>
           </div>
        </section>

        <section className="bg-zinc-900/30 border border-zinc-900 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center text-white">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-black mb-6">
               <Wifi size={40} />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-2">System Diagnostics</h4>
            <p className="text-zinc-500 text-sm max-w-xs mb-8">Verify cloud synchronization and internal hardware telemetry.</p>
            <button className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all uppercase tracking-widest">Run Full Diagnostic</button>
            <p className="mt-8 text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Nexus OS v2.6.4 Stable</p>
        </section>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex h-screen w-full bg-[#050506] text-[#FAFAFA] font-sans overflow-hidden select-none">
      
      {/* Sidebar Navigation */}
      <nav className="w-20 border-r border-zinc-900 flex flex-col items-center py-8 gap-8 shrink-0 bg-black/60 z-50">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-[0_0_25px_rgba(255,255,255,0.15)] mb-4">N</div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setCurrentView('pos')}
            className={`p-4 rounded-2xl transition-all ${currentView === 'pos' ? 'text-white bg-zinc-800/80 shadow-lg' : 'text-zinc-600 hover:text-white'}`}
          >
            <LayoutGrid size={22} />
          </button>
          
          <button 
             onClick={() => {
                if(parkedOrders.length > 0) resumeOrder(parkedOrders[0]);
             }}
             className="p-4 text-zinc-600 hover:text-white transition-colors relative"
          >
            <Layers size={22} />
            {parkedOrders.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />}
          </button>
          
          <button 
            onClick={() => setCurrentView('history')}
            className={`p-4 rounded-2xl transition-all ${currentView === 'history' ? 'text-white bg-zinc-800/80 shadow-lg' : 'text-zinc-600 hover:text-white'}`}
          >
            <History size={22} />
          </button>

          <button 
            onClick={() => setCurrentView('analytics')}
            className={`p-4 rounded-2xl transition-all ${currentView === 'analytics' ? 'text-white bg-zinc-800/80 shadow-lg' : 'text-zinc-600 hover:text-white'}`}
          >
            <TrendingUp size={22} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-zinc-900">
          <button 
            onClick={() => setCurrentView('settings')}
            className={`p-4 rounded-2xl transition-all ${currentView === 'settings' ? 'text-white bg-zinc-800/80 shadow-lg' : 'text-zinc-600 hover:text-white'}`}
          >
            <Settings size={22} />
          </button>
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
          </div>
        </div>
      </nav>

      {/* Main Routing Engine */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'pos' && (
          <>
            <main className="flex-1 flex flex-col relative bg-zinc-950/20 animate-in fade-in duration-300">
                <header className="h-24 px-10 border-b border-zinc-900 flex items-center justify-between backdrop-blur-2xl z-40">
                    <div className="flex items-center gap-12">
                        <div>
                        <h2 className="text-[10px] font-black tracking-[0.4em] text-zinc-600 mb-1.5 uppercase">Core System 2.6</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-3xl font-black tracking-tighter">14:52 <span className="text-zinc-700 text-lg">EST</span></span>
                            <div className="h-5 w-[1px] bg-zinc-800" />
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Secure Node</span>
                            </div>
                        </div>
                        </div>

                        {parkedOrders.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Held:</span>
                            <div className="flex -space-x-2">
                            {parkedOrders.map((o) => (
                                <button 
                                key={o.id} 
                                onClick={() => resumeOrder(o)}
                                className="w-10 h-10 bg-indigo-600 border-2 border-zinc-950 rounded-xl flex items-center justify-center text-[10px] font-bold hover:-translate-y-1 transition-transform text-white"
                                >
                                {o.items.length}
                                </button>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="SKU / Name / Category"
                            className="bg-zinc-900/40 border border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-sm w-[400px] focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/80 transition-all text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        </div>
                        <button 
                        onClick={simulateScan} 
                        className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                        <ScanBarcode size={20} />
                        SCAN
                        </button>
                    </div>
                </header>

                <div className="px-10 py-6 flex gap-4 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-12 py-4 rounded-2xl text-[11px] font-black transition-all tracking-widest border-2 ${
                        activeCategory === cat 
                        ? 'bg-zinc-100 text-black border-white shadow-[0_15px_30px_rgba(255,255,255,0.05)]' 
                        : 'bg-zinc-900/40 text-zinc-600 border-transparent hover:border-zinc-800 hover:text-zinc-400'
                    }`}
                    >
                    {cat.toUpperCase()}
                    </button>
                ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filteredProducts.map(product => (
                    <div
                        key={product.id}
                        className={`group relative aspect-[3/4] bg-zinc-900/20 border border-zinc-900/60 rounded-[3rem] p-10 flex flex-col items-center justify-between text-center transition-all hover:bg-zinc-900/80 hover:border-zinc-700 hover:-translate-y-1 ${product.stock === 0 ? 'opacity-20 grayscale' : ''}`}
                    >
                        <div className="text-7xl group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                        {product.img}
                        </div>
                        
                        <div className="mt-4">
                        <h3 className="font-bold text-zinc-100 text-base mb-1 tracking-tight truncate w-full">{product.name}</h3>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{product.category}</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full mt-4">
                        <button 
                            disabled={product.stock === 0}
                            onClick={() => addToCart(product)}
                            className="w-full bg-zinc-800/80 group-hover:bg-white group-hover:text-black py-4 rounded-[1.5rem] text-lg font-black transition-all border border-zinc-700/50 group-hover:border-white shadow-xl text-white group-hover:text-black"
                        >
                            ${product.price.toFixed(2)}
                        </button>
                        </div>

                        {product.stock > 0 && product.stock < 10 && (
                        <div className="absolute top-6 right-8 text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 uppercase tracking-widest">
                            STK: {product.stock}
                        </div>
                        )}
                    </div>
                    ))}
                </div>
                </div>

                {scanAnimation && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        <div className="w-full h-1 bg-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.8)] animate-scan-line" />
                        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
                    </div>
                )}
            </main>

            <aside className="w-[540px] border-l border-zinc-900 flex flex-col bg-black z-[60] shadow-[-60px_0_120px_rgba(0,0,0,0.85)]">
                <div className="p-10 border-b border-zinc-900 flex items-center justify-between text-white">
                    <div className="flex items-center gap-5">
                        <div className={`p-5 bg-zinc-900 rounded-[2rem] text-white transition-transform duration-300 ${cartPulse ? 'scale-125 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : ''}`}>
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Active Bill</h2>
                        </div>
                    </div>
                    <button 
                        onClick={() => setCustomer(customer ? null : "Elite Member")}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-black text-[10px] transition-all uppercase tracking-widest ${customer ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
                    >
                        {customer ? <User size={16} /> : <UserPlus size={16} />}
                        {customer || "Add Member"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-6 custom-scrollbar text-white">
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                            <ScanBarcode size={100} strokeWidth={1} className="mb-6" />
                            <p className="text-xs font-black tracking-[0.4em] uppercase">Initialize Transaction</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="group flex items-center gap-6 p-6 bg-zinc-900/30 rounded-[2.5rem] border border-transparent hover:border-zinc-800 transition-all animate-in slide-in-from-right-8">
                                <div className="text-4xl">{item.img}</div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tighter">{item.name}</h4>
                                    <p className="text-[10px] text-zinc-600 font-black mt-1 tracking-widest">${item.price.toFixed(2)} UNIT</p>
                                </div>
                                <div className="flex items-center bg-black rounded-2xl border border-zinc-800 p-1.5 shadow-inner">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-rose-500 transition-colors"><Minus size={18} /></button>
                                    <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-indigo-500 transition-colors"><Plus size={18} /></button>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="font-black text-base text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-10 border-t border-zinc-900 bg-zinc-950/40">
                    <div className="flex gap-4 mb-8">
                        <button onClick={parkOrder} className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 py-6 rounded-3xl flex flex-col items-center gap-2 transition-all group active:scale-95 text-white">
                            <Clock size={20} className="text-zinc-500 group-hover:text-white" />
                            <span className="text-[9px] font-black text-zinc-600 group-hover:text-white uppercase tracking-widest">Hold</span>
                        </button>
                        <button onClick={() => setDiscount(discount === 15 ? 0 : 15)} className={`flex-1 border py-6 rounded-3xl flex flex-col items-center gap-2 transition-all group active:scale-95 ${discount > 0 ? 'bg-amber-600 border-amber-500 text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                            <Ticket size={20} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{discount > 0 ? '15% Off' : 'Promo'}</span>
                        </button>
                        <button onClick={() => setCart([])} className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-rose-950/20 hover:border-rose-900 py-6 rounded-3xl flex flex-col items-center gap-2 transition-all group active:scale-95 text-white">
                            <Ban size={20} className="text-zinc-500 group-hover:text-rose-500" />
                            <span className="text-[9px] font-black text-zinc-600 group-hover:text-rose-500 uppercase tracking-widest">Void</span>
                        </button>
                    </div>

                    <div className="bg-white text-black p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50 to-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-6 text-black">
                            <div className="flex justify-between items-end border-b border-zinc-200 pb-6">
                                <div>
                                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 block tracking-widest font-black">Final Total</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold opacity-20">$</span>
                                        <span className="text-7xl font-black tracking-tighter leading-none">{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 tracking-widest">{cart.length} Products</p>
                                    <p className="text-[10px] font-bold text-zinc-400">TAX: ${totals.tax.toFixed(2)}</p>
                                </div>
                            </div>
                            <button 
                                disabled={cart.length === 0}
                                onClick={() => setIsCheckoutOpen(true)}
                                className="w-full bg-black text-white py-10 rounded-[2.5rem] font-black text-3xl flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl"
                            >
                                CHECKOUT
                                <ArrowRight size={40} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
          </>
        )}

        {currentView === 'history' && <HistoryView />}
        {currentView === 'analytics' && <AnalyticsView />}
        {currentView === 'settings' && <SettingsView />}
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-8">
          <div className="w-full max-w-6xl flex flex-col gap-16 animate-in zoom-in-95 duration-500 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-6xl font-black tracking-tighter text-white uppercase italic">Settle</h3>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-sm mt-4">Terminal Authentication Required</p>
              </div>
              <button onClick={resetTerminal} className="p-10 bg-zinc-900 rounded-[3rem] hover:bg-zinc-800 hover:scale-110 transition-all text-zinc-400 hover:text-white">
                <X size={56} />
              </button>
            </div>

            {checkoutStep === 'payment' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <button className="flex flex-col items-start gap-12 p-16 bg-white rounded-[4rem] text-black border-4 border-white transition-all active:scale-95 group">
                      <CreditCard size={64} strokeWidth={2.5} />
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tight">Card / Tap</h4>
                        <p className="opacity-50 font-bold text-xs uppercase tracking-widest mt-1">NFC Reader Active</p>
                      </div>
                    </button>
                    <button className="flex flex-col items-start gap-12 p-16 bg-zinc-900 border-4 border-zinc-800 rounded-[4rem] text-white transition-all active:scale-95 hover:border-white group">
                      <Banknote size={64} />
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tight">Cash Pay</h4>
                        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-1 text-zinc-500">Manual Entry</p>
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[totals.total, 50, 100].map(val => (
                      <button 
                        key={val}
                        onClick={() => setCashTendered(val)}
                        className={`py-8 rounded-[2rem] border-2 font-black text-2xl transition-all ${cashTendered === val ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                      >
                        ${val.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/50 rounded-[5rem] p-16 flex flex-col justify-between border border-zinc-800/50 text-white">
                   <div className="space-y-12">
                      <div className="flex justify-between items-end">
                        <span className="text-zinc-500 font-black text-lg uppercase tracking-widest">To Pay</span>
                        <span className="text-6xl font-black tracking-tighter">${totals.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-zinc-500 font-black text-lg uppercase tracking-widest">Tendered</span>
                        <span className="text-7xl font-black tracking-tighter text-indigo-400">${cashTendered.toFixed(2)}</span>
                      </div>
                      {totals.change > 0 && (
                        <div className="flex justify-between items-end pt-12 border-t border-zinc-800 animate-in slide-in-from-top-4">
                          <span className="text-emerald-500 font-black text-lg uppercase tracking-widest underline underline-offset-8">Change Due</span>
                          <span className="text-7xl font-black tracking-tighter text-emerald-500 animate-pulse">${totals.change.toFixed(2)}</span>
                        </div>
                      )}
                   </div>

                   <button 
                    onClick={finalizeTransaction}
                    disabled={isProcessing}
                    className="w-full bg-white text-black py-12 rounded-[3.5rem] font-black text-4xl flex items-center justify-center gap-6 hover:bg-zinc-200 transition-all shadow-[0_40px_100px_rgba(255,255,255,0.05)]"
                   >
                    {isProcessing ? "PROCESSING..." : "FINALIZE ORDER"}
                    {!isProcessing && <CheckCircle2 size={56} />}
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-12 py-20 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-48 h-48 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_100px_rgba(16,185,129,0.3)] animate-bounce">
                  <CheckCircle2 size={100} strokeWidth={3} />
                </div>
                <div className="text-center space-y-4">
                  <h4 className="text-7xl font-black tracking-tighter uppercase italic text-white">Success</h4>
                  <p className="text-zinc-500 font-bold uppercase tracking-[0.4em]">Transaction Authorized</p>
                </div>
                <div className="flex gap-6 mt-8">
                  <button onClick={resetTerminal} className="px-16 py-8 bg-zinc-900 rounded-[2.5rem] font-black text-xl hover:bg-zinc-800 transition-all flex items-center gap-4 text-white">
                    <History size={24} /> LOG
                  </button>
                  <button onClick={resetTerminal} className="px-16 py-8 bg-white text-black rounded-[2.5rem] font-black text-xl hover:bg-zinc-200 transition-all flex items-center gap-4 shadow-xl">
                    <Printer size={24} /> PRINT
                  </button>
                  <button onClick={resetTerminal} className="px-16 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-indigo-500 transition-all flex items-center gap-4 shadow-xl">
                    <ArrowRight size={24} /> NEXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-10 py-6 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 backdrop-blur-3xl border border-white/5 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 
          toast.type === 'info' ? 'bg-indigo-600 text-white' : 'bg-white text-black'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          <span className="font-black text-base tracking-tighter uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          position: absolute;
          animation: scan-line 0.25s ease-in-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #18181b;
        }
      `}} />
    </div>
  );
};

export default POS;