#!/usr/bin/env python3
"""
Script de prueba para el modelo de recomendación de películas
"""

import requests
import json
import time

# URL del modelo FastAPI
MODEL_URL = "http://127.0.0.1:8000"

def test_single_prediction():
    """Prueba predicción individual"""
    print("🧪 Probando predicción individual...")
    
    # Datos de ejemplo para una película
    test_data = {
        "n_shared_genres": 2,
        "vote_average": 7.5,
        "vote_count": 1500,
        "is_favorite_genre": 1,
        "years_since_release": 3,
        "popularity": 85.5
    }
    
    try:
        response = requests.post(f"{MODEL_URL}/predict", json=test_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Predicción individual exitosa:")
            print(f"   - Predicción: {result['prediction']}")
            print(f"   - Probabilidad de que guste: {result['probability_like']}%")
            print(f"   - Probabilidad de que no guste: {result['probability_dislike']}%")
            return True
        else:
            print(f"❌ Error en predicción individual: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_batch_prediction():
    """Prueba predicción en lote"""
    print("\n🧪 Probando predicción en lote...")
    
    # Datos de ejemplo para múltiples películas
    test_movies = [
        {
            "movie_id": 1,
            "n_shared_genres": 2,
            "vote_average": 7.5,
            "vote_count": 1500,
            "is_favorite_genre": 1,
            "years_since_release": 3,
            "popularity": 85.5
        },
        {
            "movie_id": 2,
            "n_shared_genres": 0,
            "vote_average": 6.2,
            "vote_count": 800,
            "is_favorite_genre": 0,
            "years_since_release": 8,
            "popularity": 45.2
        },
        {
            "movie_id": 3,
            "n_shared_genres": 3,
            "vote_average": 8.1,
            "vote_count": 2200,
            "is_favorite_genre": 1,
            "years_since_release": 1,
            "popularity": 92.8
        }
    ]
    
    batch_data = {"movies": test_movies}
    
    try:
        response = requests.post(f"{MODEL_URL}/predict-batch", json=batch_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Predicción en lote exitosa:")
            print(f"   - Total de películas procesadas: {result['total_movies']}")
            
            for pred in result['predictions']:
                print(f"   - Película {pred['movie_id']}: {pred['probability_like']}% de probabilidad de que guste")
            
            return True
        else:
            print(f"❌ Error en predicción en lote: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_model_health():
    """Prueba la salud del modelo"""
    print("🏥 Verificando salud del modelo...")
    
    try:
        response = requests.get(f"{MODEL_URL}/", timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Modelo funcionando: {result['message']}")
            return True
        else:
            print(f"❌ Error en health check: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas del modelo de recomendación...")
    print("=" * 50)
    
    # Verificar que el modelo esté funcionando
    if not test_model_health():
        print("\n❌ El modelo no está disponible. Asegúrate de que esté ejecutándose en http://127.0.0.1:8000")
        return
    
    # Probar predicción individual
    single_success = test_single_prediction()
    
    # Probar predicción en lote
    batch_success = test_batch_prediction()
    
    # Resumen de resultados
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE PRUEBAS:")
    print(f"   - Health Check: ✅")
    print(f"   - Predicción Individual: {'✅' if single_success else '❌'}")
    print(f"   - Predicción en Lote: {'✅' if batch_success else '❌'}")
    
    if single_success and batch_success:
        print("\n🎉 ¡Todas las pruebas pasaron! El modelo está listo para usar.")
    else:
        print("\n⚠️  Algunas pruebas fallaron. Revisa los errores arriba.")

if __name__ == "__main__":
    main() 