import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Menu, X, LogOut, Sun, Moon, ShieldCheck, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Pulpit', href: '/', icon: LayoutDashboard },
    { name: 'Ubezpieczenia', href: '/assets', icon: Car },
    ...(user?.role === 'ADMIN' ? [{ name: 'Administracja', href: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-gray-500 hover:text-accent-orange hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-orange"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">Otwórz menu</span>
        {isOpen ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Sidebar component */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-40 transform bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-neu-flat transition-all duration-300 ease-in-out dark:bg-black/80 dark:border-white/10 dark:shadow-[var(--shadow-neu-flat-dark)]',
          // Mobile: collapsed (w-16) or expanded (w-64) based on isOpen
          // Desktop: always expanded (w-64)
          isOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0 lg:w-64'
        )}
      >
        <div className={clsx("flex h-20 shrink-0 items-center font-bold text-xl tracking-wider transition-all duration-300", isOpen || window.innerWidth >= 1024 ? "px-6 space-x-3" : "justify-center px-0")}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-orange text-white shadow-lg shrink-0">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className={clsx("transition-opacity duration-300 text-foreground dark:text-[var(--color-foreground-dark)]", isOpen ? "opacity-100" : "opacity-0 lg:opacity-100 hidden lg:block")}>Insurak</span>
        </div>
        <nav className="flex-1 flex flex-col px-3 py-6 gap-y-4">
          <ul role="list" className="flex flex-col gap-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'gradient-orange text-white shadow-md'
                        : 'text-gray-500 hover:text-accent-orange hover:bg-white dark:text-gray-400 dark:hover:bg-white/10',
                      'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300',
                      !isOpen && 'justify-center lg:justify-start'
                    )}
                    title={!isOpen ? item.name : undefined}
                  >
                    <item.icon
                      className={clsx("h-6 w-6 shrink-0", isActive ? "text-white" : "group-hover:text-accent-orange")}
                      aria-hidden="true"
                    />
                    <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isOpen ? "opacity-100 block" : "opacity-0 hidden lg:opacity-100 lg:block")}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-col gap-2 shrink-0 p-3 border-t border-gray-100">
          <button
            onClick={toggleTheme}
            className={clsx("group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-gray-500 hover:text-accent-orange hover:bg-white dark:text-gray-400 dark:hover:bg-white/10 w-full transition-all duration-300", !isOpen && 'justify-center lg:justify-start')}
            title={!isOpen ? (theme === 'light' ? 'Tryb Ciemny' : 'Tryb Jasny') : undefined}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isOpen ? "opacity-100 block" : "opacity-0 hidden lg:opacity-100 lg:block")}>Tryb Ciemny</span>
              </>
            ) : (
              <>
                <Sun className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isOpen ? "opacity-100 block" : "opacity-0 hidden lg:opacity-100 lg:block")}>Tryb Jasny</span>
              </>
            )}
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={clsx("group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20 w-full transition-all duration-300", !isOpen && 'justify-center lg:justify-start')}
            title={!isOpen ? 'Wyloguj' : undefined}
          >
            <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className={clsx("transition-opacity duration-300 whitespace-nowrap", isOpen ? "opacity-100 block" : "opacity-0 hidden lg:opacity-100 lg:block")}>Wyloguj</span>
          </button>
        </div>
      </div>
    </>
  );
}

