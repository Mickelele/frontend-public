// components/Navbar.js
'use client';
import Link from 'next/link';
import { useAuth } from '/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
    const { user, logout, loading } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const getRoleLabel = (role) => {
        const roles = {
            'administrator': 'Administrator',
            'nauczyciel': 'Nauczyciel',
            'opiekun': 'Opiekun',
            'uczen': 'Uczeń'
        };
        return roles[role] || role;
    };

    return (
        <nav className="w-full bg-white shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center space-x-8">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                    MojeLogo
                </Link>

                {!loading && !user && (
                    <div className="hidden md:flex space-x-4 text-gray-700 font-medium">
                        <Link href="/#oferta" className="hover:text-blue-600 transition">Oferta</Link>
                        <Link href="/#o-nas" className="hover:text-blue-600 transition">O nas</Link>
                        <Link href="/#lokalizacja" className="hover:text-blue-600 transition">Lokalizacja</Link>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
                {loading ? (
                    <div className="flex items-center space-x-4">
                        <div className="text-gray-500 text-sm">Weryfikacja...</div>
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : user ? (
                    <>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-gray-700 font-medium">
                                Witaj, {user.imie}
                            </span>
                            <span className="text-xs text-blue-600 font-medium">
                                {getRoleLabel(user.role)}
                            </span>
                        </div>

                        {/* Przycisk hamburger menu */}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Otwórz menu"
                        >
                            <div className="w-6 h-6 flex flex-col justify-between">
                                <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                                <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                                <span className="w-full h-0.5 bg-gray-600 rounded"></span>
                            </div>
                        </button>

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