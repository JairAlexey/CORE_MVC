import { pool } from "../db.js";
import { fetchMovies } from "../services/movieApiService.js";

export const getAllMovies = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                title, 
                overview, 
                genre_ids,
                TO_CHAR(release_date, 'YYYY-MM-DD') as release_date,
                poster_path 
            FROM movies
        `);
        
        if (result.rowCount === 0) {
            const moviesFromAPI = await fetchMovies();
            
            for (const movie of moviesFromAPI) {
                await pool.query(
                    "INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path) VALUES ($1, $2, $3, $4, $5, $6)",
                    [movie.id, movie.title, movie.overview, movie.genre_ids, movie.release_date, movie.poster_path]
                );
            }
            
            const newResult = await pool.query("SELECT * FROM movies");
            return res.json(newResult.rows);
        }
        
        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener películas" });
    }
};

export const updateMovie = async (req, res) => {
    const { id } = req.params;
    const { title, overview, genre_ids, release_date } = req.body;

    try {
        const result = await pool.query(
            "UPDATE movies SET title = $1, overview = $2, genre_ids = $3, release_date = $4 WHERE id = $5 RETURNING *",
            [title, overview, genre_ids, release_date, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "No existe una película con ese id",
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar la película" });
    }
};