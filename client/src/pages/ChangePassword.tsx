import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock } from 'lucide-react';
import api from '../hooks/useApi';

export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            showToast('Hasło musi mieć co najmniej 8 znaków.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Hasła nie są identyczne.', 'error');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { newPassword });
            showToast('Hasło zostało zmienione. Zaloguj się ponownie.', 'success');
            logout();
            navigate('/login');
        } catch (error) {
            showToast('Wystąpił błąd podczas zmiany hasła.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Zmiana hasła
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Twoje konto wymaga zmiany hasła przed dalszym korzystaniem z systemu.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="new-password" className="sr-only">Nowe hasło</label>
                            <input
                                id="new-password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Nowe hasło (min. 8 znaków)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">Potwierdź hasło</label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Potwierdź nowe hasło"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Zapisywanie...' : 'Zmień hasło'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
