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

  console.log("🔍 Signup intentado con:", { name, email, password: password ? "***" : "undefined" });

  try {
    // Verificar si el email ya existe ANTES de intentar insertar
    const existingUser = await pool.query("SELECT id, email FROM users WHERE email = $1", [email]);
    
    if (existingUser.rowCount > 0) {
      console.log("❌ Email ya existe:", email);
      return res.status(400).json({
        message: "El correo ya esta registrado",
      });
    }

    console.log("✅ Email no existe, procediendo con el registro...");

    const hashedPassword = await bcrypt.hash(password, 10);
    const gravatar = `https://www.gravatar.com/avatar/${md5(email)}`;

    console.log("🔧 Datos preparados:", { name, email, gravatar, hashedPassword: "***" });

    const result = await pool.query(
      "INSERT INTO users(name, email, password, gravatar) VALUES($1, $2, $3, $4) Returning *",
      [name, email, hashedPassword, gravatar]
    );

    console.log("✅ Usuario creado exitosamente:", result.rows[0].id);

    const token = await createAccessToken({ id: result.rows[0].id });

    res.cookie("token", token, {
      // httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en signup:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    
    if (error.code === "23505") {
      return res.status(400).json({
        message: "El correo ya esta registrado",
      });
    }

    // Log del error completo para debugging
    console.error("❌ Error completo:", JSON.stringify(error, null, 2));

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

  console.log("Actualizando géneros favoritos para usuario:", userId);
  console.log("Géneros recibidos:", favoriteGenres);

  if (favoriteGenres.length < 2) {
      return res.status(400).json({ message: "Debes seleccionar al menos 2 géneros favoritos." });
  }

  try {
      const result = await pool.query(
          "UPDATE users SET favorite_genres = $1 WHERE id = $2 RETURNING *",
          [favoriteGenres, userId]
      );

      console.log("Resultado de la actualización:", result.rows[0]);

      if (result.rowCount === 0) {
          return res.status(404).json({ message: "Usuario no encontrado" });
      }

      return res.json(result.rows[0]);
  } catch (error) {
      console.error("Error al actualizar géneros favoritos:", error);
      return res.status(500).json({ message: "Error al actualizar géneros favoritos" });
  }
};

export const getFavoriteGenres = async (req, res) => {
    const userId = req.userId; 

    try {
        const result = await pool.query('SELECT favorite_genres FROM users WHERE id = $1', [userId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        return res.json({ favoriteGenres: result.rows[0].favorite_genres });
    } catch (error) {
        console.error("Error al obtener géneros favoritos:", error);
        return res.status(500).json({ message: "Error al obtener géneros favoritos" });
    }
};