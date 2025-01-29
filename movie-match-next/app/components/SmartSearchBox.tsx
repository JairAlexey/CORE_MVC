'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { movieApi } from '../api/movies';

interface Movie {
    id: number;
    title: string;
    poster_path: string;
    vote_average: number;
}

export default function SmartSearchBox() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    useEffect(() => {
        const searchMovies = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await movieApi.getAllMovies(1, 'all');
                const movies = response.movies || [];
                const filteredMovies = movies
                    .filter((movie: Movie) => 
                        movie.title.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 10);

                setResults(filteredMovies);
            } catch (error) {
                console.error('Error en la búsqueda:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimeout = setTimeout(searchMovies, 300);
        return () => clearTimeout(debounceTimeout);
    }, [query]);

    return (
        <div className="flex justify-center mb-4">
            <div className="relative w-1/2">
                <input
                    type="text"
                    placeholder="Buscar película..."
                    value={query}
                    onChange={handleSearch}
                    className="w-full p-2 pl-10 border-2 rounded-xl bg-[#2B2A2A] text-white placeholder-white focus:border-2 focus:border-white"
                />
                <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                </svg>
                
                {isLoading && (
                    <div className="absolute right-3 top-3">
                        <div className="animate-spin h-5 w-5 border-2 border-red-500 rounded-full border-t-transparent"></div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700">
                        {results.map((movie) => (
                            <div
                                key={movie.id}
                                onClick={() => router.push(`/movies/${movie.id}`)}
                                className="flex items-center p-2 hover:bg-gray-800 cursor-pointer"
                            >
                                {movie.poster_path && (
                                    <div className="relative w-[40px] h-[60px]">
                                        <Image
                                            src={movie.poster_path}
                                            alt={movie.title}
                                            fill
                                            sizes="40px"
                                            className="rounded object-cover"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="ml-2">
                                    <p className="text-white">{movie.title}</p>
                                    <p className="text-sm text-gray-400">
                                        ⭐ {movie.vote_average?.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 