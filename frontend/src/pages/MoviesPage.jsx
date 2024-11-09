import { useMovies } from "../context/MoviesContext";
import { Card, Button } from "../components/ui";
import { useState } from "react";

function MoviesPage() {
    const { movies, errors: movieErrors, updateMovie } = useMovies();
    const [editingMovie, setEditingMovie] = useState(null);
    const [errors, setErrors] = useState([]);

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
        setErrors([]); // Limpiar errores anteriores
        setEditingMovie({
            ...movie,
            release_date: formatDateForInput(movie.release_date)
        });
    };

    const handleSave = async (movie) => {
        try {
            if (!movie.title.trim()) {
                setErrors(['El título es requerido']);
                return;
            }
            if (!movie.overview.trim()) {
                setErrors(['La sinopsis es requerida']);
                return;
            }
            if (!movie.release_date) {
                setErrors(['La fecha de estreno es requerida']);
                return;
            }
            if (!movie.genre_ids || movie.genre_ids.length === 0) {
                setErrors(['Al menos un género es requerido']);
                return;
            }

            await updateMovie(movie.id, movie);
            setEditingMovie(null);
            setErrors([]);
        } catch (error) {
            setErrors([error.response?.data?.message || "Error al guardar la película"]);
        }
    };

    const handleCancel = () => {
        setEditingMovie(null);
        setErrors([]);
    };

    return (
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
                                <div className="space-y-2">
                                    {errors.map((error, index) => (
                                        <p key={index} className="text-red-500 text-sm">
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
                            <input
                                type="text"
                                value={editingMovie.genre_ids.join(", ")}
                                onChange={(e) => setEditingMovie({
                                    ...editingMovie,
                                    genre_ids: e.target.value.split(",").map(num => parseInt(num.trim()))
                                })}
                                className="w-full p-2 border rounded text-black"
                                placeholder="Géneros (separados por comas)"
                            />
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
                            <p className="mt-2">Fecha de estreno: {formatDate(movie.release_date)}</p>
                            <Button
                                onClick={() => handleEdit(movie)}
                                className="mt-4"
                            >
                                Editar
                            </Button>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}

export default MoviesPage;