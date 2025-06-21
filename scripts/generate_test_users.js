import { pool } from '../src/db.js';
import bcrypt from 'bcrypt';
import md5 from 'md5';

// Configuración
const NUM_USERS = 100;
const START_USER_ID = 9106; // Empezar después del último rango eliminado
const PASSWORD = '123456'; // Contraseña para todos los usuarios de prueba

// Nombres y apellidos para generar usuarios realistas
const NAMES = [
    'Alejandro', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Javier', 'Sofia', 'Miguel', 'Isabella',
    'David', 'Valentina', 'Daniel', 'Camila', 'Andrés', 'Lucía', 'Fernando', 'Emma', 'Roberto', 'Mía',
    'Ricardo', 'Victoria', 'Eduardo', 'Sara', 'Gabriel', 'Natalia', 'Diego', 'Clara', 'Manuel', 'Elena',
    'Francisco', 'Adriana', 'José', 'Daniela', 'Antonio', 'Paula', 'Pedro', 'Laura', 'Juan', 'Mariana',
    'Rafael', 'Gabriela', 'Alberto', 'Carolina', 'Enrique', 'Verónica', 'Héctor', 'Patricia', 'Oscar', 'Diana',
    'Raúl', 'Beatriz', 'Mario', 'Rosa', 'Arturo', 'Teresa', 'Guillermo', 'Silvia', 'Jorge', 'Monica',
    'Alfonso', 'Claudia', 'Felipe', 'Erika', 'Rodrigo', 'Lorena', 'César', 'Alejandra', 'Hugo', 'Brenda',
    'Víctor', 'Yolanda', 'Sergio', 'Norma', 'Ernesto', 'Irma', 'Alfredo', 'Cecilia', 'Gerardo', 'Leticia',
    'Ramiro', 'Adrián', 'Natalia', 'Emilio', 'Valeria', 'Federico', 'Renata', 'Leonardo', 'Jimena', 'Sebastián',
    'Ximena', 'Adrián', 'Regina', 'Maximiliano', 'Dulce', 'Emmanuel', 'Fernanda', 'Axel', 'Melissa', 'Iván'
];

const LASTNAMES = [
    'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Martín', 'Jiménez',
    'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Gutiérrez', 'Navarro', 'Torres',
    'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
    'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Medina', 'Cortés',
    'Garrido', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo',
    'Gallego', 'Vidal', 'León', 'Herrera', 'Márquez', 'Peña', 'Flores', 'Vega', 'Fuentes', 'Carrasco',
    'Diez', 'Cabrera', 'Reyes', 'Nieto', 'Aguilar', 'Pascual', 'Santana', 'Herrero', 'Lorenzo', 'Montero',
    'Hidalgo', 'Giménez', 'Ibáñez', 'Ferrer', 'Duran', 'Santiago', 'Benítez', 'Vargas', 'Mora', 'Vicente',
    'Carmona', 'Crespo', 'Soto', 'Rivas', 'Sánchez', 'Bravo', 'Rubio', 'Campos', 'Vega', 'Fuentes'
];

// Géneros favoritos para asignar aleatoriamente
const FAVORITE_GENRES = [
    [28, 12, 16], // Acción, Aventura, Animación
    [35, 18, 10749], // Comedia, Drama, Romance
    [878, 14, 27], // Ciencia ficción, Fantasía, Terror
    [80, 53, 9648], // Crimen, Suspense, Misterio
    [99, 36, 10402], // Documental, Historia, Música
    [10751, 10770, 37], // Familia, Película de TV, Western
    [10752, 18, 35], // Bélica, Drama, Comedia
    [16, 10749, 12], // Animación, Romance, Aventura
    [28, 878, 53], // Acción, Ciencia ficción, Suspense
    [35, 80, 18] // Comedia, Crimen, Drama
];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateRandomRating(movie) {
    // Para películas populares, mayor probabilidad de rating alto
    if (movie.vote_average >= 7.0) {
        const rand = Math.random();
        if (rand < 0.7) return Math.floor(Math.random() * 2) + 4; // 70% probabilidad de 4-5
        return Math.floor(Math.random() * 3) + 1; // 30% probabilidad de 1-3
    } else {
        // Para películas no populares, mayor probabilidad de rating bajo
        const rand = Math.random();
        if (rand < 0.6) return Math.floor(Math.random() * 3) + 1; // 60% probabilidad de 1-3
        return Math.floor(Math.random() * 2) + 4; // 40% probabilidad de 4-5
    }
}

async function getAvailableMovies() {
    console.log('🔍 Obteniendo películas disponibles de la base de datos...');
    
    // Obtener películas populares (vote_average >= 7.0)
    const popularResult = await pool.query(
        'SELECT id, title, vote_average, vote_count FROM movies WHERE vote_average >= 7.0 ORDER BY vote_average DESC LIMIT 20'
    );
    
    // Obtener películas no populares (vote_average < 6.0)
    const unpopularResult = await pool.query(
        'SELECT id, title, vote_average, vote_count FROM movies WHERE vote_average < 6.0 ORDER BY vote_average ASC LIMIT 20'
    );
    
    const popularMovies = popularResult.rows;
    const unpopularMovies = unpopularResult.rows;
    
    console.log(`✅ Encontradas ${popularMovies.length} películas populares`);
    console.log(`✅ Encontradas ${unpopularMovies.length} películas no populares`);
    
    if (popularMovies.length === 0 || unpopularMovies.length === 0) {
        throw new Error('No hay suficientes películas en la base de datos. Necesitas al menos algunas populares y no populares.');
    }
    
    return { popularMovies, unpopularMovies };
}

async function generateTestUsers() {
    console.log('🚀 Iniciando generación de usuarios de prueba...');
    console.log(`📋 Generando ${NUM_USERS} usuarios desde ID ${START_USER_ID}`);
    console.log('');

    try {
        // Obtener películas disponibles de la base de datos
        const { popularMovies, unpopularMovies } = await getAvailableMovies();
        
        console.log('');
        console.log('🎬 Películas populares disponibles:');
        popularMovies.slice(0, 5).forEach(movie => {
            console.log(`   - ${movie.title} (${movie.vote_average})`);
        });
        if (popularMovies.length > 5) console.log(`   ... y ${popularMovies.length - 5} más`);
        
        console.log('');
        console.log('🎬 Películas no populares disponibles:');
        unpopularMovies.slice(0, 5).forEach(movie => {
            console.log(`   - ${movie.title} (${movie.vote_average})`);
        });
        if (unpopularMovies.length > 5) console.log(`   ... y ${unpopularMovies.length - 5} más`);
        console.log('');

        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        let usersCreated = 0;
        let ratingsCreated = 0;

        for (let i = 0; i < NUM_USERS; i++) {
            const userId = START_USER_ID + i;
            const name = getRandomElement(NAMES);
            const lastName = getRandomElement(LASTNAMES);
            const fullName = `${name} ${lastName}`;
            const email = `${name.toLowerCase()}${lastName.toLowerCase()}${userId}@test.com`;
            const gravatar = `https://www.gravatar.com/avatar/${md5(email)}`;
            const favoriteGenres = getRandomElement(FAVORITE_GENRES);

            // Crear usuario
            await pool.query(
                'INSERT INTO users (id, name, email, password, gravatar, favorite_genres) VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, fullName, email, hashedPassword, gravatar, favoriteGenres]
            );

            // Generar calificaciones de películas
            const numRatings = Math.floor(Math.random() * 15) + 5; // 5-20 calificaciones por usuario
            
            // 60% películas populares, 40% no populares
            const popularCount = Math.floor(numRatings * 0.6);
            const unpopularCount = numRatings - popularCount;

            const selectedPopularMovies = getRandomElements(popularMovies, popularCount);
            const selectedUnpopularMovies = getRandomElements(unpopularMovies, unpopularCount);

            // Insertar calificaciones de películas populares
            for (const movie of selectedPopularMovies) {
                const rating = generateRandomRating(movie);
                await pool.query(
                    'INSERT INTO user_movies (user_id, movie_id, rating, watched) VALUES ($1, $2, $3, $4)',
                    [userId, movie.id, rating, true]
                );
                ratingsCreated++;
            }

            // Insertar calificaciones de películas no populares
            for (const movie of selectedUnpopularMovies) {
                const rating = generateRandomRating(movie);
                await pool.query(
                    'INSERT INTO user_movies (user_id, movie_id, rating, watched) VALUES ($1, $2, $3, $4)',
                    [userId, movie.id, rating, true]
                );
                ratingsCreated++;
            }

            usersCreated++;
            
            if (usersCreated % 10 === 0) {
                console.log(`✅ Creados ${usersCreated} usuarios...`);
            }
        }

        console.log('');
        console.log('🎉 Generación completada exitosamente!');
        console.log('');
        console.log('📊 Resumen:');
        console.log(`   - Usuarios creados: ${usersCreated}`);
        console.log(`   - Calificaciones generadas: ${ratingsCreated}`);
        console.log(`   - Rango de IDs: ${START_USER_ID} - ${START_USER_ID + NUM_USERS - 1}`);
        console.log('');
        console.log('🔑 Información de acceso:');
        console.log(`   - Contraseña para todos los usuarios: ${PASSWORD}`);
        console.log(`   - Formato de email: nombreapellido{id}@test.com`);
        console.log('');
        console.log('🎬 Distribución de películas:');
        console.log(`   - Películas populares: ~60% de las calificaciones`);
        console.log(`   - Películas no populares: ~40% de las calificaciones`);

    } catch (error) {
        console.error('❌ Error durante la generación:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Ejecutar el script
generateTestUsers()
    .then(() => {
        console.log('🎉 Script de generación finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }); 