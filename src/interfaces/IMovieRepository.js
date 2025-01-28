export class IMovieRepository {
    createMovie(movieData) { throw new Error("Método no implementado"); }
    updateMovie(id, movieData) { throw new Error("Método no implementado"); }
    deleteMovie(id) { throw new Error("Método no implementado"); }
    getAllMovies(filters) { throw new Error("Método no implementado"); }
}

export class IUserMovieRepository {
    markAsWatched(userId, movieId) { throw new Error("Método no implementado"); }
    unmarkAsWatched(userId, movieId) { throw new Error("Método no implementado"); }
    commentAndRate(userId, movieId, comment, rating) { throw new Error("Método no implementado"); }
}

export class IMovieApiRepository {
    fetchMovies(page, category) { throw new Error("Método no implementado"); }
    searchMovies(searchTerm, page) { throw new Error("Método no implementado"); }
    fetchAllMovies(page) { throw new Error("Método no implementado"); }
} 