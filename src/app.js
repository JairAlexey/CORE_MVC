import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from 'cors'

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import moviesRoutes from "./routes/movies.routes.js";
import connectionsRoutes from "./routes/connections.routes.js";
import recommendationsRoutes from "./routes/recommendations.routes.js";

import { ORIGIN } from "./config.js";
import { pool } from "./db.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get("/", (req, res) => res.json({ message: "API de MovieMatch" }));
app.use("/api", authRoutes);
app.use("/api", adminRoutes); 
app.use("/api", moviesRoutes);
app.use("/api", connectionsRoutes);
app.use("/api", recommendationsRoutes);

// Error Hander
app.use((err, req, res, next) => {
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});

export default app;