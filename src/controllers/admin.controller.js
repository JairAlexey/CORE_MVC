import { pool } from "../db.js";

export const getUsers = async (req, res) => {
    const result = await pool.query("SELECT * FROM users");
    return res.json(result.rows);
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, is_admin } = req.body;

    // Verificar si el usuario que se está actualizando es el único administrador
    const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE is_admin = TRUE");
    const currentUser = await pool.query("SELECT is_admin FROM users WHERE id = $1", [id]);

    if (currentUser.rows[0].is_admin && is_admin === false && parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
            message: "No puedes eliminar el rol de administrador del único administrador."
        });
    }

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

    // Verificar si el usuario a eliminar es el único administrador
    const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE is_admin = TRUE");
    const userToDelete = await pool.query("SELECT is_admin FROM users WHERE id = $1", [id]);

    if (userToDelete.rows[0].is_admin && parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
            message: "No puedes eliminar al único administrador."
        });
    }

    if (!req.isAdmin) {
        return res.status(403).json({
            message: "No tienes permisos para eliminar usuarios",
        });
    }

    try {
        // Eliminar las recomendaciones donde el usuario es el receptor
        await pool.query("DELETE FROM movie_recommendations WHERE receiver_id = $1", [id]);

        // Eliminar las recomendaciones donde el usuario es el recomendador
        await pool.query("DELETE FROM movie_recommendations WHERE recommender_id = $1", [id]);

        // Eliminar las conexiones del usuario
        await pool.query("DELETE FROM user_connections WHERE user1_id = $1 OR user2_id = $1", [id]);

        // Eliminar las películas del usuario
        await pool.query("DELETE FROM user_movies WHERE user_id = $1", [id]);

        // Ahora eliminar el usuario
        const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado",
            });
        }

        return res.sendStatus(204);
    } catch (error) {
        console.error("Error al eliminar el usuario:", error);
        return res.status(500).json({ message: "Error al eliminar el usuario" });
    }
};