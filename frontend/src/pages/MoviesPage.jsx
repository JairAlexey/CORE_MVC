import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useMovies } from "../context/MoviesContext";
import { Card, Button } from "../components/ui";
import { getGenreNames, getAllGenres } from "../utils/genres";
import { FaSearch } from "react-icons/fa";

function MoviesPage() {
    const location = useLocation();
    const { movies, errors: movieErrors, updateMovie, deleteMovie, loadMovies, createMovie } = useMovies();
    const [editingMovie, setEditingMovie] = useState(null);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [category, setCategory] = useState('popular');
    const [isSearching, setIsSearching] = useState(false);
    const [newMovie, setNewMovie] = useState({
        title: '',
        overview: '',
        genre_ids: [],
        release_date: new Date().toISOString().split('T')[0],
        poster_path: ''
    });

    const categories = [
        { id: 'all', name: 'Todas las Películas' },
        { id: 'top_rated', name: 'Mejor Valoradas' },
        { id: 'upcoming', name: 'Próximos Estrenos' },
        { id: 'now_playing', name: 'En Cines' }
    ];

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const data = await loadMovies(currentPage, category, searchTerm);
                if (data && data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                }
            } catch (error) {
                console.error("Error cargando películas:", error);
            }
        };

        fetchMovies();
    }, [currentPage, category, searchTerm]);

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
            await loadMovies(currentPage, category, searchTerm);
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

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
        setIsSearching(e.target.value !== "");
    };

    const handleCreate = async (movieData) => {
        try {
            const res = await createMovie(movieData);
            setSuccessMessage("¡Película creada exitosamente!");
            await loadMovies();
            return res.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error al crear la película";
            setErrors([errorMessage]);
            throw error;
        }
    };

    return (
        <div className="container mx-auto p-4">
            {successMessage && (
                <div className="bg-green-500 text-white p-2 rounded mb-4 text-center">
                    {successMessage}
                </div>
            )}

            {!isSearching && (
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {categories.map(cat => (
                        <Button
                            key={cat.id}
                            onClick={() => {
                                setCategory(cat.id);
                                setCurrentPage(1);
                                setSearchTerm("");
                            }}
                            className={`px-4 py-2 ${category === cat.id
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            )}

            <div className="flex justify-center mb-4">
                <div className="relative w-1/2">
                    <input
                        type="text"
                        placeholder="Buscar película..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full p-2 pl-10 border-2 rounded-xl bg-[#2B2A2A] text-white placeholder-white focus:border-2 focus:border-white"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
                </div>
            </div>

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
                            src={
                                movie.poster_path && movie.poster_path.startsWith('http')
                                    ? movie.poster_path // Si es un URL completo, úsalo directamente
                                    : `https://image.tmdb.org/t/p/w500${movie.poster_path}` // Si no, usa el prefijo TMDB
                            }
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
                                <input
                                    type="text"
                                    value={editingMovie.poster_path}
                                    onChange={(e) => setEditingMovie({
                                        ...editingMovie,
                                        poster_path: e.target.value
                                    })}
                                    className="w-full p-2 border rounded text-black"
                                    placeholder="URL del póster"
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

            <div className="flex justify-center gap-2 mt-6">
                <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2"
                >
                    Anterior
                </Button>
                <span className="px-4 py-2 bg-gray-700 rounded">
                    Página {currentPage} de {totalPages}
                </span>
                <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2"
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}

export default MoviesPage;