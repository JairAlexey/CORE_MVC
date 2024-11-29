import { useEffect } from "react";
import { Button, Card } from "../components/ui";
import { useFavoriteGenres } from "../context/FavoriteGenresContext";

function FavoriteGenresPage() {
    const { selectedGenres, setSelectedGenres, genres, updateFavoriteGenres } = useFavoriteGenres();

    const handleGenreChange = (genreId) => {
        setSelectedGenres((prev) =>
            prev.includes(genreId)
                ? prev.filter((id) => id !== genreId)
                : [...prev, genreId]
        );
    };

    const handleSave = async () => {
        try {
            await updateFavoriteGenres(selectedGenres);
        } catch (error) {
            console.error("Error al actualizar géneros favoritos:", error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Selecciona tus géneros favoritos</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {genres.map((genre) => (
                    <Card key={genre.id} className="flex items-center p-4 bg-zinc-800 rounded-lg shadow-lg">
                        <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre.id)}
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