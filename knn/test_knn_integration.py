#!/usr/bin/env python3
"""
Script de prueba para verificar la integración completa del sistema KNN
"""

import sys
import os
import requests
import json
import time
from pathlib import Path

# Agregar el directorio actual al path
sys.path.append(str(Path(__file__).parent))

from knn_service import EfficientKNNService

# Configuración
KNN_API_URL = "http://127.0.0.1:8001"
TEST_MOVIE_ID = 1

def test_knn_service():
    """Probar el servicio KNN directamente"""
    print("🧪 Probando servicio KNN directamente...")
    
    try:
        # Crear servicio KNN
        knn_service = EfficientKNNService(
            movies_data_path="prepared_movies_for_knn.csv",
            model_path="knn_model.pkl"
        )
        
        # Verificar estado
        status = knn_service.get_model_status()
        print(f"✅ Estado del servicio: {status['knn_loaded']}")
        print(f"📊 Películas cargadas: {status['total_movies']}")
        
        # Probar búsqueda de películas similares
        similar_movies = knn_service.find_similar_movies(TEST_MOVIE_ID, top_k=3)
        print(f"🎬 Películas similares encontradas: {len(similar_movies)}")
        
        for i, movie in enumerate(similar_movies, 1):
            print(f"   {i}. {movie['title']} (similitud: {movie['similarity_score']:.3f})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando servicio KNN: {e}")
        return False

def test_knn_api():
    """Probar la API KNN"""
    print("\n🌐 Probando API KNN...")
    
    try:
        # Verificar estado de la API
        response = requests.get(f"{KNN_API_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API KNN funcionando: {data['status']}")
        else:
            print(f"❌ API KNN no responde: {response.status_code}")
            return False
        
        # Probar búsqueda de películas similares
        response = requests.post(
            f"{KNN_API_URL}/similar-movies",
            json={"movie_id": TEST_MOVIE_ID, "top_k": 3},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Películas similares via API: {data['total_found']}")
            for movie in data['similar_movies']:
                print(f"   - {movie['title']} (similitud: {movie['similarity_score']:.3f})")
        else:
            print(f"❌ Error en API similar-movies: {response.status_code}")
            return False
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar a la API KNN. ¿Está ejecutándose?")
        return False
    except Exception as e:
        print(f"❌ Error probando API KNN: {e}")
        return False

def test_efficient_recommendations():
    """Probar recomendaciones eficientes"""
    print("\n🎯 Probando recomendaciones eficientes...")
    
    try:
        # Datos de prueba
        social_recommendations = [
            {
                "movie_id": 1,
                "title": "Test Movie 1",
                "rating": 4.5,
                "recommenders": [{"id": 1, "name": "User1"}]
            },
            {
                "movie_id": 2,
                "title": "Test Movie 2",
                "rating": 4.0,
                "recommenders": [{"id": 2, "name": "User2"}]
            }
        ]
        
        user_features = {
            "user_id": 1,
            "favorite_genres": [28, 12],
            "avg_rating": 4.0,
            "total_rated": 50
        }
        
        # Probar recomendaciones eficientes
        response = requests.post(
            f"{KNN_API_URL}/efficient-recommendations",
            json={
                "social_recommendations": social_recommendations,
                "user_features": user_features
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recomendaciones eficientes generadas: {data['final_count']}")
            print(f"📊 Estrategia utilizada: {data['strategy_summary']['knn_activated']}")
            
            for i, rec in enumerate(data['recommendations'][:3], 1):
                print(f"   {i}. {rec['title']} (fuente: {rec.get('source', 'unknown')})")
            
            return True
        else:
            print(f"❌ Error en recomendaciones eficientes: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error probando recomendaciones eficientes: {e}")
        return False

def test_model_status():
    """Probar estado del modelo"""
    print("\n📊 Probando estado del modelo...")
    
    try:
        response = requests.get(f"{KNN_API_URL}/model-status", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Estado del modelo KNN:")
            print(f"   - Modelo cargado: {data['knn_loaded']}")
            print(f"   - Películas cargadas: {data['movies_loaded']}")
            print(f"   - Total películas: {data['total_movies']}")
            print(f"   - Configuración: {data['config']}")
            return True
        else:
            print(f"❌ Error obteniendo estado del modelo: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error probando estado del modelo: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas de integración KNN")
    print("=" * 50)
    
    tests = [
        ("Servicio KNN", test_knn_service),
        ("API KNN", test_knn_api),
        ("Recomendaciones Eficientes", test_efficient_recommendations),
        ("Estado del Modelo", test_model_status)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔍 Ejecutando: {test_name}")
        try:
            success = test_func()
            results.append((test_name, success))
            if success:
                print(f"✅ {test_name}: PASÓ")
            else:
                print(f"❌ {test_name}: FALLÓ")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Resumen final
    print("\n" + "=" * 50)
    print("📋 RESUMEN DE PRUEBAS")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASÓ" if success else "❌ FALLÓ"
        print(f"{test_name}: {status}")
    
    print(f"\n🎯 Resultado: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron! El sistema KNN está funcionando correctamente.")
        return True
    else:
        print("⚠️ Algunas pruebas fallaron. Revisa los errores arriba.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 