'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '/context/AuthContext';
import { useRouter } from 'next/navigation';
import logo from '../media/logo/logo.svg';

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

    const getFirstDashboardRoute = (role) => {
        const firstRoutes = {
            'administrator': '/dashboard/administrator/users',
            'nauczyciel': '/dashboard/nauczyciel/attendance',
            'opiekun': '/dashboard/opiekun',
            'uczen': '/dashboard/uczen'
        };
        return firstRoutes[role] || '/dashboard';
    };

    return (
        <nav className="w-full bg-orange-500 shadow-xl p-6 flex items-center justify-between">
            <div className="flex items-center space-x-8">
                <Link 
                    href={user ? getFirstDashboardRoute(user.role) : "/"} 
                    className="flex items-center hover:scale-105 transition-transform"
                >
                    <Image 
                        src={logo} 
                        alt="Logo" 
                        height={35}
                        width={105}
                        priority
                        className="filter brightness-0 invert"
                    />
                </Link>

                {!loading && !user && (
                    <div className="hidden md:flex space-x-6 text-white font-semibold">
                        <Link href="/#kursy" className="hover:text-orange-100 transition-colors duration-300 text-lg">Kursy</Link>
                        <Link href="/#kadra" className="hover:text-orange-100 transition-colors duration-300 text-lg">Kadra</Link>
                        <Link href="/#nauczyciele" className="hover:text-orange-100 transition-colors duration-300 text-lg">Kalendarz</Link>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-4">
                {loading ? (
                    <div className="flex items-center space-x-4">
                        <div className="text-white text-sm font-medium">Weryfikacja...</div>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : user ? (
                    <>
                        <div className="hidden md:flex flex-col items-end bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <span className="text-white font-bold text-lg">
                                Witaj, {user.imie}
                            </span>
                            <span className="text-xs text-orange-100 font-semibold">
                                {getRoleLabel(user.role)}
                            </span>
                        </div>

                        <button
                            onClick={toggleSidebar}
                            className="p-3 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
                            aria-label="Otwórz menu"
                        >
                            <div className="w-6 h-6 flex flex-col justify-between">
                                <span className="w-full h-0.5 bg-white rounded"></span>
                                <span className="w-full h-0.5 bg-white rounded"></span>
                                <span className="w-full h-0.5 bg-white rounded"></span>
                            </div>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold border border-white/30"
                        >
                            Wyloguj
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col min-[520px]:flex-row gap-2 min-[520px]:gap-4">
                        <Link
                            href="/auth/login"
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold border border-white/30 text-center"
                        >
                            Logowanie
                        </Link>
                        <Link
                            href="/auth/register"
                            className="bg-white text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl text-center"
                        >
                            Zapisz się na kurs
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}