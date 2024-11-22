import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { createAccessToken } from "../libs/jwt.js";
import md5 from 'md5'


export const signin = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rowCount === 0) {
    return res.status(400).json({
      message: "El correo no esta registrado",
    });
  }

  const validPassword = await bcrypt.compare(password, result.rows[0].password);

  if (!validPassword) {
    return res.status(400).json({
      message: "La contraseña es incorrecta",
    });
  }

  const token = await createAccessToken({ id: result.rows[0].id });

  res.cookie("token", token, {
    // httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res.json(result.rows[0]);
};

export const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const gravatar = `https://www.gravatar.com/avatar/${md5(email)}`;

    const result = await pool.query(
      "INSERT INTO users(name, email, password, gravatar) VALUES($1, $2, $3, $4) Returning *",
      [name, email, hashedPassword, gravatar]
    );

    const token = await createAccessToken({ id: result.rows[0].id });

    res.cookie("token", token, {
      // httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        message: "El correo ya esta registrado",
      });
    }

    next(error);
  }
};

export const signout = (req, res) => {
  res.clearCookie('token');
  res.sendStatus(200);
}

export const profile = async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
  return res.json(result.rows[0]);
} 


export const updateFavoriteGenres = async (req, res) => {
  const userId = req.userId;
  const { favoriteGenres } = req.body;

  try {
      const result = await pool.query(
          "UPDATE users SET favorite_genres = $1 WHERE id = $2 RETURNING *",
          [favoriteGenres, userId]
      );

      if (result.rowCount === 0) {
          return res.status(404).json({ message: "Usuario no encontrado" });
      }

      return res.json(result.rows[0]);
  } catch (error) {
      console.error("Error al actualizar géneros favoritos:", error);
      return res.status(500).json({ message: "Error al actualizar géneros favoritos" });
  }
};