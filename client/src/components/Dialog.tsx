import { Fragment, useRef } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'info';
    children?: React.ReactNode;
    manualClose?: boolean;
}

export default function Dialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Potwierdź',
    cancelLabel = 'Anuluj',
    variant = 'primary',
    children,
    manualClose = false,
}: DialogProps) {
    const cancelButtonRef = useRef(null);

    const isDanger = variant === 'danger';

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <HeadlessDialog as="div" className="relative z-50" initialFocus={cancelButtonRef} onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <HeadlessDialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className={clsx(
                                            "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
                                            isDanger ? "bg-red-100 dark:bg-red-900/20" : "bg-blue-100 dark:bg-blue-900/20"
                                        )}>
                                            {isDanger ? (
                                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                            ) : (
                                                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                            )}
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <HeadlessDialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                                                {title}
                                            </HeadlessDialog.Title>
                                            <div className="mt-2">
                                                {children || (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="button"
                                        className={clsx(
                                            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto",
                                            isDanger
                                                ? "bg-red-600 hover:bg-red-500"
                                                : "bg-indigo-600 hover:bg-indigo-500"
                                        )}
                                        onClick={() => {
                                            onConfirm();
                                            if (!manualClose) onClose();
                                        }}
                                    >
                                        {confirmLabel}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                                        onClick={onClose}
                                        ref={cancelButtonRef}
                                    >
                                        {cancelLabel}
                                    </button>
                                </div>
                            </HeadlessDialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </HeadlessDialog>
        </Transition.Root>
    );
}
