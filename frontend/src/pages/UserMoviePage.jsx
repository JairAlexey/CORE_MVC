import { useState } from "react";
import { useMovies } from "../context/MoviesContext";
import { Card, Button } from "../components/ui";
import { useNavigate } from "react-router-dom";
import { FaSearch } from 'react-icons/fa'; 


function UserMoviesPage() {
    const { movies, markMovieAsWatched, unmarkMovieAsWatched } = useMovies();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const handleMarkAsWatched = async (movieId) => {
        try {
            await markMovieAsWatched(movieId);
            console.log(`Redirigiendo a /movies/${movieId}/comment`);
            navigate(`/movies/${movieId}/comment`);
        } catch (error) {
            console.error("Error al marcar como vista:", error);
        }
    };

    const handleUnmarkAsWatched = async (movieId) => {
        if (window.confirm("¿Estás seguro de que deseas desmarcar esta película como vista? Se eliminarán tus comentarios y valoraciones.")) {
            try {
                await unmarkMovieAsWatched(movieId);
            } catch (error) {
                console.error("Error al desmarcar como vista:", error);
            }
        }
    };

    const handleTitleClick = (movieId) => {
        navigate(`/movies/${movieId}/details`);
    };

    const filteredMovies = movies.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-center mb-4">
                <div className="relative w-1/2">
                    <input
                        type="text"
                        placeholder="Buscar película..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border-2 rounded-xl bg-[#2B2A2A] text-white placeholder-white focus:border-2 focus:border-white"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
                </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMovies.map((movie) => (
                    <Card key={movie.id} className="p-4">
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-auto mb-4"
                        />
                        <div>
                            <h2 
                                className="text-xl font-bold cursor-pointer hover:text-blue-500 transition-colors"
                                onClick={() => handleTitleClick(movie.id)}
                            >
                                {movie.title}
                            </h2>
                            <p className="mt-2">{movie.overview}</p>
                            {movie.watched ? (
                                <>
                                    <p className="text-green-500 mt-2">Vista ✓</p>
                                    {movie.commented ? (
                                        <p className="text-blue-500 mt-2">Comentada y valorada ✓</p>
                                    ) : (
                                        <Button
                                            onClick={() => navigate(`/movies/${movie.id}/comment`)}
                                            className="mt-2 mr-2 bg-blue-500"
                                        >
                                            Comentar y Valorar
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => handleUnmarkAsWatched(movie.id)}
                                        className="mt-2 bg-red-500"
                                    >
                                        Desmarcar como vista
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => handleMarkAsWatched(movie.id)}
                                    className="mt-2"
                                >
                                    Marcar como vista
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default UserMoviesPage;