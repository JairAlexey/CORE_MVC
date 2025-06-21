import React from 'react';

const LoadingSpinner = ({ size = "medium", text = "Cargando..." }) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8", 
        large: "w-12 h-12"
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-600 border-t-red-500`}></div>
            {text && (
                <p className="mt-4 text-gray-300 text-center">{text}</p>
            )}
        </div>
    );
};

export default LoadingSpinner; 