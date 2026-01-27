'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BackButton({ 
    href, 
    label = "Powrót", 
    className = "",
    showIcon = true 
}) {
    const router = useRouter();

    const handleBack = () => {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    if (href) {
        return (
            <Link 
                href={href}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors ${className}`}
            >
                {showIcon && (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                )}
                {label}
            </Link>
        );
    }

    return (
        <button 
            onClick={handleBack}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors ${className}`}
        >
            {showIcon && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            )}
            {label}
        </button>
    );
}