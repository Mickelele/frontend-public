'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import '../styles/global.css';
import Navbar from '/components/Navbar';
import Breadcrumb from '/components/Breadcrumb';
import Sidebar from '/app/dashboard/shared_components/components/SideBar';
import { AuthProvider, useAuth } from '/context/AuthContext';

function LayoutContent({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useAuth();
    
    const hideNavbar = pathname?.startsWith('/auth');

    return (
        <>
            {!hideNavbar && (
                <Navbar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            )}
            <Breadcrumb />
            <main className={`min-h-screen bg-gray-50 transition-all duration-300 ease-in-out ${
                isSidebarOpen && user ? 'ml-64' : 'ml-0'
            }`}>
                {children}
            </main>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </>
    );
}

export default function RootLayout({ children }) {
    return (
        <html lang="pl">
        <body>
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
        </body>
        </html>
    );
}