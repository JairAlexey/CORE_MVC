import { pool } from "../db.js";
import { fetchMovies, fetchAllMovies, searchMovies, fetchMovieDetails } from "../services/movieApiService.js";
import fetch from 'node-fetch';

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
            if (formattedDate === 'Invalid Date') {
                return res.status(400).json({
                    message: "Formato de fecha inválido. Use YYYY-MM-DD"
                });
            }
        }

        // Validar poster_path (URL de la imagen)
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/; // Verifica que sea un URL válido
        const relativePathRegex = /^\/[a-zA-Z0-9_-]+\.(jpeg|jpg|png|gif|bmp|webp)$/; // Verifica que sea una ruta relativa válida

        if (poster_path && (!urlRegex.test(poster_path) && !relativePathRegex.test(poster_path))) {
            return res.status(400).json({
                message: "El link del poster_path debe ser un URL válido o una ruta relativa válida que apunte a una imagen (.jpg, .png, etc.)"
            });
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
    const { title, overview, genre_ids, release_date, poster_path } = req.body;

    try {
        await pool.query("BEGIN");

        // Verificar si la película ya está en la base de datos
        const movieExists = await pool.query(
            "SELECT * FROM movies WHERE id = $1",
            [id]
        );

        if (movieExists.rowCount === 0) {
            // Si no existe, la insertamos como una película modificada
            const result = await pool.query(
                `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path, is_modified) 
                VALUES ($1, $2, $3, $4, $5, $6, TRUE) 
                RETURNING *`,
                [id, title, overview, genre_ids, release_date, poster_path]
            );
            await pool.query("COMMIT");
            return res.json(result.rows[0]);
        }

        // Si existe, la actualizamos y marcamos como modificada
        const result = await pool.query(
            `UPDATE movies 
            SET title = $1, 
                overview = $2, 
                genre_ids = $3, 
                release_date = $4, 
                poster_path = $5,
                is_modified = TRUE
            WHERE id = $6 
            RETURNING *`,
            [title, overview, genre_ids, release_date, poster_path, id]
        );

        await pool.query("COMMIT");
        return res.json(result.rows[0]);
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error al actualizar la película:", error);
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
        // Primero, obtener películas locales
        let localMovies = await pool.query(
            "SELECT * FROM movies WHERE is_modified = TRUE"
        );

        // Obtener películas de la API externa
        let moviesFromAPI;
        if (searchTerm && searchTerm.length > 0) {
            moviesFromAPI = await searchMovies(searchTerm, page);
        } else if (category === 'all') {
            moviesFromAPI = await fetchAllMovies(page);
        } else {
            moviesFromAPI = await fetchMovies(page, category);
        }

        // Obtener IDs de películas eliminadas
        const deletedMovies = await pool.query("SELECT id FROM deleted_movies");
        const deletedIds = new Set(deletedMovies.rows.map(m => m.id));

        // Crear un Map con las películas locales para fácil acceso
        const localMoviesMap = new Map(localMovies.rows.map(m => [m.id, m]));

        // Combinar y filtrar resultados
        let allMovies = [];

        // Agregar películas de la API que no están eliminadas ni modificadas
        if (moviesFromAPI && moviesFromAPI.results) {
            allMovies = moviesFromAPI.results
                .filter(movie => !deletedIds.has(movie.id))
                .map(movie => localMoviesMap.has(movie.id) ? localMoviesMap.get(movie.id) : movie);
        }

        // Agregar películas locales que no están en la API
        localMovies.rows.forEach(localMovie => {
            if (!allMovies.some(m => m.id === localMovie.id)) {
                allMovies.push(localMovie);
            }
        });

        return res.json({
            movies: allMovies,
            pagination: {
                currentPage: moviesFromAPI.currentPage,
                totalPages: moviesFromAPI.totalPages
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
        // Primero eliminamos las referencias en otras tablas
        await pool.query("BEGIN");

        // Eliminar referencias en user_movies
        await pool.query("DELETE FROM user_movies WHERE movie_id = $1", [id]);

        // Eliminar referencias en movie_recommendations
        await pool.query("DELETE FROM movie_recommendations WHERE movie_id = $1", [id]);

        // Agregar a deleted_movies si no existe
        await pool.query(
            "INSERT INTO deleted_movies (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
            [id]
        );

        // Si existe en movies, eliminarla
        await pool.query("DELETE FROM movies WHERE id = $1", [id]);

        await pool.query("COMMIT");

        return res.json({ message: "Película eliminada exitosamente" });
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error al eliminar la película:", error);
        return res.status(500).json({
            message: "Error al eliminar la película",
            error: error.message
        });
    }
};

//Usuario funciones para manejar las acciones de marcar una película como vista, comentar y valorar.

export const markMovieAsWatched = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.userId;

    try {
        await pool.query('BEGIN');

        // Verificar si la película existe en la base de datos local
        let movieExists = await pool.query(
            "SELECT * FROM movies WHERE id = $1",
            [movieId]
        );

        // Si no existe en la base local, intentar obtener de TMDB
        if (movieExists.rowCount === 0) {
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&language=es-ES`
                );

                if (!response.ok) {
                    throw new Error(`Error TMDB: ${response.status}`);
                }

                const movieData = await response.json();

                // Insertar la película en la base de datos local
                const insertResult = await pool.query(
                    `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        movieId,
                        movieData.title,
                        movieData.overview || '',
                        movieData.genres ? movieData.genres.map(g => g.id) : [],
                        movieData.release_date || null,
                        movieData.poster_path || null
                    ]
                );
                movieExists = insertResult;
            } catch (error) {
                console.error('Error al obtener datos de TMDB:', error);
                await pool.query('ROLLBACK');
                return res.status(500).json({
                    message: "Error al obtener detalles de la película de TMDB"
                });
            }
        }

        // Marcar como vista
        const result = await pool.query(
            `INSERT INTO user_movies (user_id, movie_id, watched) 
            VALUES ($1, $2, TRUE) 
            ON CONFLICT (user_id, movie_id) 
            DO UPDATE SET watched = TRUE
            RETURNING *`,
            [userId, movieId]
        );

        await pool.query('COMMIT');
        return res.json(result.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error al marcar película como vista:", error);
        return res.status(500).json({
            message: "Error al marcar la película como vista"
        });
    }
};

export const unmarkMovieAsWatched = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.userId;

    try {
        // Iniciar transacción
        await pool.query('BEGIN');

        // Eliminar la marca como vista
        const result = await pool.query(
            "DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 RETURNING *",
            [userId, movieId]
        );

        if (result.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                message: "No existe una película con ese id para desmarcar como vista",
            });
        }

        // Eliminar recomendaciones asociadas a esta película y usuario
        await pool.query(
            "DELETE FROM movie_recommendations WHERE recommender_id = $1 AND movie_id = $2",
            [userId, movieId]
        );

        // Confirmar transacción
        await pool.query('COMMIT');

        return res.json(result.rows[0]);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ message: "Error al desmarcar la película como vista y eliminar recomendaciones asociadas" });
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
        // Primero intentamos obtener la película de nuestra base de datos
        let movieExists = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        
        // Si no existe en nuestra base de datos, la buscamos en TMDB
        if (movieExists.rowCount === 0) {
            try {
                const tmdbMovie = await fetchMovieDetails(movieId);
                
                // Guardamos la película en nuestra base de datos
                await pool.query(
                    `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path) 
                     VALUES ($1, $2, $3, $4, $5, $6) 
                     ON CONFLICT (id) DO UPDATE 
                     SET title = EXCLUDED.title,
                         overview = EXCLUDED.overview,
                         genre_ids = EXCLUDED.genre_ids,
                         release_date = EXCLUDED.release_date,
                         poster_path = EXCLUDED.poster_path
                     RETURNING *`,
                    [
                        tmdbMovie.id,
                        tmdbMovie.title,
                        tmdbMovie.overview,
                        tmdbMovie.genre_ids,
                        tmdbMovie.release_date,
                        tmdbMovie.poster_path
                    ]
                );
                
                movieExists = await pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
            } catch (error) {
                console.error("Error al obtener película de TMDB:", error);
                return res.status(404).json({
                    message: "No se pudo encontrar la película",
                    error: error.message
                });
            }
        }

        // Obtener comentarios y detalles adicionales
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
                ) as comments
            FROM movies m
            WHERE m.id = $1
        `, [movieId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Película no encontrada" });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener detalles de la película:', error);
        return res.status(500).json({ 
            message: "Error al obtener detalles de la película",
            error: error.message 
        });
    }
};