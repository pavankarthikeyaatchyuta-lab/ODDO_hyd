import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Layers,
  BookOpen,
  Warehouse as WarehouseIcon,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Boxes as AppLogoIcon,
} from 'lucide-react';

export type NavigationPage =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'move-history'
  | 'stock-overview'
  | 'stock-ledger'
  | 'warehouses'
  | 'profile';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    if (onCloseMobile) onCloseMobile();
  };

  const navSectionClass = 'px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400';
  const navItemClass = (active: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      active
        ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-sm shadow-sky-500/10'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-5 py-4 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
            <AppLogoIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">StockSense</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent Inventory OS</p>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {/* Main Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className={navItemClass(currentPage === 'dashboard')}
          >
            <div className="flex items-center space-x-2.5">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            {currentPage === 'dashboard' && <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {/* Section: Products */}
          <div className={navSectionClass}>Products</div>
          <button
            onClick={() => handleNavClick('products')}
            className={navItemClass(currentPage === 'products')}
          >
            <div className="flex items-center space-x-2.5">
              <Package className="h-4 w-4" />
              <span>Products Catalog</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className={navItemClass(currentPage === 'categories')}
          >
            <div className="flex items-center space-x-2.5">
              <Boxes className="h-4 w-4" />
              <span>Categories</span>
            </div>
          </button>

          {/* Section: Operations */}
          <div className={navSectionClass}>Operations</div>
          <button
            onClick={() => handleNavClick('receipts')}
            className={navItemClass(currentPage === 'receipts')}
          >
            <div className="flex items-center space-x-2.5">
              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
              <span>Receipts (Inbound)</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('deliveries')}
            className={navItemClass(currentPage === 'deliveries')}
          >
            <div className="flex items-center space-x-2.5">
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
              <span>Delivery Orders</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('transfers')}
            className={navItemClass(currentPage === 'transfers')}
          >
            <div className="flex items-center space-x-2.5">
              <ArrowLeftRight className="h-4 w-4 text-sky-400" />
              <span>Internal Transfers</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('adjustments')}
            className={navItemClass(currentPage === 'adjustments')}
          >
            <div className="flex items-center space-x-2.5">
              <SlidersHorizontal className="h-4 w-4 text-purple-400" />
              <span>Stock Adjustments</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('move-history')}
            className={navItemClass(currentPage === 'move-history')}
          >
            <div className="flex items-center space-x-2.5">
              <History className="h-4 w-4" />
              <span>Move History</span>
            </div>
          </button>

          {/* Section: Inventory */}
          <div className={navSectionClass}>Inventory & Auditing</div>
          <button
            onClick={() => handleNavClick('stock-overview')}
            className={navItemClass(currentPage === 'stock-overview')}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="h-4 w-4" />
              <span>Stock Overview</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('stock-ledger')}
            className={navItemClass(currentPage === 'stock-ledger')}
          >
            <div className="flex items-center space-x-2.5">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>Stock Ledger (Audit)</span>
            </div>
          </button>

          {/* Section: Settings */}
          <div className={navSectionClass}>Configuration</div>
          <button
            onClick={() => handleNavClick('warehouses')}
            className={navItemClass(currentPage === 'warehouses')}
          >
            <div className="flex items-center space-x-2.5">
              <WarehouseIcon className="h-4 w-4" />
              <span>Warehouses & Locations</span>
            </div>
          </button>
          <button
            onClick={() => handleNavClick('profile')}
            className={navItemClass(currentPage === 'profile')}
          >
            <div className="flex items-center space-x-2.5">
              <UserIcon className="h-4 w-4" />
              <span>User Profile</span>
            </div>
          </button>
        </div>

        {/* User Card & Logout Footer */}
        {user && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="min-w-0 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Logout session"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
