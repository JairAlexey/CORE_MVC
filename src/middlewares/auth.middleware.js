import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export const isAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "No estas autorizado",
    });
  }

  jwt.verify(token, "xyz123", async (err, decoded) => {
    if (err)
      return res.status(401).json({
        message: "No estas autorizado",
      });

    req.userId = decoded.id;

    // Verificar si el usuario es administrador
    const result = await pool.query("SELECT is_admin FROM users WHERE id = $1", [req.userId]);
    if (result.rows.length > 0) {
      req.isAdmin = result.rows[0].is_admin;
    } else {
      req.isAdmin = false;
    }

    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({
      message: "No tienes permisos de administrador",
    });
  }
  next();
};