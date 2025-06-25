#!/usr/bin/env python3
"""
Script para entrenar el modelo KNN eficiente
Usa datos directamente de la base de datos PostgreSQL SOLO en desarrollo/local.
En producción, FastAPI solo carga el modelo entrenado.
"""

import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Agregar el directorio padre al path para importar el servicio
sys.path.append(str(Path(__file__).parent))

from knn_service import EfficientKNNService
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_database_connection():
    """Verificar conexión a la base de datos"""
    try:
        import psycopg2
        
        # Usar variables de entorno o valores por defecto
        db_host = os.getenv('DB_HOST', 'localhost')
        db_name = os.getenv('DB_NAME', 'MovieMatch')
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD', 'admin')
        db_port = os.getenv('DB_PORT', '5432')
        
        logger.info(f"🔌 Verificando conexión a: {db_host}:{db_port}/{db_name}")
        
        connection = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port
        )
        
        # Verificar que hay datos
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM movies")
            movie_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_movies WHERE rating IS NOT NULL")
            rating_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
        
        connection.close()
        
        logger.info(f"✅ Conexión exitosa a la base de datos")
        logger.info(f"📊 Datos disponibles:")
        logger.info(f"   - Películas: {movie_count}")
        logger.info(f"   - Calificaciones: {rating_count}")
        logger.info(f"   - Usuarios: {user_count}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error conectando a la base de datos: {e}")
        logger.error("💡 Asegúrate de que:")
        logger.error("   1. PostgreSQL esté ejecutándose")
        logger.error("   2. Las credenciales sean correctas")
        logger.error("   3. La base de datos 'MovieMatch' exista")
        return False

def check_dependencies():
    """Verificar dependencias necesarias"""
    logger.info("🔍 Verificando dependencias...")
    
    required_packages = [
        'pandas', 'numpy', 'sklearn', 'psycopg2', 'joblib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            logger.info(f"✅ {package}")
        except ImportError:
            logger.error(f"❌ {package} - NO INSTALADO")
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"\n❌ Paquetes faltantes: {', '.join(missing_packages)}")
        logger.error("💡 Instala con: pip install -r requirements.txt")
        return False
    
    logger.info("✅ Todas las dependencias están instaladas")
    return True

def train_knn_model():
    """Entrenar modelo KNN con datos de la base de datos y guardar todo lo necesario"""
    logger.info("🤖 Entrenando modelo KNN con datos de la base de datos...")
    try:
        # Crear servicio KNN (esto conecta a la BD y entrena el modelo)
        knn_service = EfficientKNNService()
        status = knn_service.get_model_status()
        if not status['db_connected']:
            logger.error("❌ No se pudo conectar a la base de datos")
            return False
        if not status['movies_loaded']:
            logger.error("❌ No se pudieron cargar películas desde la BD")
            return False
        if not status['knn_loaded']:
            logger.error("❌ No se pudo entrenar el modelo KNN")
            return False
        logger.info(f"✅ Modelo KNN entrenado exitosamente")
        logger.info(f"📊 Estadísticas del modelo:")
        logger.info(f"   - Películas cargadas: {status['total_movies']}")
        logger.info(f"   - Características: {len(status['feature_columns'])}")
        logger.info(f"   - Configuración: {status['config']}")
        # Guardar modelo, scaler y DataFrame de películas en un solo archivo
        model_data = {
            'knn_model': knn_service.knn_model,
            'scaler': knn_service.scaler,
            'feature_columns': knn_service.feature_columns,
            'movies_df': knn_service.movies_df
        }
        import joblib
        joblib.dump(model_data, "knn_model.pkl")
        logger.info("✅ Modelo KNN guardado como knn_model.pkl")
        knn_service.close()
        return True
    except Exception as e:
        logger.error(f"❌ Error entrenando modelo KNN: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_knn_model():
    """Probar el modelo KNN entrenado"""
    logger.info("🧪 Probando modelo KNN...")
    
    try:
        # Cargar modelo entrenado
        knn_service = EfficientKNNService(model_path="knn_model.pkl")
        
        # Verificar estado
        status = knn_service.get_model_status()
        
        if not status['knn_loaded']:
            logger.error("❌ Modelo KNN no está cargado")
            return False
        
        # Probar con algunas películas
        test_movies = [1, 2, 3, 4, 5]  # IDs de ejemplo
        
        for movie_id in test_movies[:3]:
            logger.info(f"🔍 Probando película ID: {movie_id}")
            similar_movies = knn_service.find_similar_movies(movie_id, top_k=3)
            
            if similar_movies:
                logger.info(f"✅ Películas similares encontradas para {movie_id}:")
                for i, similar in enumerate(similar_movies, 1):
                    logger.info(f"   {i}. {similar['title']} (similitud: {similar['similarity_score']:.3f})")
            else:
                logger.warning(f"⚠️ No se encontraron películas similares para {movie_id}")
        
        # Cerrar conexiones
        knn_service.close()
        
        logger.info("✅ Pruebas del modelo completadas")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error probando modelo: {e}")
        return False

def main():
    logger.info("🚀 Entrenamiento del modelo KNN SOLO en desarrollo/local")
    logger.info("=" * 60)
    if not check_database_connection():
        return False
    if not train_knn_model():
        return False
    logger.info("🎉 Entrenamiento y guardado del modelo KNN completado")
    return True

if __name__ == "__main__":
    main() 