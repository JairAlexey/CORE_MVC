import { useState, useEffect } from "react";
import { useMovies } from "../context/MoviesContext";
import { Card } from "../components/ui";
import { getGenreNames } from "../utils/genres";

function UserMoviesPage() {
    const { movies } = useMovies();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="container mx-auto p-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie) => (
                    <Card key={movie.id} className="p-4">
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-auto mb-4"
                        />
                        <div>
                            <h2 className="text-xl font-bold">{movie.title}</h2>
                            <p className="mt-2">{movie.overview}</p>
                            <p className="mt-2">Géneros: {getGenreNames(movie.genre_ids)}</p>
                            <p className="mt-2">Fecha de estreno: {formatDate(movie.release_date)}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default UserMoviesPage;