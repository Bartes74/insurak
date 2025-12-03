import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Menu, X, LogOut, Sun, Moon, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Pulpit', href: '/', icon: LayoutDashboard },
    { name: 'Ubezpieczenia', href: '/assets', icon: Car },
    { name: 'Administracja', href: '/admin', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-6 bg-gray-800 font-bold text-xl tracking-wider">
          InsureGuard
        </div>
        <nav className="flex-1 flex flex-col px-4 py-6 gap-y-4">
          <ul role="list" className="flex flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-col gap-2 shrink-0 p-4 bg-gray-800">
            <button 
                onClick={toggleTheme}
                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-400 hover:text-white hover:bg-gray-800 w-full"
            >
                {theme === 'light' ? (
                    <>
                        <Moon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        Tryb Ciemny
                    </>
                ) : (
                    <>
                        <Sun className="h-6 w-6 shrink-0" aria-hidden="true" />
                        Tryb Jasny
                    </>
                )}
            </button>
            <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-400 hover:text-white hover:bg-gray-800 w-full">
                <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                Wyloguj
            </button>
        </div>
      </div>
    </>
  );
}
