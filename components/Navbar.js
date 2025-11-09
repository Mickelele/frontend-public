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
        <nav className="w-full bg-white shadow-md p-4 flex items-center justify-between">
            {/* Lewa strona: Logo i linki */}
            <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                    {/* Tutaj logo tekstowe, możesz podmienić na obraz */}
                    MojeLogo
                </Link>
                <div className="hidden md:flex space-x-4 text-gray-700 font-medium">
                    <Link href="/#oferta" className="hover:text-blue-600 transition">Oferta</Link>
                    <Link href="/#o-nas" className="hover:text-blue-600 transition">O nas</Link>
                    <Link href="/#lokalizacja" className="hover:text-blue-600 transition">Lokalizacja</Link>
                </div>
            </div>

            {/* Prawa strona: Logowanie / Zapisz się / Wyloguj */}
            <div className="flex items-center space-x-4">
                {user ? (
                    <>
                        <span className="text-gray-700 font-medium hidden md:inline">{user.imie}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                        >
                            Wyloguj
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/auth/login"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                        >
                            Logowanie
                        </Link>
                        <Link
                            href="/auth/register"
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                        >
                            Zapisz się na kurs
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
