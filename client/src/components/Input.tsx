import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-2 ml-1 dark:text-[var(--color-foreground-dark)]">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'neu-pressed w-full rounded-xl border-none bg-neu-base text-sm text-foreground px-4 py-3 focus:ring-2 focus:ring-accent-orange focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 placeholder:text-gray-400 dark:text-[var(--color-foreground-dark)] dark:placeholder:text-gray-500',
                            icon && 'pl-11',
                            error && 'ring-2 ring-red-500 focus:ring-red-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
