import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-10 h-10 border-3',
        lg: 'w-16 h-16 border-4',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div
                className={`${sizeClasses[size]} rounded-full border-slate-700 border-t-primary-500 animate-spin`}
            />
            {message && <p className="text-slate-400 text-sm">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
