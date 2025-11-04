'use client';
import Link from 'next/link';
import { useAuth } from '/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <nav className="p-4 flex justify-between bg-gray-100">
            <div className="space-x-4">
                <Link href="/">Strona główna</Link>
                {user ? (
                    <Link href="/dashboard/profile">Profil</Link>
                ) : (
                    <>
                        <Link href="/auth/register">Rejestracja</Link>
                        <Link href="/auth/login">Logowanie</Link>
                    </>
                )}
            </div>
            {user && (
                <button onClick={handleLogout} className="text-red-600">
                    Wyloguj
                </button>
            )}
        </nav>
    );
}
