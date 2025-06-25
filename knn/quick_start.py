#!/usr/bin/env python3
"""
Script de inicio rápido para el sistema KNN
Configura, entrena y prueba el sistema en un solo comando
AHORA USA DATOS DIRECTAMENTE DE LA BASE DE DATOS
"""

import sys
import os
import subprocess
import time
import requests
from pathlib import Path

def print_header():
    """Imprimir encabezado del script"""
    print("🎯" + "="*60)
    print("🎯  INICIO RÁPIDO - SISTEMA KNN PARA MOVIEMATCH")
    print("🎯  (Usando datos directamente de la base de datos)")
    print("🎯" + "="*60)
    print()

def check_dependencies():
    """Verificar dependencias"""
    print("🔍 Verificando dependencias...")
    
    try:
        import pandas
        import numpy
        import sklearn
        import fastapi
        import uvicorn
        import psycopg2
        print("✅ Todas las dependencias están instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependencia faltante: {e}")
        print("💡 Ejecuta: pip install -r requirements.txt")
        return False

def check_database_connection():
    """Verificar conexión a la base de datos"""
    print("\n📊 Verificando conexión a la base de datos...")
    
    try:
        import psycopg2
        
        # Usar variables de entorno o valores por defecto
        db_host = os.getenv('DB_HOST', 'localhost')
        db_name = os.getenv('DB_NAME', 'MovieMatch')
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD', 'admin')
        db_port = os.getenv('DB_PORT', '5432')
        
        print(f"🔌 Conectando a: {db_host}:{db_port}/{db_name}")
        
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
        
        print(f"✅ Conexión exitosa a la base de datos")
        print(f"📊 Datos disponibles:")
        print(f"   - Películas: {movie_count}")
        print(f"   - Calificaciones: {rating_count}")
        print(f"   - Usuarios: {user_count}")
        
        if movie_count == 0:
            print("⚠️ No hay películas en la base de datos")
            return False
        
        if rating_count == 0:
            print("⚠️ No hay calificaciones en la base de datos")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        print("💡 Asegúrate de que:")
        print("   1. PostgreSQL esté ejecutándose")
        print("   2. Las credenciales sean correctas")
        print("   3. La base de datos 'MovieMatch' exista")
        print("   4. Las tablas movies, users, user_movies estén creadas")
        return False

def train_knn_model():
    """Entrenar modelo KNN"""
    print("\n🤖 Entrenando modelo KNN con datos de la base de datos...")
    
    try:
        result = subprocess.run([
            sys.executable, "train_knn_model.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Modelo KNN entrenado exitosamente")
            return True
        else:
            print(f"❌ Error entrenando modelo: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error ejecutando entrenamiento: {e}")
        return False

def start_knn_api():
    """Iniciar API KNN"""
    print("\n🌐 Iniciando API KNN...")
    
    try:
        # Iniciar API en segundo plano
        process = subprocess.Popen([
            sys.executable, "knn_api.py"
        ], cwd=Path(__file__).parent)
        
        # Esperar a que la API esté lista
        print("⏳ Esperando a que la API esté lista...")
        time.sleep(3)
        
        # Verificar que la API esté funcionando
        try:
            response = requests.get("http://127.0.0.1:8001/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ API KNN iniciada correctamente en http://127.0.0.1:8001")
                print(f"📊 Estado: {data.get('status', 'unknown')}")
                return process
            else:
                print(f"❌ API no responde correctamente: {response.status_code}")
                process.terminate()
                return None
        except requests.exceptions.ConnectionError:
            print("❌ No se puede conectar a la API")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ Error iniciando API: {e}")
        return None

def test_system():
    """Probar el sistema completo"""
    print("\n🧪 Probando sistema completo...")
    
    try:
        result = subprocess.run([
            sys.executable, "test_knn_integration.py"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Sistema probado exitosamente")
            return True
        else:
            print(f"❌ Error en pruebas: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error ejecutando pruebas: {e}")
        return False

def show_next_steps():
    """Mostrar próximos pasos"""
    print("\n" + "="*60)
    print("🎉 ¡SISTEMA KNN CONFIGURADO EXITOSAMENTE!")
    print("="*60)
    print()
    print("📋 PRÓXIMOS PASOS:")
    print()
    print("1. 🌐 API KNN ejecutándose en: http://127.0.0.1:8001")
    print("2. 📊 Documentación: http://127.0.0.1:8001/docs")
    print("3. 🔍 Estado del servicio: http://127.0.0.1:8001/health")
    print("4. 📈 Estado del modelo: http://127.0.0.1:8001/model-status")
    print()
    print("🔧 INTEGRACIÓN CON TU SISTEMA:")
    print()
    print("Opción 1 - Integración automática:")
    print("   Modifica tu controlador de recomendaciones:")
    print("   import { integrateKNNWithExistingSystem } from './knn/knnApiService.js';")
    print()
    print("Opción 2 - Nueva ruta:")
    print("   Agrega en tus rutas:")
    print("   router.get('/user-recommendations-knn', authMiddleware, getUserRecommendationsWithKNN);")
    print()
    print("📚 DOCUMENTACIÓN COMPLETA:")
    print("   Lee el archivo README.md en la carpeta knn/")
    print()
    print("🛑 PARA DETENER LA API:")
    print("   Presiona Ctrl+C en esta terminal")
    print()
    print("💡 VENTAJAS DEL SISTEMA CON BD:")
    print("   ✅ Datos siempre actualizados desde la base de datos")
    print("   ✅ Consistencia con tu sistema existente")
    print("   ✅ Datos reales de usuarios activos")
    print("   ✅ No depende de archivos CSV")
    print()

def main():
    """Función principal"""
    print_header()
    
    # Verificar dependencias
    if not check_dependencies():
        return False
    
    # Verificar conexión a base de datos
    if not check_database_connection():
        return False
    
    # Entrenar modelo
    if not train_knn_model():
        return False
    
    # Iniciar API
    api_process = start_knn_api()
    if not api_process:
        return False
    
    # Probar sistema
    if not test_system():
        print("⚠️ Las pruebas fallaron, pero la API está funcionando")
    
    # Mostrar próximos pasos
    show_next_steps()
    
    try:
        # Mantener la API ejecutándose
        print("🔄 API KNN ejecutándose... (Presiona Ctrl+C para detener)")
        api_process.wait()
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo API KNN...")
        api_process.terminate()
        print("✅ API KNN detenida")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 