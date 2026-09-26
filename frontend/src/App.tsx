import { useState } from 'react';
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

import { Boxes, Shield, Terminal, Sparkles } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auth Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Quick Action Handler from Dashboard
  const handleQuickAction = (action: 'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment') => {
    switch (action) {
      case 'product':
        setCurrentPage('products');
        break;
      case 'receipt':
        setCurrentPage('receipts');
        break;
      case 'delivery':
        setCurrentPage('deliveries');
        break;
      case 'transfer':
        setCurrentPage('transfers');
        break;
      case 'adjustment':
        setCurrentPage('adjustments');
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
        {/* Navigation bar for unauthenticated page */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
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
              <span className="hidden md:flex items-center gap-1.5 text-slate-400">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Backend RBAC Active</span>
              </span>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Hero & Login Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Double-Entry Inventory Transaction Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Intelligent Inventory & Multi-Warehouse Control
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Receipts, Delivery Orders, Zero-Delta Internal Transfers, Physical Count Adjustments, and Immutable Stock Ledger.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <LoginForm
              onOpenRegister={() => setShowRegisterModal(true)}
              onOpenOTPReset={() => setShowOTPModal(true)}
            />
          </div>

          <div className="max-w-4xl mx-auto pt-6 border-t border-slate-800/80">
            <QuickStats />
          </div>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center space-x-2">
            <Terminal className="h-3.5 w-3.5 text-slate-600" />
            <span>StockSense — Enterprise Inventory Management System</span>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-sky-500/30 selection:text-white">
      {/* Sidebar (Desktop fixed, Mobile offcanvas) */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(page) => setCurrentPage(page)}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardView
              onNavigate={(page) => setCurrentPage(page)}
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
