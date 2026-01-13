'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function AuthForm({ fields, onSubmit, submitLabel, footer, error: externalError, onErrorClear }) {
    const [values, setValues] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const firstInputRef = useRef(null);

    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (externalError && onErrorClear) {
            onErrorClear();
        }
    };

    const displayError = externalError || error;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await onSubmit(values);
        } catch (err) {
            setError(err.message || 'Wystąpił błąd podczas przetwarzania żądania');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900 to-orange-900 py-12 px-4 sm:px-6 lg:px-8 relative">
            
            <Link 
                href="/" 
                className="absolute top-8 left-8 flex items-center space-x-2 text-orange-300 hover:text-orange-100 transition-colors duration-300 group"
            >
                <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold text-lg">Powrót na stronę główną</span>
            </Link>
            
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">
                        {submitLabel}
                    </h2>
                    <p className="mt-3 text-lg text-orange-200">
                        Wypełnij poniższe pola, aby kontynuować
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-black/80 backdrop-blur-lg border border-orange-500/30 p-8 rounded-3xl shadow-2xl space-y-6">
                    {fields.map((field, index) => (
                        <div key={field.name} className="space-y-2">
                            <label htmlFor={field.name} className="block text-lg font-bold text-orange-300">
                                {field.label}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type={field.type || 'text'}
                                placeholder={`Wprowadź ${field.label.toLowerCase()}`}
                                value={values[field.name] || ''}
                                onChange={handleChange}
                                disabled={isLoading}
                                ref={index === 0 ? firstInputRef : null}
                                className="w-full px-6 py-4 bg-black/70 border-2 border-purple-500/50 text-white placeholder-orange-300/70 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 focus:outline-none transition-all duration-300"
                                required
                            />
                        </div>
                    ))}

                    {displayError && (
                        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-2xl text-center font-semibold">
                            {displayError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-2xl hover:shadow-orange-500/30 transform hover:scale-[1.02]"
                    >
                        {isLoading ? (
                            <svg
                                className="animate-spin h-6 w-6 text-white mr-3"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : null}
                        {isLoading ? 'Przetwarzanie...' : submitLabel}
                    </button>

                    {footer && <div className="mt-6 text-center">{footer}</div>}
                </form>
            </div>
        </div>
    );
}
