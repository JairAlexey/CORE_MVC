import { pool } from "../db.js";
import { fetchMovies } from "../services/movieApiService.js";


export const createMovie = async (req, res) => {
    const { title, overview, genre_ids, release_date, poster_path } = req.body;

    try {
        console.log("Datos recibidos:", { title, overview, genre_ids, release_date, poster_path });
        
        const result = await pool.query(
            "INSERT INTO movies (title, overview, genre_ids, release_date, poster_path) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, overview, genre_ids, release_date, poster_path]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error detallado:", error);
        
        if (error.code === '23505') {
            return res.status(409).json({ 
                message: "Ya existe una película con ese título"
            });
        }
        
        return res.status(500).json({ 
            message: "Error al crear la película",
            error: error.message 
        });
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
                message: "No existe una película con ese id"
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ 
                message: "Ya existe una película con ese título"
            });
        }
        
        return res.status(500).json({ 
            message: "Error al actualizar la película",
            error: error.message 
        });
    }
};


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

export const deleteMovie = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM movies WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "No existe una película con ese id",
            });
        }

        return res.sendStatus(204); // No content
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar la película" });
    }
};