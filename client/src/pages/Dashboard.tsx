import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import api from '../hooks/useApi';
import { Link } from 'react-router-dom';

interface DashboardKpi {
  activePolicies: number;
  expiringSoon: number;
  monthlyCost: number;
}

interface ActionItem {
  assetId: number;
  assetName: string;
  message: string;
  severity: 'warning' | 'info';
}

interface CashflowPoint {
  month: string;
  amount: number;
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setKpi({
          activePolicies: data.activePolicies,
          expiringSoon: data.expiringSoon,
          monthlyCost: data.monthlyCost,
        });
        setActions(data.actionItems || []);
        setCashflow(data.cashflow || []);
      } catch (err) {
        console.error(err);
        setError('Nie udało się załadować danych pulpitu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pulpit</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Przegląd portfela ubezpieczeń na dzień {format(new Date(), 'd MMMM yyyy', { locale: pl })}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Aktywne polisy"
          value={kpi?.activePolicies ?? '—'}
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
        />
        <KpiCard
          label="Wygasające (< 30 dni)"
          value={kpi?.expiringSoon ?? '—'}
          icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
        />
        <KpiCard
          label="Prognoza kosztów (msc)"
          value={kpi ? `${kpi.monthlyCost.toLocaleString('pl-PL')} PLN` : '—'}
          icon={<Wallet className="h-6 w-6 text-indigo-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Wymagane działanie</h3>
            <div className="mt-5">
              {loading ? (
                <p className="text-sm text-gray-500">Ładowanie...</p>
              ) : actions.length === 0 ? (
                <p className="text-sm text-gray-500">Brak krytycznych zadań.</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {actions.map((item) => (
                    <li key={item.assetId} className="py-3">
                      <Link
                        to={`/assets?assetId=${item.assetId}`}
                        className="flex items-start space-x-3 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.assetName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.message}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Rozkład kosztów</h3>
            {cashflow.length === 0 ? (
              <div className="mt-5 h-48 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <span className="text-gray-400 dark:text-gray-500">Brak danych</span>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Najbliższe 6 mies.</span>
                  <span>Łącznie {cashflow.reduce((a, b) => a + b.amount, 0).toLocaleString('pl-PL')} PLN</span>
                </div>
                <div className="space-y-2">
                  {cashflow.map((point) => {
                    const max = Math.max(...cashflow.map((c) => c.amount), 1);
                    const width = `${Math.round((point.amount / max) * 100)}%`;
                    return (
                      <div key={point.month} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
                          <span className="font-medium">{point.month}</span>
                          <span className="tabular-nums">{point.amount.toLocaleString('pl-PL')} PLN</span>
                        </div>
                        <div className="h-3 w-full rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-md bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 dark:from-indigo-400 dark:via-blue-400 dark:to-teal-300"
                            style={{ width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
