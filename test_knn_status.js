import axios from 'axios';

async function testKNNStatus() {
    try {
        console.log('🔍 Probando estado del servicio KNN...');
        
        // Probar endpoint del backend
        console.log('\n1. Probando /api/knn/status...');
        const backendResponse = await axios.get('https://backend-production-e3da.up.railway.app/api/knn/status?_t=' + Date.now());
        console.log('✅ Backend response:', JSON.stringify(backendResponse.data, null, 2));
        
        // Verificar si el modelo está activo
        if (backendResponse.data.model_active) {
            console.log('\n🎉 ¡El modelo KNN está activo!');
        } else {
            console.log('\n⚠️ El modelo KNN no está activo');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
        }
    }
}

testKNNStatus(); 