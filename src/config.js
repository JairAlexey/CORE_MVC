export const PORT = process.env.PORT || 3000;

export const PG_PORT = process.env.PG_PORT || 5432;
export const PG_HOST = process.env.PG_HOST || "localhost";
export const PG_USER = process.env.PG_USER || "postgres";
export const PG_PASSWORD = process.env.PG_PASSWORD || "admin";
export const PG_DATABASE = process.env.PG_DATABASE || "MovieMatch";

export const ORIGIN = process.env.ORIGIN ?
    process.env.ORIGIN.split(',') :
    [
        'https://vitereact-production-a44a.up.railway.app',
        'https://next-production-d0d7.up.railway.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
    ];
