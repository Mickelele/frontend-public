'use client';
import { useState } from 'react';
import '../styles/global.css';
import Navbar from '/components/Navbar';
import Sidebar from '/components/Sidebar';
import { AuthProvider } from '/context/AuthContext';

export default function RootLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <html lang="pl">
        <body>
        <AuthProvider>
            <Navbar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
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