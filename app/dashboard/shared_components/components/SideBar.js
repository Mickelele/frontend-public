'use client';
import Link from 'next/link';
import { useAuth } from '/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();


    if (loading) {
        return (
            <>
                {isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
                )}
                <div className={`
                    fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-6 h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-500 text-sm">Ładowanie...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!user) {
        return null;
    }

    const getMenuItems = () => {


        switch (user.role) {
            case 'administrator':

                return [
                    { href: '/dashboard/administrator', label: 'Dashboard', icon: '📊', description: 'Panel administracyjny' },
                    { href: '/dashboard/administrator/users', label: 'Użytkownicy', icon: '👥', description: 'Zarządzanie użytkownikami' },
                    { href: '/dashboard/shared_components/profile', label: 'Profil', icon: '👤', description: 'Twój profil' },
                ];
            case 'nauczyciel':

                return [
                    { href: '/dashboard/nauczyciel', label: 'Dashboard', icon: '📊', description: 'Panel nauczyciela' },
                    { href: '/dashboard/nauczyciel/attendance', label: 'Obecności', icon: '✅', description: 'Sprawdzanie obecności' },
                    { href: '/dashboard/nauczyciel/worktime', label: 'Czas pracy', icon: '⏰', description: 'Godziny pracy' },
                    { href: '/dashboard/nauczyciel/quizzes', label: 'Quizy', icon: '🧩', description: 'Testy i quizy' },
                    { href: '/dashboard/nauczyciel/homework', label: 'Zadania domowe', icon: '📝', description: 'Zadania i prace' },
                    { href: '/dashboard/nauczyciel/messages', label: 'Wiadomości', icon: '💬', description: 'Komunikacja' },
                    { href: '/dashboard/shared_components/profile', label: 'Profil', icon: '👤', description: 'Dane osobowe' },
                    { href: '/dashboard/nauczyciel/settings', label: 'Ustawienia', icon: '⚙️', description: 'Ustawienia konta' },
                ];
            case 'opiekun':

                return [
                    { href: '/dashboard/opiekun', label: 'Dashboard', icon: '📊', description: 'Panel główny' },
                    { href: '/dashboard/shared_components/students_presence', label: 'Obecności uczniów', icon: '📋', description: 'Śledzenie obecności' },
                    { href: '/dashboard/nauczyciel/messages', label: 'Wiadomości', icon: '💬', description: 'Komunikacja' },
                    { href: '/dashboard/shared_components/profile', label: 'Profil', icon: '👤', description: 'Twój profil' },
                    { href: '/dashboard/nauczyciel/settings', label: 'Ustawienia', icon: '⚙️', description: 'Ustawienia konta' },

                ];
            case 'uczen':

                return [
                    { href: '/dashboard/uczen', label: 'Dashboard', icon: '📊', description: 'Panel ucznia' },
                    { href: '/dashboard/shared_components/profile', label: 'Profil', icon: '👤', description: 'Twój profil' },
                    { href: '/dashboard/uczen/grades', label: 'Moje oceny', icon: '🏆', description: 'Twoje oceny' },
                    { href: '/dashboard/uczen/prizes', label: 'Punkty i nagrody', icon: '⭐', description: 'Odbierz nagrody za punkty' },
                ];
            default:

                return [
                    { href: '/dashboard', label: 'Dashboard', icon: '📊', description: 'Panel główny' },
                    { href: '/dashboard/shared_components/profile', label: 'Profil', icon: '👤', description: 'Twój profil' },
                ];
        }
    };

    const menuItems = getMenuItems();



    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getSidebarTitle = () => {
        const titles = {
            'administrator': 'Panel Administracyjny',
            'nauczyciel': 'Panel Nauczyciela',
            'opiekun': 'Panel Opiekuna',
            'uczen': 'Panel Ucznia'
        };
        return titles[user.role] || 'Menu';
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={handleOverlayClick}
                />
            )}

            <div className={`
                fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{getSidebarTitle()}</h2>
                            <p className="text-sm text-gray-600 mt-1">Witaj, {user.imie}!</p>

                            <p className="text-xs text-gray-400">Rola: {user.role}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                            aria-label="Zamknij menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.length > 0 ? (
                            menuItems.map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-blue-500 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        <div className="flex-1">
                                            <div className="font-medium">{item.label}</div>
                                            <div className={`text-xs ${
                                                isActive ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="text-center p-4 text-gray-500">
                                <p>Brak dostępnych opcji menu</p>
                                <p className="text-sm">Rola: {user.role}</p>
                            </div>
                        )}
                    </nav>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            Zalogowany jako:<br />
                            <strong>{user.email}</strong><br />
                            <span className="text-blue-600 font-medium capitalize">{user.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}