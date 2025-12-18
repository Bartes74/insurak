import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Cost Distribution State
  const [costWindowStart, setCostWindowStart] = useState(0); // Index of the first month to show
  const WINDOW_SIZE = 6;

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

        const cf = data.cashflow || [];
        setCashflow(cf);

        // Find index of current month (YYYY-MM)
        if (cf.length > 0) {
          const now = new Date();
          const currentMonthStr = format(now, 'yyyy-MM');
          const startIndex = cf.findIndex(c => c.month >= currentMonthStr);
          if (startIndex !== -1) {
            // Ensure we don't overflow the end
            setCostWindowStart(Math.min(startIndex, Math.max(0, cf.length - 6)));
          } else {
            // If current month is after all data, show the last window
            setCostWindowStart(Math.max(0, cf.length - 6));
          }
        }

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

        <Card className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold leading-6 text-foreground">Koszt ubezpieczeń</h3>
            {cashflow.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCostWindowStart(prev => Math.max(0, prev - 1))}
                  disabled={costWindowStart === 0}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Poprzedni miesiąc"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                  {/* Optional: Show range label like "Sty - Cze" */}
                </span>
                <button
                  onClick={() => setCostWindowStart(prev => Math.min(cashflow.length - WINDOW_SIZE, prev + 1))}
                  disabled={costWindowStart >= cashflow.length - WINDOW_SIZE}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Następny miesiąc"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </div>

          {cashflow.length === 0 ? (
            <div className="mt-5 h-48 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl dark:border-gray-700">
              <span className="text-gray-400">Brak danych</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Prepare Data Window */}
              {(() => {
                // Ensure we don't go out of bounds
                const validStart = Math.min(Math.max(0, costWindowStart), Math.max(0, cashflow.length - WINDOW_SIZE));
                // Slice data for the window
                // If we have fewer items than WINDOW_SIZE, show all of them (start index 0)
                const safeStart = cashflow.length < WINDOW_SIZE ? 0 : validStart;
                const windowData = cashflow.slice(safeStart, safeStart + WINDOW_SIZE);

                // Max for scaling bars relative to the VIEWABLE window (or global max? usually global context is better but window max makes better use of space)
                // Let's use global max to keep perspective across scrolling
                const globalMax = Math.max(...cashflow.map(c => c.amount), 1);

                return (
                  <>
                    {/* CHART AREA */}
                    <div className="h-48 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100 dark:border-gray-700/50">
                      {windowData.map((point) => {
                        const heightPercent = Math.round((point.amount / globalMax) * 100);
                        return (
                          <div key={point.month} className="flex flex-col items-center justify-end h-full w-full group relative">
                            {/* Tooltip */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                              {point.amount.toLocaleString('pl-PL')} PLN
                            </div>

                            {/* Bar */}
                            <div
                              className="w-full max-w-[24px] rounded-t-lg bg-indigo-500/20 dark:bg-indigo-400/20 relative overflow-hidden transition-all duration-300 hover:bg-indigo-500/30 dark:hover:bg-indigo-400/30"
                              style={{ height: `${Math.max(heightPercent, 4)}%` }} // Min 4% height to be visible
                            >
                              <div className="absolute inset-x-0 bottom-0 bg-indigo-500 dark:bg-indigo-400 opacity-60 h-full" />
                            </div>

                            {/* X-Axis Label */}
                            <div className="mt-2 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 rotate-0 truncate w-full text-center">
                              {point.month.split(' ')[0]} {/* Shorten to just month name if possible, or keep full */}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DATA LIST AREA */}
                    <div className="mt-4 flex-1">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                            <th className="py-2 pl-2">Miesiąc</th>
                            <th className="py-2 text-right pr-2">Kwota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {windowData.map((point) => (
                            <tr key={point.month} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="py-2 pl-2 font-medium text-gray-900 dark:text-gray-200">{point.month}</td>
                              <td className="py-2 pr-2 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                {point.amount.toLocaleString('pl-PL')} PLN
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Łącznie (widok): <span className="font-semibold text-gray-700 dark:text-gray-300">{windowData.reduce((a, b) => a + b.amount, 0).toLocaleString('pl-PL')} PLN</span>
                      </p>
                    </div>
                  </>
                );
              })()}
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

