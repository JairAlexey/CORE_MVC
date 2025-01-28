// Interfaz abstracta para películas
class IMovie {
    getTitle() { throw new Error("Método no implementado"); }
    getOverview() { throw new Error("Método no implementado"); }
    getGenres() { throw new Error("Método no implementado"); }
    getReleaseDate() { throw new Error("Método no implementado"); }
    getPosterPath() { throw new Error("Método no implementado"); }
}

// Creador abstracto
class MovieCreator {
    createMovie(movieData) { throw new Error("Método no implementado"); }
}

// Implementaciones concretas de películas
class LocalMovie extends IMovie {
    constructor(movieData) {
        super();
        this.data = movieData;
        this.isModified = true;
    }

    getTitle() { return this.data.title; }
    getOverview() { return this.data.overview; }
    getGenres() { return this.data.genre_ids || []; }
    getReleaseDate() { return this.data.release_date; }
    getPosterPath() { return this.data.poster_path; }
}

class ApiMovie extends IMovie {
    constructor(movieData) {
        super();
        this.data = movieData;
        this.isModified = false;
    }

    getTitle() { return this.data.title; }
    getOverview() { return this.data.overview || ''; }
    getGenres() { return this.data.genre_ids || []; }
    getReleaseDate() { return this.data.release_date; }
    getPosterPath() { return this.data.poster_path; }
}

// Creadores concretos
class LocalMovieCreator extends MovieCreator {
    createMovie(movieData) {
        return new LocalMovie(movieData);
    }
}

class ApiMovieCreator extends MovieCreator {
    createMovie(movieData) {
        return new ApiMovie(movieData);
    }
}

export {
    IMovie,
    MovieCreator,
    LocalMovieCreator,
    ApiMovieCreator
}; 