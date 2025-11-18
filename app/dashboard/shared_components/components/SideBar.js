'use client';
import Link from 'next/link';
import { useAuth } from '/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) {
        return null;
    }

    const menuItems = [
        {
            href: '/dashboard/opiekun',
            label: 'Dashboard',
            icon: '📊',
            description: 'Panel główny'
        },
        {
            href: '/dashboard/shared_components/profile',
            label: 'Profil',
            icon: '👤',
            description: 'Twój profil'
        },
        {
            href: '/dashboard/shared_components/students_presence',
            label: 'Obecności uczniów',
            icon: '📋',
            description: 'Śledzenie obecności'
        },
        {
            href: '/dashboard/shared_components/grades',
            label: 'Oceny',
            icon: '⭐',
            description: 'Oceny uczniów'
        },
        {
            href: '/dashboard/shared_components/messages',
            label: 'Wiadomości',
            icon: '💬',
            description: 'Komunikacja'
        },
        {
            href: '/dashboard/settings',
            label: 'Ustawienia',
            icon: '⚙️',
            description: 'Ustawienia konta'
        }
    ];

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
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
                            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                            <p className="text-sm text-gray-600 mt-1">Witaj, {user.imie}!</p>
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
                        {menuItems.map((item) => {
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
                        })}
                    </nav>


                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            Zalogowany jako:<br />
                            <strong>{user.email}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}