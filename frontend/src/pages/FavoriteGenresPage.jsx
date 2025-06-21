import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, Button, LoadingSpinner } from "../components/ui";
import { useFavoriteGenres } from "../context/FavoriteGenresContext";

function FavoriteGenresPage() {
    const { user } = useAuth();
    const { selectedGenres = [], setSelectedGenres, genres = [], updateFavoriteGenres, errors, clearErrors } = useFavoriteGenres();
    const [loading, setLoading] = useState(true);

    const handleGenreChange = (genreId) => {
        setSelectedGenres((prev) =>
            Array.isArray(prev) && prev.includes(genreId)
                ? prev.filter((id) => id !== genreId)
                : [...(Array.isArray(prev) ? prev : []), genreId]
        );
    };

    const handleSave = async () => {
        clearErrors(); // Limpiar errores antes de guardar
        console.log("Géneros seleccionados:", selectedGenres);
        await updateFavoriteGenres(selectedGenres);
    };

    useEffect(() => {
        // El contexto ya maneja la carga de géneros favoritos
        setLoading(false);
    }, []);

    if (loading) return <LoadingSpinner size="large" text="Cargando géneros..." />;

    if (!genres || genres.length === 0) {
        return <p className="text-center text-white">Cargando géneros...</p>; 
    }

    return (
        <div className="container mx-auto p-4">
            {errors.length > 0 && (
                <div className="bg-red-500 text-white p-2 rounded mb-4">
                    {errors.map((error, i) => (
                        <p key={i} className="text-center">{error}</p>
                    ))}
                </div>
            )}
            <h1 className="text-2xl font-bold mb-4 text-center">Selecciona tus géneros favoritos</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {genres.map((genre) => (
                    <Card key={genre.id} className="flex items-center p-4 bg-zinc-800 rounded-lg shadow-lg">
                        <input
                            type="checkbox"
                            checked={Array.isArray(selectedGenres) && selectedGenres.includes(genre.id)}
                            onChange={() => handleGenreChange(genre.id)}
                            className="form-checkbox h-5 w-5 text-indigo-600"
                        />
                        <label className="ml-2 text-white">{genre.name}</label>
                    </Card>
                ))}
            </div>
            <div className="text-center">
                <Button onClick={handleSave} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                    Guardar
                </Button>
            </div>
        </div>
    );
}

export default FavoriteGenresPage;