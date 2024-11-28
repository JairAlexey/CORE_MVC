CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    favorite_genres INTEGER[]
);


ALTER TABLE users ADD COLUMN gravatar VARCHAR(255);

ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

DROP TABLE IF EXISTS movies;
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    overview TEXT NOT NULL,
    genre_ids INTEGER[] NOT NULL,
    release_date DATE NOT NULL,
    poster_path VARCHAR(1000)
);

ALTER TABLE movies ALTER COLUMN poster_path TYPE VARCHAR(1000);

CREATE TABLE user_movies (
    user_id INTEGER REFERENCES users(id),
    movie_id INTEGER REFERENCES movies(id),
    watched BOOLEAN DEFAULT FALSE,
    comment TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    PRIMARY KEY (user_id, movie_id)
);

ALTER TABLE user_movies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users ADD COLUMN favorite_genres INTEGER[];

CREATE TABLE user_connections (
    user1_id INTEGER REFERENCES users(id),
    user2_id INTEGER REFERENCES users(id),
    compatibility_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user1_id, user2_id),
    CHECK (user1_id < user2_id)
);

CREATE TABLE movie_recommendations (
    id SERIAL PRIMARY KEY,
    recommender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    movie_id INTEGER REFERENCES movies(id),
    rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recommender_id, receiver_id, movie_id)
);

CREATE TABLE deleted_movies (
    id INTEGER PRIMARY KEY,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE movies ADD COLUMN is_modified BOOLEAN DEFAULT FALSE;