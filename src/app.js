import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from 'cors'

import taskRoutes from "./routes/tasks.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import moviesRoutes from "./routes/movies.routes.js";

import { ORIGIN } from "./config.js";
import { pool } from "./db.js";


const app = express();

// Middlewares
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => res.json({ message: "API de MovieMatch" }));
app.use("/api", taskRoutes);
app.use("/api", authRoutes);
app.use("/api", adminRoutes); 
app.use("/api", moviesRoutes);

// Error Hander
app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});

export default app;