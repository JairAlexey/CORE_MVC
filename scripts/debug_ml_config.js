#!/usr/bin/env node

/**
 * Script para debuggear la configuración del servicio ML
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Cargar variables de entorno
dotenv.config();

const ML_MODEL_URL = process.env.ML_MODEL_URL;

console.log('🔍 Debugging configuración del servicio ML');
console.log('=' .repeat(50));

console.log('📋 Variables de entorno:');
console.log(`   - ML_MODEL_URL: ${ML_MODEL_URL || 'NO CONFIGURADA'}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'NO CONFIGURADA'}`);

if (!ML_MODEL_URL) {
    console.error('❌ Error: ML_MODEL_URL no está configurada');
    console.log('💡 Solución: Configurar la variable de entorno ML_MODEL_URL');
    console.log('   Ejemplo: ML_MODEL_URL=https://tu-servicio-ml.railway.app');
    process.exit(1);
}

// Verificar que la URL no tenga trailing slash
const cleanUrl = ML_MODEL_URL.replace(/\/$/, '');
console.log(`🔧 URL limpia: ${cleanUrl}`);

// Probar endpoints
async function testEndpoints() {
    console.log('\n🧪 Probando endpoints...');
    
    // 1. Health Check
    console.log('\n1️⃣ Probando /health...');
    try {
        const healthResponse = await axios.get(`${cleanUrl}/health`, {
            timeout: 10000
        });
        console.log('✅ Health Check exitoso:');
        console.log(`   - Status: ${healthResponse.status}`);
        console.log(`   - Data: ${JSON.stringify(healthResponse.data, null, 2)}`);
    } catch (error) {
        console.error('❌ Health Check falló:');
        console.error(`   - Error: ${error.message}`);
        if (error.response) {
            console.error(`   - Status: ${error.response.status}`);
            console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
    
    // 2. Root endpoint
    console.log('\n2️⃣ Probando / (root)...');
    try {
        const rootResponse = await axios.get(`${cleanUrl}/`, {
            timeout: 10000
        });
        console.log('✅ Root endpoint exitoso:');
        console.log(`   - Status: ${rootResponse.status}`);
        console.log(`   - Data: ${JSON.stringify(rootResponse.data, null, 2)}`);
    } catch (error) {
        console.error('❌ Root endpoint falló:');
        console.error(`   - Error: ${error.message}`);
        if (error.response) {
            console.error(`   - Status: ${error.response.status}`);
        }
    }
    
    // 3. Predict endpoint
    console.log('\n3️⃣ Probando /predict...');
    try {
        const testData = {
            n_shared_genres: 2,
            vote_average: 7.5,
            vote_count: 1500,
            is_favorite_genre: 1,
            years_since_release: 3,
            popularity: 85.5
        };
        
        const predictResponse = await axios.post(`${cleanUrl}/predict`, testData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });
        console.log('✅ Predict endpoint exitoso:');
        console.log(`   - Status: ${predictResponse.status}`);
        console.log(`   - Data: ${JSON.stringify(predictResponse.data, null, 2)}`);
    } catch (error) {
        console.error('❌ Predict endpoint falló:');
        console.error(`   - Error: ${error.message}`);
        if (error.response) {
            console.error(`   - Status: ${error.response.status}`);
            console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
    
    // 4. Predict-batch endpoint
    console.log('\n4️⃣ Probando /predict-batch...');
    try {
        const testMovies = [
            {
                movie_id: 1,
                n_shared_genres: 2,
                vote_average: 7.5,
                vote_count: 1500,
                is_favorite_genre: 1,
                years_since_release: 3,
                popularity: 85.5
            }
        ];
        
        const batchData = { movies: testMovies };
        const batchResponse = await axios.post(`${cleanUrl}/predict-batch`, batchData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        console.log('✅ Predict-batch endpoint exitoso:');
        console.log(`   - Status: ${batchResponse.status}`);
        console.log(`   - Data: ${JSON.stringify(batchResponse.data, null, 2)}`);
    } catch (error) {
        console.error('❌ Predict-batch endpoint falló:');
        console.error(`   - Error: ${error.message}`);
        if (error.response) {
            console.error(`   - Status: ${error.response.status}`);
            console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

// Ejecutar pruebas
testEndpoints().then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Debugging completado');
}).catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
}); 