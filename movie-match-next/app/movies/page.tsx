'use client';
import { useEffect, useState } from 'react';
import MovieList from '../components/MovieList';

export default function MoviesPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            } else {
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <main className="min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Películas</h1>
            <MovieList />
        </main>
    );
}