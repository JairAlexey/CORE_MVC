import { pool } from "../db.js";

export const getUsers = async (req, res) => {
    const result = await pool.query("SELECT * FROM users");
    return res.json(result.rows);
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, is_admin } = req.body;

    const result = await pool.query(
        "UPDATE users SET name = $1, email = $2, is_admin = $3 WHERE id = $4 RETURNING *",
        [name, email, is_admin, id]
    );

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "Usuario no encontrado",
        });
    }

    return res.json(result.rows[0]);
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
        return res.status(404).json({
            message: "Usuario no encontrado",
        });
    }

    return res.sendStatus(204);
};