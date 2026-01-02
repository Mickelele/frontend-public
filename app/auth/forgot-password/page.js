'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '/lib/api/auth.api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await requestPasswordReset(email);
            setMessage('Jeśli email istnieje w systemie, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową.');
            
            setTimeout(() => {
                router.push('/auth/login');
            }, 5000);
        } catch (err) {
            setMessage('Jeśli email istnieje w systemie, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową.');
            
            setTimeout(() => {
                router.push('/auth/login');
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Zapomniałeś hasła?</h1>
                    <p className="text-gray-600">
                        Podaj swój adres email, a wyślemy Ci link do resetowania hasła
                    </p>
                </div>

                {message ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                        <p className="text-sm">{message}</p>
                        <p className="text-xs mt-2 text-green-600">Przekierowanie do logowania...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="twoj@email.com"
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
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
