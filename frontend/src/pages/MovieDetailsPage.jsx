import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMovies } from '../context/MoviesContext';
import Card from '../components/ui/Card';
import { getGenreNames } from '../utils/genres';

function MovieDetailsPage() {
    const { movieId } = useParams();
    const [movieDetails, setMovieDetails] = useState(null);
    const { getMovieDetails } = useMovies();

    useEffect(() => {
        const loadMovieDetails = async () => {
            try {
                const details = await getMovieDetails(movieId);
                setMovieDetails(details);
            } catch (error) {
                console.error("Error al cargar detalles:", error);
            }
        };
        loadMovieDetails();
    }, [movieId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!movieDetails) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="max-w-6xl mx-auto">
                <Card className="bg-zinc-800 rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/3">
                            <img
                                src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                                alt={movieDetails.title}
                                className="w-full h-auto"
                            />
                        </div>
                        <div className="md:w-2/3 p-6">
                            <h1 className="text-3xl font-bold mb-4">{movieDetails.title}</h1>
                            <p className="text-gray-300 mb-4">{movieDetails.overview}</p>
                            <p className="text-gray-300 mb-4">Géneros: {getGenreNames(movieDetails.genre_ids)}</p>
                            <p className="text-gray-300 mb-4">Fecha de estreno: {formatDate(movieDetails.release_date)}</p>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    {movieDetails.user_comment && (
                        <Card className="bg-zinc-800 rounded-lg p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">Tu Comentario</h2>
                            <p className="text-gray-200">{movieDetails.user_comment.comment}</p>
                            <p className="text-yellow-400">Valoración: {"⭐".repeat(movieDetails.user_comment.rating)}</p>
                        </Card>
                    )}

                    <Card className="bg-zinc-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Comentarios de otros usuarios</h2>
                        <div className="space-y-4">
                            {movieDetails.comments.map((comment) => (
                                <div key={comment.user_id} className="bg-zinc-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <img
                                                src={comment.user_gravatar}
                                                alt={comment.user_name}
                                                className="h-8 w-8 rounded-full mr-2"
                                            />
                                            <span className="text-white">{comment.user_name}</span>
                                        </div>
                                        <span className="text-gray-400">
                                            {formatDate(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-gray-200">{comment.comment}</p>
                                    <p className='mt-2'>{"⭐".repeat(comment.rating)}</p>
                                </div>
                            ))}
                            {(!movieDetails.comments || movieDetails.comments.length === 0) && (
                                <p className="text-gray-400 text-center">
                                    Aún no hay comentarios para esta película
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default MovieDetailsPage;