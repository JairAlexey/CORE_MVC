import { useForm } from "react-hook-form";
import { useMovies } from "../context/MoviesContext";
import { Button, Card } from "../components/ui";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getAllGenres } from "../utils/genres";

function CreateMoviePage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { createMovie } = useMovies();
    const [formErrors, setFormErrors] = useState([]);
    const genres = getAllGenres();

    const onSubmit = async (data) => {
        const genreIds = data.genre_ids.map(id => parseInt(id, 10));

        const movieData = {
            ...data,
            genre_ids: genreIds
        };

        try {
            setFormErrors([]);
            await createMovie(movieData);
            navigate('/movies', { state: { message: '¡Película creada exitosamente!' } });
        } catch (error) {
            if (Array.isArray(error.response?.data)) {
                setFormErrors(error.response.data);
            } else {
                setFormErrors([error.response?.data?.message || "Error al actualizar la película"]);
            }
        }
    };

    return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md p-6">
                <h2 className="text-3xl font-bold mb-4 text-center">Crear Nueva Película</h2>

                {formErrors.length > 0 && (
                    <div className="bg-red-500 text-white p-2 rounded mb-4">
                        {formErrors.map((error, index) => (
                            <p key={index} className="text-center">{error}</p>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <input
                        type="text"
                        {...register("title", { required: "El título es requerido" })}
                        className="w-full p-2 rounded bg-zinc-800 text-white mb-2 outline-none focus:ring-2 focus:ring-white"
                        placeholder="Título"
                    />
                    {errors.title && <p className="text-red-500">{errors.title.message}</p>}

                    <textarea
                        {...register("overview", { required: "La sinopsis es requerida" })}
                        className="w-full p-2 rounded bg-zinc-800 text-white mb-2 outline-none focus:ring-2 focus:ring-white"
                        rows="3"
                        placeholder="Sinopsis"
                    />
                    {errors.overview && <p className="text-red-500">{errors.overview.message}</p>}

                    <input
                        type="date"
                        {...register("release_date", { required: "La fecha de estreno es requerida" })}
                        className="w-full p-2 rounded bg-zinc-800 text-white mb-2 outline-none focus:ring-2 focus:ring-white"
                    />
                    {errors.release_date && <p className="text-red-500">{errors.release_date.message}</p>}

                    <input
                        type="text"
                        {...register("poster_path", { required: "El URL es requerido" })}
                        className="w-full p-2 rounded bg-zinc-800 text-white mb-2 outline-none focus:ring-2 focus:ring-white"
                        placeholder="URL del póster"
                    />
                    {errors.poster_path && <p className="text-red-500">{errors.poster_path.message}</p>}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Géneros
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <label key={genre.id} className="flex items-center text-white">
                                    <input
                                        type="checkbox"
                                        value={genre.id}
                                        {...register("genre_ids", { 
                                            validate: value => value.length > 0 || "Debes seleccionar al menos un género"
                                        })}
                                        className="form-checkbox h-5 w-5 text-indigo-600"
                                    />
                                    <span className="ml-2">{genre.name}</span>
                                </label>
                            ))}
                        </div>
                        {errors.genre_ids && <p className="text-red-500">{errors.genre_ids.message}</p>}
                    </div>

                    <div className="flex justify-center">
                        <Button type="submit" className="px-8 mt-4">
                            Crear Película
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default CreateMoviePage;