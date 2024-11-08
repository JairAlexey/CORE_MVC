import pg from "pg";

export const pool = new pg.Pool({
  port: 5433,
  host: "localhost",
  user: "postgres",
  password: "mysecretpassword",
  database: 'crudDB'
});

pool.on("connect", () => {
  console.log("Database connected");
});