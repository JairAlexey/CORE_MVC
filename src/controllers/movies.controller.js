import { pool } from "../db.js";
import { fetchMovies, fetchAllMovies, searchMovies } from "../services/movieApiService.js";


export const createMovie = async (req, res) => {
    const { title, overview, genre_ids, release_date, poster_path } = req.body;

    try {
        // Verificar si la película ya existe
        const existingMovie = await pool.query(
            "SELECT * FROM movies WHERE title = $1",
            [title]
        );

        if (existingMovie.rowCount > 0) {
            return res.status(409).json({ 
                message: "Ya existe una película con ese título"
            });
        }

        // Generar un ID único para la película
        const maxIdResult = await pool.query("SELECT MAX(id) FROM movies");
        const newId = (maxIdResult.rows[0].max || 0) + 1;

        // Validar y formatear la fecha
        let formattedDate = null;
        if (release_date) {
            formattedDate = new Date(release_date).toISOString().split('T')[0];
            // Verificar si la fecha es válida
            if (formattedDate === 'Invalid Date') {
                return res.status(400).json({ 
                    message: "Formato de fecha inválido. Use YYYY-MM-DD"
                });
            }
        }

        // Insertar la nueva película con is_modified en true
        const result = await pool.query(
            `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path, is_modified) 
                VALUES ($1, $2, $3, $4, $5, $6, TRUE) 
             RETURNING *`,
            [newId, title, overview, genre_ids || [], formattedDate, poster_path]
        );

        // Devolver la película creada
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error detallado:", error);
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
            "UPDATE movies SET title = $1, overview = $2, genre_ids = $3, release_date = $4, is_modified = TRUE WHERE id = $5 RETURNING *",
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
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category || 'popular';
    const searchTerm = req.query.search || '';

    try {
        // Primero, obtener películas de la base de datos local
        let localMovies = [];
        if (searchTerm) {
            const localResult = await pool.query(
                `SELECT * FROM movies 
                WHERE title ILIKE $1 
                AND id NOT IN (SELECT id FROM deleted_movies)`,
                [`%${searchTerm}%`]
            );
            localMovies = localResult.rows;
        }

        // Luego obtener películas de la API externa
        let moviesFromAPI;
        if (searchTerm && searchTerm.length > 0) {
            moviesFromAPI = await searchMovies(searchTerm, page);
        } else if (category === 'all') {
            moviesFromAPI = await fetchAllMovies(page);
        } else {
            moviesFromAPI = await fetchMovies(page, category);
        }

        // Combinar resultados
        let allMovies = [...localMovies];
        if (moviesFromAPI && moviesFromAPI.results) {
            allMovies = [...allMovies, ...moviesFromAPI.results];
        }

        // Obtener IDs de películas eliminadas
        const deletedMoviesResult = await pool.query("SELECT id FROM deleted_movies");
        const deletedMovieIds = new Set(deletedMoviesResult.rows.map(row => row.id));

        // Filtrar películas eliminadas
        const filteredMovies = allMovies.filter(movie => !deletedMovieIds.has(movie.id));

        // Obtener información de usuario para las películas
        const result = await pool.query(`
            SELECT 
                m.*,
                um.watched,
                um.comment IS NOT NULL as commented,
                um.rating
            FROM movies m
            LEFT JOIN user_movies um ON m.id = um.movie_id AND um.user_id = $1
            WHERE m.id = ANY($2::int[])
            ORDER BY array_position($2::int[], m.id)
        `, [userId, filteredMovies.map(m => m.id)]);

        return res.json({
            movies: result.rows,
            pagination: {
                currentPage: page,
                totalPages: moviesFromAPI ? moviesFromAPI.totalPages : 1
            }
        });

    } catch (error) {
        console.error('Error en getAllMovies:', error);
        return res.status(500).json({ 
            message: "Error al obtener películas",
            error: error.message 
        });
    }
};

export const deleteMovie = async (req, res) => {
    const { id } = req.params;

    try {
        // Iniciar transacción
        await pool.query('BEGIN');

        // Eliminar registros relacionados en user_movies
        await pool.query("DELETE FROM user_movies WHERE movie_id = $1", [id]);
        
        // Eliminar la película
        const result = await pool.query("DELETE FROM movies WHERE id = $1", [id]);

        // Registrar la película como eliminada
        await pool.query(
            "INSERT INTO deleted_movies (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
            [id]
        );

        if (result.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                message: "No existe una película con ese id",
            });
        }

        // Confirmar transacción
        await pool.query('COMMIT');

        return res.sendStatus(204);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar la película" });
    }
};


//Usuario funciones para manejar las acciones de marcar una película como vista, comentar y valorar.

export const markMovieAsWatched = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.userId;

    try {
        const result = await pool.query(
            "INSERT INTO user_movies (user_id, movie_id, watched) VALUES ($1, $2, TRUE) ON CONFLICT (user_id, movie_id) DO UPDATE SET watched = TRUE RETURNING *",
            [userId, movieId]
        );
        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al marcar la película como vista" });
    }
};

export const unmarkMovieAsWatched = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.userId;

    try {
        const result = await pool.query(
            "DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 RETURNING *",
            [userId, movieId]
        );
        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al desmarcar la película como vista" });
    }
};

export const commentAndRateMovie = async (req, res) => {
    const { movieId } = req.params;
    const { comment, rating } = req.body;
    const userId = req.userId;

    try {
        const result = await pool.query(
            "UPDATE user_movies SET comment = $1, rating = $2 WHERE user_id = $3 AND movie_id = $4 AND watched = TRUE RETURNING *",
            [comment, rating, userId, movieId]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: "Debes marcar la película como vista antes de comentar o valorar" });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al comentar o valorar la película" });
    }
};

export const getMovieDetails = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.userId;

    try {
        // Verificar si la película existe
        const movieExists = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        
        if (movieExists.rowCount === 0) {
            return res.status(404).json({ message: "Película no encontrada" });
        }

        // Obtener detalles de la película y todos los comentarios
        const result = await pool.query(`
            SELECT 
                m.*,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'user_id', um.user_id,
                            'comment', um.comment,
                            'rating', um.rating,
                            'created_at', um.created_at,
                            'user_name', u.name,
                            'user_gravatar', u.gravatar
                        )
                    )
                    FROM user_movies um
                    JOIN users u ON um.user_id = u.id
                    WHERE um.movie_id = m.id),
                    '[]'
                ) as comments,
                (
                    SELECT json_build_object(
                        'comment', my_um.comment,
                        'rating', my_um.rating,
                        'created_at', my_um.created_at,
                        'user_name', u.name,
                        'user_gravatar', u.gravatar
                    )
                    FROM user_movies my_um
                    JOIN users u ON my_um.user_id = u.id
                    WHERE my_um.movie_id = m.id AND my_um.user_id = $1
                ) as user_comment
            FROM movies m
            WHERE m.id = $2
        `, [userId, movieId]);

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener detalles de la película:', error);
        return res.status(500).json({ message: "Error al obtener detalles de la película" });
    }
};