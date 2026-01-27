'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '/context/AuthContext';

export default function Breadcrumb() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!pathname || pathname === '/' || pathname.startsWith('/auth') || !user) {
        return null;
    }

    const pathMapping = {
        'dashboard': 'Panel główny',
        'administrator': 'Administrator',
        'nauczyciel': 'Nauczyciel',
        'opiekun': 'Opiekun',
        'uczen': 'Uczeń',
        'shared_components': 'Wspólne',

        'users': 'Użytkownicy',
        'courses': 'Kursy i grupy',
        'substitutions': 'Zastępstwa',
        'rankings': 'Rankingi',
        'quiz': 'Quizy',
        'technical': 'Zgłoszenia techniczne',
        'prizes': 'Nagrody',


        'attendance': 'Obecności',
        'worktime': 'Czas pracy',
        'substitutes': 'Zastępstwa',
        'homework': 'Zadania domowe',
        'reports': 'Raporty semestralne',

      
        'zajecia': 'Zajęcia',
        'uwagi': 'Uwagi',
        'quizy': 'Quizy',

       
        'grades': 'Moje oceny',
        'historiazajec': 'Zajęcia',
        'raport': 'Mój raport',
        'todolist': 'Lista ToDo',

      
        'profile': 'Profil',
        'students_presence': 'Obecności uczniów',

     
        'create': 'Utwórz nowy',
        'edit': 'Edytuj',
        'questions': 'Pytania',
        'groups': 'Grupy',
        'forgot-password': 'Resetuj hasło',
        'reset-password': 'Ustaw nowe hasło',
        'login': 'Logowanie',
        'register': 'Rejestracja'
    };


    const getReadableName = (segment, index) => {
        
        if (/^\d+$/.test(segment)) {
            
            const prevSegment = pathSegments[index - 1];
            if (prevSegment === 'quiz') return `Quiz #${segment}`;
            if (prevSegment === 'courses') return `Kurs #${segment}`;
            if (prevSegment === 'groups') return `Grupa #${segment}`;
            return `#${segment}`;
        }
        
        return pathMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    };

    
    const getRoleLink = (role) => {
        const firstRoutes = {
            'administrator': '/dashboard/administrator/users',
            'nauczyciel': '/dashboard/nauczyciel/attendance',
            'opiekun': '/dashboard/opiekun',
            'uczen': '/dashboard/uczen'
        };
        return firstRoutes[role] || '/dashboard';
    };

    
    const pathSegments = pathname.split('/').filter(segment => segment !== '' && segment !== 'dashboard');
    
    
    const breadcrumbItems = pathSegments.map((segment, index) => {
        let path;
        const isLast = index === pathSegments.length - 1;
        const name = getReadableName(segment, index);
        
        
        if (['administrator', 'nauczyciel', 'opiekun', 'uczen'].includes(segment)) {
            path = getRoleLink(segment);
        } else {
            path = '/dashboard/' + pathSegments.slice(0, index + 1).join('/');
        }

        return {
            name,
            path,
            isLast,
            isRole: ['administrator', 'nauczyciel', 'opiekun', 'uczen'].includes(segment)
        };
    });

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center space-x-2 text-sm">
                    
                    <Link 
                        href={user ? getRoleLink(user.role) : "/dashboard"} 
                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                    </Link>

                    
                    {breadcrumbItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                           
                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>

                          
                            {item.isLast ? (
                                <span className="text-gray-600 font-medium truncate max-w-48">
                                    {item.name}
                                </span>
                            ) : (
                                <Link 
                                    href={item.path}
                                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate max-w-32"
                                >
                                    {item.name}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

               
                <div className="mt-1 text-xs text-gray-500">
                    {user && (
                        <span>
                            Zalogowany jako: <strong>{user.imie} {user.nazwisko}</strong> 
                            <span className="mx-2">•</span>
                            Rola: <strong className="capitalize">{user.role}</strong>
                        </span>
                    )}
                </div>
            </div>
        </nav>
    );
}