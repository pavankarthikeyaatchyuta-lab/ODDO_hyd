import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../services/api';
import { NotificationItem, UserRole } from '../../types';
import {
  Menu,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { NavigationPage } from './Sidebar';

interface NavbarProps {
  currentPage: NavigationPage;
  onOpenMobileSidebar: () => void;
  onNavigate: (page: NavigationPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onNavigate,
}) => {
  const { user, quickLogin } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const pageTitles: Record<NavigationPage, { title: string; subtitle: string }> = {
    dashboard: { title: 'Inventory Dashboard', subtitle: 'Live warehouse KPIs and activity stream' },
    products: { title: 'Product Catalog', subtitle: 'SKU management, stock availability & reordering rules' },
    categories: { title: 'Product Categories', subtitle: 'Taxonomy and catalog organization' },
    receipts: { title: 'Inbound Receipts', subtitle: 'Vendor delivery reception and stock intake' },
    deliveries: { title: 'Outbound Delivery Orders', subtitle: 'Customer fulfillment, picking, and dispatch' },
    transfers: { title: 'Internal Transfers', subtitle: 'Zero-delta movement between warehouse locations' },
    adjustments: { title: 'Stock Adjustments', subtitle: 'Physical count discrepancy reconciliation' },
    'move-history': { title: 'Move History', subtitle: 'Chronological timeline of operational stock shifts' },
    'stock-overview': { title: 'Stock Overview', subtitle: 'Multi-warehouse spatial stock matrix' },
    'stock-ledger': { title: 'Immutable Stock Ledger', subtitle: 'First-class auditable journal of all inventory events' },
    warehouses: { title: 'Warehouse Management', subtitle: 'Spatial hierarchy: Warehouse → Zone → Rack → Shelf → Bin' },
    profile: { title: 'User Profile & Security', subtitle: 'Account governance and RBAC permissions' },
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.listNotifications();
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setIsSwitchingRole(true);
    try {
      await quickLogin(role);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  const pageInfo = pageTitles[currentPage] || { title: 'StockSense', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
              {pageInfo.title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-400 mt-0.5">{pageInfo.subtitle}</p>
          </div>
        </div>

        {/* Right: Quick Role Switcher + Notification Bell + Profile Button */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Role Switcher for seamless test demoing */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-sky-400" /> Switch Role:
            </span>
            <button
              disabled={isSwitchingRole}
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs font-semibold ${
                user?.role === 'ADMIN'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Admin
            </button>
            <button
              disabled={isSwitchingRole}
              onClick={() => handleRoleSwitch('INVENTORY_MANAGER')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs font-semibold ${
                user?.role === 'INVENTORY_MANAGER'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Manager
            </button>
            <button
              disabled={isSwitchingRole}
              onClick={() => handleRoleSwitch('WAREHOUSE_STAFF')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs font-semibold ${
                user?.role === 'WAREHOUSE_STAFF'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Staff
            </button>
            <button
              disabled={isSwitchingRole}
              onClick={() => handleRoleSwitch('VIEWER_AUDITOR')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs font-semibold ${
                user?.role === 'VIEWER_AUDITOR'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Auditor
            </button>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Inventory Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications or stock alerts.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 flex items-start space-x-3 transition-colors ${
                          n.isRead ? 'bg-slate-900/40 opacity-70' : 'bg-slate-900/90'
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.severity === 'CRITICAL' && <AlertOctagon className="h-4 w-4 text-rose-400" />}
                          {n.severity === 'WARNING' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                          {n.severity === 'INFO' && <Info className="h-4 w-4 text-sky-400" />}
                          {n.severity === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-200">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Link */}
          {user && (
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              <div className="h-7 w-7 rounded-lg bg-sky-600/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
