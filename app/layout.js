'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import '../styles/global.css';
import Navbar from '/components/Navbar';
import Sidebar from '/app/dashboard/shared_components/components/SideBar';
import { AuthProvider } from '/context/AuthContext';

export default function RootLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    
    // Ukryj navbar na stronach autoryzacji
    const hideNavbar = pathname?.startsWith('/auth');

    return (
        <html lang="pl">
        <body>
        <AuthProvider>
            {!hideNavbar && (
                <Navbar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            )}
            <main className="min-h-screen bg-gray-50">
                {children}
            </main>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </AuthProvider>
        </body>
        </html>
    );
}