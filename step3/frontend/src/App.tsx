import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { SystemHealthBanner } from './components/SystemHealthBanner';
import { QuickStats } from './components/QuickStats';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterModal } from './components/auth/RegisterModal';
import { OTPResetModal } from './components/auth/OTPResetModal';
import { UserProfileCard } from './components/auth/UserProfileCard';
import { PermissionMatrixCard } from './components/auth/PermissionMatrixCard';
import { SensitiveOperationsTester } from './components/auth/SensitiveOperationsTester';
import { healthApi, HealthData } from './services/api';
import { Terminal, Shield, Sparkles } from 'lucide-react';

function DashboardContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      const e = err as Error;
      setHealthError(e.message || 'Failed to connect to StockSense API');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-mono">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing StockSense Security Foundation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-sky-400" /> Step 3 Milestone
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Authentication & Role-Based Access Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              StockSense Identity & Governance Platform
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Backend-enforced granular permissions, token revocation blacklist, and OTP recovery
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-start md:self-auto">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>RBAC Status: Active (4 Roles, 12 Permissions)</span>
          </div>
        </div>

        {/* Live System Ingress & Database Health Banner */}
        <SystemHealthBanner
          health={health}
          loading={healthLoading}
          error={healthError}
          onRefresh={fetchHealth}
        />

        {/* If Authenticated: Display Profile, Permission Matrix & Sensitive Operations Tester */}
        {isAuthenticated ? (
          <div className="space-y-8">
            <UserProfileCard />
            <PermissionMatrixCard />
            <SensitiveOperationsTester />
            <QuickStats />
          </div>
        ) : (
          /* If Not Authenticated: Display Login & Quick Role Switcher */
          <div className="space-y-8">
            <LoginForm
              onOpenRegister={() => setShowRegisterModal(true)}
              onOpenOTPReset={() => setShowOTPModal(true)}
            />
            <QuickStats />
          </div>
        )}

        {/* Modals */}
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />

        <OTPResetModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
        />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center space-x-2">
          <Terminal className="h-3.5 w-3.5 text-slate-600" />
          <span>StockSense Step 3 — Secure Identity, Session Management & RBAC Protection</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
