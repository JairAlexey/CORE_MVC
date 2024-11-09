import { pool } from "../db.js";

export const getAllMovies = async (req, res) => {
    const result = await pool.query("SELECT * FROM movies");
    return res.json(result.rows);
};

export const getMovie = async (req, res) => {
    const result = await pool.query("SELECT * FROM movies WHERE id = $1", [
        req.params.id,
    ]);

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "No existe una película con ese id",
        });
    }

    return res.json(result.rows[0]);
};

export const createMovie = async (req, res) => {
    const { title, description } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO movies (title, description) VALUES ($1, $2) RETURNING *",
            [title, description]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateMovie = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    const result = await pool.query(
        "UPDATE movies SET title = $1, description = $2 WHERE id = $3 RETURNING *",
        [title, description, id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "No existe una película con ese id",
        });
    }

    return res.json(result.rows[0]);
};

export const deleteMovie = async (req, res) => {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM movies WHERE id = $1", [id]);

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "No existe una película con ese id",
        });
    }

    return res.sendStatus(204);
};