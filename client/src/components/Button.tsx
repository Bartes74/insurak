import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

        const variants = {
            primary: 'gradient-orange text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl rounded-2xl',
            outline: 'neu-flat text-foreground border border-transparent hover:border-accent-orange/20 hover:-translate-y-0.5 rounded-2xl',
            ghost: 'bg-transparent text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl',
            danger: 'bg-red-500 text-white shadow-lg hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-xl rounded-2xl',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-6 py-3 text-sm',
            lg: 'px-8 py-4 text-base',
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
