import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import api from '../hooks/useApi';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

interface DashboardKpi {
  activePolicies: number;
  expiringSoon: number;
  expiredPolicies: number;
  totalPolicies: number;
  monthlyCost: number;
}

interface ActionItem {
  assetId: number;
  assetName: string;
  message: string;
  severity: 'warning' | 'info' | 'danger';
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
          expiredPolicies: data.expiredPolicies,
          totalPolicies: data.totalPolicies,
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pulpit</h1>
        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
          {kpi ? `${kpi.totalPolicies} wszystkich polis w bazie` : '...'} na dzień {format(new Date(), 'd MMMM yyyy', { locale: pl })}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Aktywne polisy"
          value={kpi?.activePolicies ?? '—'}
          icon={<CheckCircle2 className="h-6 w-6 text-white" />}
          gradient="gradient-blue"
          to="/assets?status=ACTIVE"
        />
        <KpiCard
          label="Wygasające (< 30 dni)"
          value={kpi?.expiringSoon ?? '—'}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          gradient="gradient-orange"
          to="/assets?status=EXPIRING"
        />
        <KpiCard
          label="Wygasłe polisy"
          value={kpi?.expiredPolicies ?? '—'}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          gradient="gradient-purple"
          to="/assets?status=EXPIRED"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="h-full">
          <h3 className="text-lg font-semibold leading-6 text-foreground mb-6">Wymagane działanie</h3>
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-orange border-t-transparent"></div>
                <p className="mt-2 text-sm">Ładowanie...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-green-100 p-4 mb-3 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-base font-medium text-foreground">Wszystko w porządku</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Brak pilnych zadań do wykonania.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {actions.map((item) => (
                  <li key={item.assetId}>
                    <Link
                      to={`/assets?assetId=${item.assetId}`}
                      className={`group flex items-start space-x-4 rounded-2xl border p-4 transition-all hover:shadow-md ${item.severity === 'danger'
                        ? 'border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 dark:border-red-900/30 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                        : item.severity === 'warning'
                          ? 'border-orange-100 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-200 dark:border-orange-900/30 dark:bg-orange-900/10 dark:hover:bg-orange-900/20'
                          : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 dark:border-blue-900/30 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'
                        }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {item.severity === 'danger' ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        ) : item.severity === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                        ) : (
                          <Wallet className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.severity === 'danger' ? 'text-red-900 line-through decoration-red-300 dark:text-red-200 dark:decoration-red-700'
                          : item.severity === 'warning' ? 'text-orange-900 dark:text-orange-200'
                            : 'text-blue-900 dark:text-blue-200'
                          }`}>
                          {item.assetName}
                        </p>
                        <p className={`text-sm mt-0.5 ${item.severity === 'danger' ? 'text-red-700 dark:text-red-300'
                          : item.severity === 'warning' ? 'text-orange-700 dark:text-orange-300'
                            : 'text-blue-700 dark:text-blue-300'
                          }`}>
                          {item.message}
                        </p>
                      </div>
                      <div className="flex-shrink-0 self-center">
                        <span className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 text-gray-400">
                          Zobacz &rarr;
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="h-full">
          <h3 className="text-lg font-semibold leading-6 text-foreground mb-6">Rozkład kosztów</h3>
          {cashflow.length === 0 ? (
            <div className="mt-5 h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl dark:border-gray-700">
              <span className="text-gray-400">Brak danych</span>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium uppercase tracking-wide dark:text-gray-400">
                <span>Najbliższe 6 mies.</span>
                <span>Łącznie {cashflow.reduce((a, b) => a + b.amount, 0).toLocaleString('pl-PL')} PLN</span>
              </div>
              <div className="space-y-3">
                {cashflow.map((point) => {
                  const max = Math.max(...cashflow.map((c) => c.amount), 1);
                  const width = `${Math.round((point.amount / max) * 100)}%`;
                  return (
                    <div key={point.month} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span className="font-medium">{point.month}</span>
                        <span className="tabular-nums font-semibold">{point.amount.toLocaleString('pl-PL')} PLN</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden shadow-inner dark:bg-gray-700">
                        <div
                          className="h-full rounded-full gradient-blue"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, gradient, to }: { label: string; value: string | number; icon: React.ReactNode; gradient: string; to?: string }) {
  const CardContent = (
    <Card hoverEffect className="relative overflow-hidden group h-full">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300`}>
        {/* Background decoration could go here */}
      </div>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`h-12 w-12 flex items-center justify-center rounded-2xl shadow-lg ${gradient}`}>
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
            <dd>
              <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

