import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 overflow-hidden transition-all duration-300",
        open ? "pointer-events-auto visible" : "pointer-events-none invisible"
      )}
    >
        {/* Backdrop */}
      <div 
        className={clsx(
            "absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
        )} 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
            className={clsx(
                "pointer-events-auto w-screen max-w-[750px] transform transition duration-300 sm:duration-300",
                open ? "translate-x-0" : "translate-x-full"
            )}
        >
          <div className="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white" id="slide-over-title">
                  {title}
                </h2>
                <div className="ml-3 flex h-7 items-center">
                  <button
                    type="button"
                    className="relative rounded-md bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div className="relative flex-1 px-4 py-6 sm:px-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}