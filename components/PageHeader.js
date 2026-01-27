'use client';
import BackButton from './BackButton';

export default function PageHeader({ 
    title, 
    description, 
    showBackButton = false, 
    backButtonHref, 
    backButtonLabel = "Powrót",
    actions,
    children 
}) {
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
            <div className="max-w-7xl mx-auto">
               
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                       
                        {showBackButton && (
                            <div className="mb-3">
                                <BackButton 
                                    href={backButtonHref}
                                    label={backButtonLabel}
                                />
                            </div>
                        )}
                        
                       
                        <h1 className="text-2xl font-bold text-gray-900 sm:truncate">
                            {title}
                        </h1>
                        
                       
                        {description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {description}
                            </p>
                        )}
                    </div>
                    
                   
                    {actions && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            {actions}
                        </div>
                    )}
                </div>
                
                
                {children && (
                    <div className="mt-4">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}