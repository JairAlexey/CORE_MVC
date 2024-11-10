import { useState } from "react";
import { useMovies } from "../context/MoviesContext";
import { getAllGenres } from "../utils/genres";
import { Button } from "../components/ui";
import { useNavigate } from "react-router-dom";

function CreateMoviePage() {
    const navigate = useNavigate();
    const { createMovie } = useMovies();
    const [errors, setErrors] = useState([]);
    const [newMovie, setNewMovie] = useState({ 
        title: '', 
        overview: '', 
        genre_ids: [], 
        release_date: '', 
        poster_path: '' 
    });

    const handleCreate = async () => {
        try {
            await createMovie(newMovie);
            navigate('/movies', { 
                state: { message: '¡Película creada exitosamente!' }
            });
        } catch (error) {
            if (Array.isArray(error.response?.data)) {
                setErrors(error.response.data);
            } else {
                setErrors([error.response?.data?.message || "Error al crear la película"]);
            }
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)]">
            <h2 className="text-3xl font-bold mb-4">Crear Nueva Película</h2>
            
            {errors.length > 0 && (
                <div className="bg-red-500 text-white p-2 rounded mb-4 w-full">
                    {errors.map((error, i) => (
                        <p key={i} className="text-center">{error}</p>
                    ))}
                </div>
            )}

            <input
                type="text"
                value={newMovie.title}
                onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                className="w-full p-2 border rounded text-black mb-2"
                placeholder="Título"
            />
            <textarea
                value={newMovie.overview}
                onChange={(e) => setNewMovie({ ...newMovie, overview: e.target.value })}
                className="w-full p-2 border rounded text-black mb-2"
                rows="3"
                placeholder="Sinopsis"
            />
            <select
                multiple
                value={newMovie.genre_ids}
                onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                    setNewMovie({ ...newMovie, genre_ids: selectedOptions });
                }}
                className="w-full p-2 border rounded text-black mb-2"
            >
                {getAllGenres().map(genre => (
                    <option key={genre.id} value={genre.id}>
                        {genre.name}
                    </option>
                ))}
            </select>
            <input
                type="date"
                value={newMovie.release_date}
                onChange={(e) => setNewMovie({ ...newMovie, release_date: e.target.value })}
                className="w-full p-2 border rounded text-black mb-2"
            />
            <input
                type="text"
                value={newMovie.poster_path}
                onChange={(e) => setNewMovie({ ...newMovie, poster_path: e.target.value })}
                className="w-full p-2 border rounded text-black mb-2"
                placeholder="URL del póster"
            />
            <Button onClick={handleCreate} className="mt-4">
                Crear Película
            </Button>
        </div>
    );
}

export default CreateMoviePage;