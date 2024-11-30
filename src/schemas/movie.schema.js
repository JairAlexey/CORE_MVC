import { z } from "zod";

export const updateMovieSchema = z.object({
    title: z.string({
        required_error: "El título es requerido",
    }).min(1, {
        message: "El título no puede estar vacío"
    }).max(255, {
        message: "El título no puede tener más de 255 caracteres"
    }),
    overview: z.string({
        required_error: "La sinopsis es requerida",
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
    }),
    poster_path: z.string({
        required_error: "El URL es requerido",
    }).min(1, {
        message: "El URL no puede estar vacío"
    }).refine((url) => {
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        const relativePathRegex = /^\/[a-zA-Z0-9_-]+\.(jpeg|jpg|png|gif|bmp|webp)$/;
        return urlRegex.test(url) || relativePathRegex.test(url);
    }, {
        message: "El link del poster_path debe ser un URL válido o una ruta relativa válida que apunte a una imagen (.jpg, .png, etc.)"
    })
});

export const createMovieSchema = z.object({
    title: z.string({
        required_error: "El título es requerido",
    }).min(1, {
        message: "El título no puede estar vacío"
    }).max(255, {
        message: "El título no puede tener más de 255 caracteres"
    }),
    overview: z.string({
        required_error: "La sinopsis es requerida",
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
    }),
    poster_path: z.string({
        required_error: "El URL es requerido",
    }).min(1, {
        message: "El URL no puede estar vacío"
    }).refine((url) => {
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        const relativePathRegex = /^\/[a-zA-Z0-9_-]+\.(jpeg|jpg|png|gif|bmp|webp)$/;
        return urlRegex.test(url) || relativePathRegex.test(url);
    }, {
        message: "El link del poster_path debe ser un URL válido o una ruta relativa válida que apunte a una imagen (.jpg, .png, etc.)"
    })
});

export const commentAndRateSchema = z.object({
    comment: z.string({
        required_error: "El comentario es requerido",
        invalid_type_error: "El comentario debe ser un texto"
    }).min(1, {
        message: "El comentario no puede estar vacío"
    }),
    rating: z.number({
        required_error: "La valoración es requerida",
        invalid_type_error: "La valoración debe ser un número"
    }).int({
        message: "La valoración debe ser un número entero"
    }).min(1, {
        message: "La valoración debe ser al menos 1"
    }).max(5, {
        message: "La valoración no puede ser mayor a 5"
    })
});