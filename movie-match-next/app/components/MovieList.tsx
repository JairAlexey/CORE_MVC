'use client';
import { useState, useEffect } from 'react';
import { movieApi } from '../api/movies';

export default function MovieList() {
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await movieApi.getAllMovies();
                const movieArray = response.movies || response.data || [];
                setMovies(Array.isArray(movieArray) ? movieArray : []);
            } catch (err) {
                console.error('Error detallado:', err);
                setError('Error al cargar las películas');
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) return <div>Cargando...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!movies.length) return <div>No hay películas disponibles</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {movies.map((movie) => (
                <div key={movie.id} className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-bold text-white">{movie.title}</h2>
                    <p className="text-gray-400">{movie.overview}</p>
                    {movie.poster_path && (
                        <img 
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-auto mt-4 rounded"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}