import { z } from "zod";

export const updateMovieSchema = z.object({
    title: z.string({
        required_error: "El título es requerido",
        invalid_type_error: "El título debe ser un texto"
    }).min(1, {
        message: "El título no puede estar vacío"
    }).max(255, {
        message: "El título no puede tener más de 255 caracteres"
    }),
    
    overview: z.string({
        required_error: "La sinopsis es requerida",
        invalid_type_error: "La sinopsis debe ser un texto"
    }).min(1, {
        message: "La sinopsis no puede estar vacía"
    }),
    
    genre_ids: z.array(z.number(), {
        required_error: "Los géneros son requeridos"
    }).min(1, {
        message: "Debe seleccionar al menos un género"
    }),
    
    release_date: z.string({
        required_error: "La fecha de estreno es requerida"
    }).regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "La fecha debe estar en formato YYYY-MM-DD"
    })
});

export const createMovieSchema = z.object({
    title: z.string({
        required_error: "El título es requerido",
    }),
    overview: z.string({
        required_error: "La descripción es requerida",
    }),
    genre_ids: z.array(z.number()).optional().default([]),
    release_date: z.string().optional(),
    poster_path: z.string().optional()
});