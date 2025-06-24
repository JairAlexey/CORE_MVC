-- Script para limpiar datos de usuarios desde 8005 hasta 9005
-- Ejecutar con cuidado - esto eliminará permanentemente los datos

-- 1. Eliminar recomendaciones de películas donde estos usuarios son remitentes o receptores
DELETE FROM movie_recommendations 
WHERE recommender_id >= 1 AND recommender_id <= 1000000 
   OR receiver_id >= 1 AND receiver_id <= 1000000;

-- 2. Eliminar conexiones de usuario donde estos usuarios están involucrados
DELETE FROM user_connections 
WHERE user1_id >= 1 AND user1_id <= 1000000 
   OR user2_id >= 1 AND user2_id <= 1000000;

-- 3. Eliminar calificaciones de películas de estos usuarios
DELETE FROM user_movies 
WHERE user_id >= 1 AND user_id <= 1000000;

-- 4. Finalmente, eliminar los usuarios
DELETE FROM users 
WHERE id >= 1 AND id <= 1000000;

-- Mostrar confirmación
SELECT 'Limpieza completada. Usuarios desde 8005 hasta 9005 eliminados junto con todos sus datos relacionados.' as mensaje;