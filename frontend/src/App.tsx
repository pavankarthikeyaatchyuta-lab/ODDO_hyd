import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationPage } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterModal } from './components/auth/RegisterModal';
import { OTPResetModal } from './components/auth/OTPResetModal';
import { QuickStats } from './components/QuickStats';

// Views
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { ReceiptsView } from './views/ReceiptsView';
import { DeliveriesView } from './views/DeliveriesView';
import { TransfersView } from './views/TransfersView';
import { AdjustmentsView } from './views/AdjustmentsView';
import { MoveHistoryView } from './views/MoveHistoryView';
import { StockOverviewView } from './views/StockOverviewView';
import { StockLedgerView } from './views/StockLedgerView';
import { WarehousesView } from './views/WarehousesView';
import { ProfileView } from './views/ProfileView';

import { Boxes, Terminal, Sparkles, MapPin } from 'lucide-react';

const PAGE_TO_PATH: Record<NavigationPage, string> = {
  dashboard: '/dashboard',
  products: '/products',
  categories: '/categories',
  receipts: '/operations/receipts',
  deliveries: '/operations/deliveries',
  transfers: '/operations/transfers',
  adjustments: '/operations/adjustments',
  'stock-overview': '/inventory/overview',
  'stock-ledger': '/inventory/ledger',
  'move-history': '/inventory/move-history',
  warehouses: '/warehouses',
  profile: '/profile',
};

const PATH_TO_PAGE: Record<string, NavigationPage> = {
  '/dashboard': 'dashboard',
  '/products': 'products',
  '/categories': 'categories',
  '/operations/receipts': 'receipts',
  '/operations/deliveries': 'deliveries',
  '/operations/transfers': 'transfers',
  '/operations/adjustments': 'adjustments',
  '/inventory/overview': 'stock-overview',
  '/inventory/ledger': 'stock-ledger',
  '/inventory/move-history': 'move-history',
  '/warehouses': 'warehouses',
  '/profile': 'profile',
};

function getInitialPage(): NavigationPage {
  const path = window.location.pathname;
  return PATH_TO_PAGE[path] || 'dashboard';
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>(getInitialPage);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync URL changes with popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const page = PATH_TO_PAGE[path] || 'dashboard';
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync initial URL if at root
  useEffect(() => {
    if (isAuthenticated) {
      const path = window.location.pathname;
      if (path === '/' || !PATH_TO_PAGE[path]) {
        const targetPath = PAGE_TO_PATH[currentPage] || '/dashboard';
        window.history.replaceState({ page: currentPage }, '', targetPath);
      }
    }
  }, [isAuthenticated, currentPage]);

  const navigateTo = (page: NavigationPage) => {
    setCurrentPage(page);
    const targetPath = PAGE_TO_PATH[page] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
  };

  // Auth Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Quick Action Handler from Dashboard
  const handleQuickAction = (action: 'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment') => {
    switch (action) {
      case 'product':
        navigateTo('products');
        break;
      case 'receipt':
        navigateTo('receipts');
        break;
      case 'delivery':
        navigateTo('deliveries');
        break;
      case 'transfer':
        navigateTo('transfers');
        break;
      case 'adjustment':
        navigateTo('adjustments');
        break;
      default:
        break;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/20">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">StockSense</span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying security tokens & initializing warehouse engine...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Login & Register / Reset Screens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 bg-warehouse-grid text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white relative overflow-hidden">
        {/* Ambient Radial Glow Overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Navigation bar for unauthenticated page */}
        <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight">StockSense</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Enterprise Inventory
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Neon PostgreSQL Live</span>
              </span>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Hero & Login Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Full Double-Entry Inventory Engine • Neon Serverless PostgreSQL</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Intelligent Inventory & <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Multi-Warehouse Operations
              </span>
            </h1>

            <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
              Inbound Receipts, Outbound Deliveries, Zero-Delta Internal Transfers, Physical Count Adjustments, and Immutable Stock Ledger.
            </p>

            {/* Spatial Hierarchy Interactive Pipeline Banner */}
            <div className="pt-2">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono py-2 px-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
                <span className="text-sky-400 font-bold flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Warehouse (WH-MAIN)
                </span>
                <span className="text-slate-600">→</span>
                <span className="text-emerald-400 font-semibold">Zone A (Metals)</span>
                <span className="text-slate-600">→</span>
                <span className="text-indigo-400">Rack R01</span>
                <span className="text-slate-600">→</span>
                <span className="text-purple-400">Shelf S01</span>
                <span className="text-slate-600">→</span>
                <span className="text-amber-400 font-black px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">Bin B01</span>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto">
            <LoginForm
              onOpenRegister={() => setShowRegisterModal(true)}
              onOpenOTPReset={() => setShowOTPModal(true)}
            />
          </div>

          <div className="max-w-5xl mx-auto pt-6 border-t border-slate-800/80">
            <QuickStats />
          </div>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 relative z-10">
          <div className="flex items-center justify-center space-x-2">
            <Terminal className="h-3.5 w-3.5 text-slate-600" />
            <span>StockSense Enterprise — Architectural Compliance with StockSense Problem Statement</span>
          </div>
        </footer>

        {/* Modals */}
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
        <OTPResetModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
        />
      </div>
    );
  }

  // Authenticated Application
  return (
    <div className="min-h-screen bg-slate-950 bg-warehouse-grid text-slate-100 flex font-sans selection:bg-sky-500/30 selection:text-white relative">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/5 blur-3xl pointer-events-none" />
      {/* Sidebar (Desktop fixed, Mobile offcanvas) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => navigateTo(page)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(page) => navigateTo(page)}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={(page) => navigateTo(page)}
              onOpenQuickAction={handleQuickAction}
            />
          )}

          {currentPage === 'products' && <ProductsView />}

          {currentPage === 'categories' && <CategoriesView />}

          {currentPage === 'receipts' && <ReceiptsView />}

          {currentPage === 'deliveries' && <DeliveriesView />}

          {currentPage === 'transfers' && <TransfersView />}

          {currentPage === 'adjustments' && <AdjustmentsView />}

          {currentPage === 'move-history' && <MoveHistoryView />}

          {currentPage === 'stock-overview' && <StockOverviewView />}

          {currentPage === 'stock-ledger' && <StockLedgerView />}

          {currentPage === 'warehouses' && <WarehousesView />}

          {currentPage === 'profile' && <ProfileView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center sm:text-left text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>StockSense Transaction Engine Online</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-600">
            <span>Spatial Model: Warehouse → Zone → Rack → Shelf → Bin</span>
            <span>Immutable Ledger</span>
            <span>PostgreSQL (Neon)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
