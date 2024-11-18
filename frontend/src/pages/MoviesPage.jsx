import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMovies } from "../context/MoviesContext";
import { Card, Button } from "../components/ui";
import { getGenreNames, getAllGenres } from "../utils/genres";

function MoviesPage() {
    const location = useLocation();
    const { movies, errors: movieErrors, updateMovie, deleteMovie } = useMovies();
    const [editingMovie, setEditingMovie] = useState(null);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const handleEdit = (movie) => {
        setErrors([]);
        setEditingMovie({
            ...movie,
            release_date: formatDateForInput(movie.release_date),
            genre_ids: movie.genre_ids || []
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta película?")) {
            await deleteMovie(id);
        }
    };

    const handleSave = async (movie) => {
        try {
            await updateMovie(movie.id, movie);
            setEditingMovie(null);
            setErrors([]);
            setSuccessMessage("¡Película actualizada exitosamente!");
        } catch (error) {
            if (Array.isArray(error.response?.data)) {
                setErrors(error.response.data);
            } else {
                setErrors([error.response?.data?.message || "Error al actualizar la película"]);
            }
        }
    };

    const handleCancel = () => {
        setEditingMovie(null);
        setErrors([]);
    };

    return (
        <div className="container mx-auto p-4">
            {successMessage && (
                <div className="bg-green-500 text-white p-2 rounded mb-4 text-center">
                    {successMessage}
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movieErrors.length > 0 && (
                    <div className="col-span-full">
                        {movieErrors.map((error, index) => (
                            <p key={index} className="bg-red-500 text-white p-2 text-center mb-2">
                                {error}
                            </p>
                        ))}
                    </div>
                )}

                {movies.map((movie) => (
                    <Card key={movie.id} className="p-4">
                        <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-auto mb-4"
                        />
                        {editingMovie?.id === movie.id ? (
                            <div className="space-y-4">
                                {errors.length > 0 && (
                                    <div className="bg-red-500 text-white p-2 rounded mb-4">
                                        {errors.map((error, index) => (
                                            <p key={index} className="text-center">
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    value={editingMovie.title}
                                    onChange={(e) => setEditingMovie({
                                        ...editingMovie,
                                        title: e.target.value
                                    })}
                                    className="w-full p-2 border rounded text-black"
                                    placeholder="Título"
                                />
                                <textarea
                                    value={editingMovie.overview}
                                    onChange={(e) => setEditingMovie({
                                        ...editingMovie,
                                        overview: e.target.value
                                    })}
                                    className="w-full p-2 border rounded text-black"
                                    rows="3"
                                    placeholder="Sinopsis"
                                />
                                <select
                                    multiple
                                    value={editingMovie.genre_ids}
                                    onChange={(e) => {
                                        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                        setEditingMovie({
                                            ...editingMovie,
                                            genre_ids: selectedOptions
                                        });
                                    }}
                                    className="w-full p-2 border rounded text-black"
                                >
                                    {getAllGenres().map(genre => (
                                        <option key={genre.id} value={genre.id}>
                                            {genre.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={editingMovie.release_date}
                                    onChange={(e) => setEditingMovie({
                                        ...editingMovie,
                                        release_date: e.target.value
                                    })}
                                    className="w-full p-2 border rounded text-black"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave(editingMovie)}>
                                        Guardar
                                    </Button>
                                    <Button onClick={handleCancel} className="bg-gray-500">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-bold">{movie.title}</h2>
                                <p className="mt-2">{movie.overview}</p>
                                <p className="mt-2">Géneros: {getGenreNames(movie.genre_ids)}</p>
                                <p className="mt-2">Fecha de estreno: {formatDate(movie.release_date)}</p>
                                <Button
                                    onClick={() => handleEdit(movie)}
                                    className="mt-4 mr-2"
                                >
                                    Editar
                                </Button>
                                <Button
                                    onClick={() => handleDelete(movie.id)}
                                    className="mt-4 bg-red-500"
                                >
                                    Eliminar
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default MoviesPage;