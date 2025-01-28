import { pool } from "../db.js";
import { fetchMovieDetails, fetchMovies, fetchAllMovies, searchMovies } from "./movieApiService.js";
import { IMovieRepository, IUserMovieRepository } from '../interfaces/IMovieRepository.js';
import { MovieObserver, RecommendationObserver } from '../observers/MovieObserver.js';
import { LocalMovieCreator, ApiMovieCreator } from '../factories/MovieFactory.js';

class MovieService extends IMovieRepository {
    constructor(pool) {
        super();
        this.pool = pool;
        this.localMovieCreator = new LocalMovieCreator();
        this.apiMovieCreator = new ApiMovieCreator();
        this.movieObserver = new MovieObserver();
        this.movieObserver.subscribe(new RecommendationObserver(pool));
    }

    async createMovie(movieData) {
        const movie = this.localMovieCreator.createMovie(movieData);
        
        const existingMovie = await this.pool.query(
            "SELECT * FROM movies WHERE title = $1",
            [movie.getTitle()]
        );

        if (existingMovie.rowCount > 0) {
            throw new Error("Ya existe una película con ese título");
        }

        const maxIdResult = await this.pool.query("SELECT MAX(id) FROM movies");
        const newId = (maxIdResult.rows[0].max || 0) + 1;

        const result = await this.pool.query(
            `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path, is_modified) 
            VALUES ($1, $2, $3, $4, $5, $6, TRUE) 
            RETURNING *`,
            [
                newId,
                movie.getTitle(),
                movie.getOverview(),
                movie.getGenres(),
                movie.getReleaseDate(),
                movie.getPosterPath()
            ]
        );

        return result.rows[0];
    }

    async updateMovie(id, movieData) {
        const { title, overview, genre_ids, release_date, poster_path } = movieData;

        await this.pool.query("BEGIN");
        try {
            const movieExists = await this.pool.query(
                "SELECT * FROM movies WHERE id = $1",
                [id]
            );

            if (movieExists.rowCount === 0) {
                const result = await this.pool.query(
                    `INSERT INTO movies (id, title, overview, genre_ids, release_date, poster_path, is_modified) 
                    VALUES ($1, $2, $3, $4, $5, $6, TRUE) 
                    RETURNING *`,
                    [id, title, overview, genre_ids, release_date, poster_path]
                );
                await this.pool.query("COMMIT");
                return result.rows[0];
            }

            const result = await this.pool.query(
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

            await this.pool.query("COMMIT");
            return result.rows[0];
        } catch (error) {
            await this.pool.query("ROLLBACK");
            throw error;
        }
    }

    async deleteMovie(id) {
        await this.pool.query("BEGIN");
        try {
            await this.pool.query("DELETE FROM user_movies WHERE movie_id = $1", [id]);
            await this.pool.query("DELETE FROM movie_recommendations WHERE movie_id = $1", [id]);
            await this.pool.query(
                "INSERT INTO deleted_movies (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
                [id]
            );
            await this.pool.query("DELETE FROM movies WHERE id = $1", [id]);
            await this.pool.query("COMMIT");
            return true;
        } catch (error) {
            await this.pool.query("ROLLBACK");
            throw error;
        }
    }

    async getAllMovies({ userId, page, category, searchTerm }) {
        try {
            // Obtener películas locales
            let localMovies = await this.pool.query(
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

            const deletedMovies = await this.pool.query("SELECT id FROM deleted_movies");
            const deletedIds = new Set(deletedMovies.rows.map(m => m.id));
            const localMoviesMap = new Map(localMovies.rows.map(m => [m.id, m]));

            let allMovies = [];

            if (moviesFromAPI && moviesFromAPI.results) {
                allMovies = moviesFromAPI.results
                    .filter(movie => !deletedIds.has(movie.id))
                    .map(movie => localMoviesMap.has(movie.id) ? localMoviesMap.get(movie.id) : movie);
            }

            localMovies.rows.forEach(localMovie => {
                if (!allMovies.some(m => m.id === localMovie.id)) {
                    allMovies.push(localMovie);
                }
            });

            return {
                movies: allMovies,
                pagination: {
                    currentPage: moviesFromAPI.currentPage,
                    totalPages: moviesFromAPI.totalPages
                }
            };
        } catch (error) {
            throw new Error(`Error al obtener películas: ${error.message}`);
        }
    }

    async getMovieDetails(movieId) {
        let movieExists = await this.pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        
        if (movieExists.rowCount === 0) {
            const tmdbMovie = await fetchMovieDetails(movieId);
            
            await this.pool.query(
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
            
            movieExists = await this.pool.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        }

        const result = await this.pool.query(`
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
            throw new Error("Película no encontrada");
        }

        return result.rows[0];
    }
}

class UserMovieService extends IUserMovieRepository {
    constructor(pool) {
        super();
        this.pool = pool;
        this.movieObserver = new MovieObserver();
        this.movieObserver.subscribe(new RecommendationObserver(pool));
    }

    async markAsWatched(userId, movieId) {
        await this.pool.query('BEGIN');
        try {
            let movieExists = await this.pool.query(
                "SELECT * FROM movies WHERE id = $1",
                [movieId]
            );

            if (movieExists.rowCount === 0) {
                const movieData = await fetchMovieDetails(movieId);
                const insertResult = await this.pool.query(
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
            }

            const result = await this.pool.query(
                `INSERT INTO user_movies (user_id, movie_id, watched) 
                VALUES ($1, $2, TRUE) 
                ON CONFLICT (user_id, movie_id) 
                DO UPDATE SET watched = TRUE
                RETURNING *`,
                [userId, movieId]
            );

            await this.pool.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async unmarkAsWatched(userId, movieId) {
        await this.pool.query('BEGIN');
        try {
            const result = await this.pool.query(
                "DELETE FROM user_movies WHERE user_id = $1 AND movie_id = $2 RETURNING *",
                [userId, movieId]
            );

            if (result.rowCount === 0) {
                throw new Error("No existe una película con ese id para desmarcar como vista");
            }

            await this.pool.query(
                "DELETE FROM movie_recommendations WHERE recommender_id = $1 AND movie_id = $2",
                [userId, movieId]
            );

            await this.pool.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async commentAndRate(userId, movieId, comment, rating) {
        const result = await this.pool.query(
            "UPDATE user_movies SET comment = $1, rating = $2 WHERE user_id = $3 AND movie_id = $4 AND watched = TRUE RETURNING *",
            [comment, rating, userId, movieId]
        );

        if (result.rowCount === 0) {
            throw new Error("Debes marcar la película como vista antes de comentar o valorar");
        }

        // Notificar a los observadores
        this.movieObserver.notify(userId, movieId, rating);

        return result.rows[0];
    }
}

export { MovieService, UserMovieService }; 