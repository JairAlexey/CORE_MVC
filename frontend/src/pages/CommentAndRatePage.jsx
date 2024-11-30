import { useForm } from "react-hook-form";
import { useMovies } from "../context/MoviesContext";
import { Button, Card } from "../components/ui";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

function CommentAndRatePage() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const navigate = useNavigate();
    const { movieId } = useParams();
    const { commentAndRateMovie } = useMovies();
    const [formErrors, setFormErrors] = useState([]);

    const onSubmit = async (data) => {
        const numericRating = Number(data.rating);

        if (isNaN(numericRating)) {
            setFormErrors(["La valoración debe ser un número válido entre 1 y 5."]);
            return;
        }

        try {
            await commentAndRateMovie(movieId, data.comment, numericRating);
            navigate('/movies', { state: { message: '¡Comentario y valoración guardados!' } });
        } catch (error) {
            console.error("Error al comentar y valorar:", error);
            if (error.response) {
                setFormErrors([error.response.data.message || "Error al comentar y valorar la película"]);
            } else {
                setFormErrors(["Error al comentar y valorar la película"]);
            }
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4 text-center">Comentar y Valorar Película</h2>

                {formErrors.length > 0 && (
                    <div className="bg-red-500 text-white p-2 rounded mb-4">
                        {formErrors.map((error, index) => (
                            <p key={index} className="text-center">{error}</p>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tu Comentario
                        </label>
                        <textarea
                            {...register("comment", { required: "El comentario es requerido" })}
                            className="w-full p-3 border rounded bg-zinc-700 border-zinc-600 text-white focus:outline-none focus:border-indigo-500"
                            rows="4"
                            placeholder="Escribe tu opinión sobre la película..."
                        />
                        {errors.comment && <p className="text-red-500 mt-1">{errors.comment.message}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Valoración (1-5 estrellas)
                        </label>
                        <select
                            {...register("rating", { 
                                required: "La valoración es requerida",
                                validate: value => (value >=1 && value <=5) || "La valoración debe estar entre 1 y 5",
                                valueAsNumber: true
                            })}
                            className="w-full p-3 border rounded bg-zinc-700 border-zinc-600 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">Selecciona una valoración</option>
                            {[1, 2, 3, 4, 5].map(num => (
                                <option key={num} value={num}>
                                    {"⭐".repeat(num)} ({num})
                                </option>
                            ))}
                        </select>
                        {errors.rating && <p className="text-red-500 mt-1">{errors.rating.message}</p>}
                    </div>

                    <div className="flex justify-center">
                        <Button type="submit" className="px-8 mt-4">
                            Guardar Comentario y Valoración
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default CommentAndRatePage;