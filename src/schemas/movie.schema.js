import { z } from "zod";

export const updateMovieSchema = z.object({
    title: z.string().min(1).max(255),
    overview: z.string().min(1),
    genre_ids: z.array(z.number()),
    release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "La fecha debe estar en formato YYYY-MM-DD"
    })
});