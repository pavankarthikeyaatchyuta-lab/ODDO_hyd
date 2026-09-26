import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { SystemHealthBanner } from './components/SystemHealthBanner';
import { QuickStats } from './components/QuickStats';
import { AuthCard } from './components/AuthCard';
import { healthApi, HealthData } from './services/api';
import { Layers, Workflow, ShieldCheck, Terminal, Compass } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await healthApi.getHealth();
      setHealth(data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to connect to StockSense API');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              StockSense Foundation
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Transactional inventory core, Prisma relational schema, and microservice-ready API gateway
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Compass className="h-4 w-4 text-sky-400" />
            <span>Sprint: Foundation & Schema Bootstrap</span>
          </div>
        </div>

        {/* Live System Ingress Health */}
        <SystemHealthBanner
          health={health}
          loading={loading}
          error={error}
          onRefresh={fetchHealth}
        />

        {/* KPI Preview */}
        <QuickStats />

        {/* Auth & Security Card */}
        <AuthCard />

        {/* Architecture Foundation Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 w-fit mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Relational Domain Model</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              28 domain entities mapped in Prisma: Multi-level spatial locations (Warehouse &rarr; Zone &rarr; Rack &rarr; Shelf &rarr; Bin), Batches, Serials, Reorder Rules, and Procurement.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit mb-4">
              <Workflow className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Immutable Stock Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Double-entry inspired journal capturing every stock increment, transfer, delivery, and adjustment with mathematical balance invariants.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Granular Role-Based Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Admin, Inventory Manager, Warehouse Staff, and Auditor roles enforced with token-based authentication and OTP recovery pipelines.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center space-x-2">
          <Terminal className="h-3.5 w-3.5 text-slate-600" />
          <span>StockSense — Engineered with React, Node.js, Express, and Prisma</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
