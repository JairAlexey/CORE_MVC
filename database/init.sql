CREATE TABLE task(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);
-- remove unique from title
ALTER TABLE task DROP CONSTRAINT task_title_key;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

ALTER TABLE task ADD COLUMN user_id INTEGER REFERENCES users(id);


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