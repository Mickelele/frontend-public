import '../styles/global.css';
import Navbar from '/components/Navbar';
import { AuthProvider } from '/context/AuthContext';

export const metadata = {
    title: 'Moja aplikacja',
    description: 'System logowania i profilu użytkownika',
};

export default function RootLayout({ children }) {
    return (
        <html lang="pl">
        <body>
        <AuthProvider>
            <Navbar />
            <main className="p-6">{children}</main>
        </AuthProvider>
        </body>
        </html>
    );
}
