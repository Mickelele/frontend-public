'use client';
import { useAuth } from '/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, requiredRole = null }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
            return;
        }

        if (!loading && user && requiredRole && user.role !== requiredRole) {
            const rolePaths = {
                'administrator': '/dashboard/administrator',
                'nauczyciel': '/dashboard/nauczyciel/attendance',
                'opiekun': '/dashboard/opiekun',
                'uczen': '/dashboard/uczen',
            };

            const userDashboard = rolePaths[user.role] || '/dashboard';
            router.push(userDashboard);
        }
    }, [user, loading, router, requiredRole]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        return null;
    }

    return children;
}