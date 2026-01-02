'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '/lib/api/auth.api';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('Brak tokena resetowania hasła. Link może być nieprawidłowy.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (newPassword.length < 6) {
            setError('Hasło musi mieć minimum 6 znaków');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Hasła nie są identyczne');
            setLoading(false);
            return;
        }

        if (!token) {
            setError('Brak tokena resetowania. Link może być nieprawidłowy.');
            setLoading(false);
            return;
        }

        try {
            await resetPassword(token, newPassword);
            setMessage('Hasło zostało zmienione pomyślnie!');
            
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        } catch (err) {
            setError('Link wygasł lub jest nieprawidłowy. Spróbuj ponownie zresetować hasło.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Resetuj hasło</h1>
                    <p className="text-gray-600">
                        Wprowadź nowe hasło do swojego konta
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">{message}</p>
                        <p className="text-xs mt-2 text-green-600">Przekierowanie do logowania...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Nowe hasło *
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Minimum 6 znaków"
                                disabled={loading || !token}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Powtórz hasło *
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Powtórz nowe hasło"
                                disabled={loading || !token}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetowanie...' : 'Zresetuj hasło'}
                        </button>

                        <div className="text-center pt-4 border-t">
                            <Link href="/auth/login" className="text-blue-600 hover:underline text-sm font-medium">
                                ← Powrót do logowania
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-gray-600">Ładowanie...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
