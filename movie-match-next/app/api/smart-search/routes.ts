import { NextResponse } from 'next/server';
import { searchMovies } from '../../../../src/services/movieApiService';
import { headers } from 'next/headers';

interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    try {
        const headersList = await headers();
        const authHeader = headersList.get('authorization')?.toLowerCase();
        
        if (!authHeader?.startsWith('bearer ')) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const movieResults = await searchMovies(query);
        
        if (!movieResults?.results) {
            return NextResponse.json({ results: [] });
        }
        const filteredMovies = movieResults.results
            .filter((movie: Movie) => movie.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map((movie: Movie) => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null,
                vote_average: movie.vote_average
            }));

        return NextResponse.json({ results: filteredMovies });
        
    } catch (error) {
        console.error('Error en smart-search:', error);
        return NextResponse.json(
            { error: 'Error en la búsqueda' },
            { status: 500 }
        );
    }
}