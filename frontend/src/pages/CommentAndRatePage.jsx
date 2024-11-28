import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMovies } from "../context/MoviesContext";
import { Card, Button } from "../components/ui";
import { getGenreNames } from "../utils/genres";

function CommentAndRatePage() {
    const { movieId } = useParams();
    const { movies, commentAndRateMovie, setMovies } = useMovies();
    const movie = movies.find(m => m.id === parseInt(movieId));
    const [comment, setComment] = useState("");
    const [rating, setRating] = useState(1);
    const navigate = useNavigate();

    const handleCommentAndRate = async () => {
        try {
            await commentAndRateMovie(movieId, comment, rating);
            const updatedMovies = movies.map(m => 
                m.id === parseInt(movieId) ? { ...m, commented: true } : m
            );
            setMovies(updatedMovies);
            navigate('/movies', { state: { message: '¡Comentario y valoración guardados!' } });
        } catch (error) {
            console.error("Error al comentar y valorar:", error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
            <div className="max-w-4xl w-full bg-zinc-800 rounded-lg shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Columna de la imagen */}
                    <div className="md:w-1/2">
                        <img
                            src={
                                movie.poster_path && movie.poster_path.startsWith('http')
                                    ? movie.poster_path // Si es un URL completo, úsalo directamente
                                    : `https://image.tmdb.org/t/p/w500${movie.poster_path}` // Si no, usa el prefijo TMDB
                            }
                            alt={movie.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Columna del formulario */}
                    <div className="md:w-1/2 p-6">
                        <h2 className="text-2xl font-bold mb-4">{movie.title}</h2>
                        <p className="text-gray-300 mb-4">{movie.overview}</p>
                        <p className="text-gray-300 mb-4">Géneros: {getGenreNames(movie.genre_ids)}</p>
                        <p className="text-sm text-gray-300">
                            Recomendado por: {Array.isArray(movie.recommenders) ? movie.recommenders.join(', ') : 'Desconocido'}
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tu comentario
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full p-3 border rounded bg-zinc-700 border-zinc-600 text-white focus:outline-none focus:border-indigo-500"
                                    rows="4"
                                    placeholder="Escribe tu opinión sobre la película..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Valoración (1-5 estrellas)
                                </label>
                                <select
                                    value={rating}
                                    onChange={(e) => setRating(Number(e.target.value))}
                                    className="w-full p-3 border rounded bg-zinc-700 border-zinc-600 text-white focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <option key={num} value={num}>
                                            {"⭐".repeat(num)} ({num})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button 
                                onClick={handleCommentAndRate} 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded transition duration-300"
                            >
                                Guardar Comentario y Valoración
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommentAndRatePage;