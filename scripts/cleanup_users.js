import { pool } from '../src/db.js';

// Rango de usuarios a eliminar: desde 8005 hasta 9005
const USER_RANGE_START = 1;
const USER_RANGE_END = 10000;

async function cleanupUsers() {
    console.log('🚀 Iniciando limpieza de usuarios...');
    console.log(`📋 Rango de usuarios a eliminar: ${USER_RANGE_START} hasta ${USER_RANGE_END}`);
    console.log(`📊 Total de usuarios en el rango: ${USER_RANGE_END - USER_RANGE_START + 1}`);
    console.log('');

    try {
        // Verificar que los usuarios existen en el rango
        const userCheck = await pool.query(
            'SELECT id, name, email FROM users WHERE id >= $1 AND id <= $2 ORDER BY id',
            [USER_RANGE_START, USER_RANGE_END]
        );

        if (userCheck.rowCount === 0) {
            console.log('❌ No se encontraron usuarios en ese rango de IDs');
            return;
        }

        console.log(`👥 Usuarios encontrados en el rango (${userCheck.rowCount} usuarios):`);
        userCheck.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, Nombre: ${user.name}, Email: ${user.email}`);
        });
        console.log('');

        // 1. Contar y eliminar recomendaciones de películas
        const recommendationsCount = await pool.query(
            'SELECT COUNT(*) FROM movie_recommendations WHERE recommender_id >= $1 AND recommender_id <= $2 OR receiver_id >= $1 AND receiver_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        
        await pool.query(
            'DELETE FROM movie_recommendations WHERE recommender_id >= $1 AND recommender_id <= $2 OR receiver_id >= $1 AND receiver_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        console.log(`🗑️  Eliminadas ${recommendationsCount.rows[0].count} recomendaciones de películas`);

        // 2. Contar y eliminar conexiones de usuario
        const connectionsCount = await pool.query(
            'SELECT COUNT(*) FROM user_connections WHERE user1_id >= $1 AND user1_id <= $2 OR user2_id >= $1 AND user2_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        
        await pool.query(
            'DELETE FROM user_connections WHERE user1_id >= $1 AND user1_id <= $2 OR user2_id >= $1 AND user2_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        console.log(`🔗 Eliminadas ${connectionsCount.rows[0].count} conexiones de usuario`);

        // 3. Contar y eliminar calificaciones de películas
        const ratingsCount = await pool.query(
            'SELECT COUNT(*) FROM user_movies WHERE user_id >= $1 AND user_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        
        await pool.query(
            'DELETE FROM user_movies WHERE user_id >= $1 AND user_id <= $2',
            [USER_RANGE_START, USER_RANGE_END]
        );
        console.log(`⭐ Eliminadas ${ratingsCount.rows[0].count} calificaciones de películas`);

        // 4. Eliminar los usuarios
        const usersDeleted = await pool.query(
            'DELETE FROM users WHERE id >= $1 AND id <= $2 RETURNING id, name',
            [USER_RANGE_START, USER_RANGE_END]
        );
        console.log(`👤 Eliminados ${usersDeleted.rowCount} usuarios:`);
        usersDeleted.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, Nombre: ${user.name}`);
        });

        console.log('');
        console.log('✅ Limpieza completada exitosamente!');
        console.log('');
        console.log('📊 Resumen:');
        console.log(`   - Rango eliminado: ${USER_RANGE_START} - ${USER_RANGE_END}`);
        console.log(`   - Usuarios eliminados: ${usersDeleted.rowCount}`);
        console.log(`   - Recomendaciones eliminadas: ${recommendationsCount.rows[0].count}`);
        console.log(`   - Conexiones eliminadas: ${connectionsCount.rows[0].count}`);
        console.log(`   - Calificaciones eliminadas: ${ratingsCount.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar el script
cleanupUsers()
    .then(() => {
        console.log('🎉 Script de limpieza finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }); 