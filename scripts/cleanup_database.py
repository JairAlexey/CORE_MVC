import psycopg2
import os

# Cargar variables de entorno (opcional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

def cleanup_database():
    """Limpiar toda la base de datos de usuarios y sus datos relacionados"""
    
    # Configuración de la base de datos
    db_host = os.getenv('DB_HOST', 'switchyard.proxy.rlwy.net')
    db_name = os.getenv('DB_NAME', 'railway')
    db_user = os.getenv('DB_USER', 'postgres')
    db_password = os.getenv('DB_PASSWORD', 'vdphatjluNLYdQuzOIofuSMYQvxGnQgx')
    db_port = os.getenv('DB_PORT', '43162')
    
    try:
        # Conectar a la base de datos
        print(f"🔌 Conectando a: {db_host}:{db_port}/{db_name}")
        connection = psycopg2.connect(
            host=db_host,
            database=db_name,
            user=db_user,
            password=db_password,
            port=db_port
        )
        
        with connection.cursor() as cursor:
            print("🧹 Iniciando limpieza de la base de datos...")
            
            # 1. Contar registros antes de eliminar
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_movies")
            rating_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_connections")
            connection_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM movie_recommendations")
            recommendation_count = cursor.fetchone()[0]
            
            print(f"📊 Datos encontrados:")
            print(f"   - Usuarios: {user_count}")
            print(f"   - Calificaciones: {rating_count}")
            print(f"   - Conexiones: {connection_count}")
            print(f"   - Recomendaciones: {recommendation_count}")
            
            # Confirmar antes de eliminar
            confirm = input("\n⚠️  ¿Estás seguro de que quieres eliminar TODOS estos datos? (sí/no): ")
            if confirm.lower() not in ['sí', 'si', 'yes', 'y', 's']:
                print("❌ Operación cancelada")
                return
            
            print("\n🗑️  Eliminando datos...")
            
            # 2. Eliminar recomendaciones de películas
            cursor.execute("DELETE FROM movie_recommendations")
            recommendations_deleted = cursor.rowcount
            print(f"   ✅ {recommendations_deleted} recomendaciones eliminadas")
            
            # 3. Eliminar conexiones de usuario
            cursor.execute("DELETE FROM user_connections")
            connections_deleted = cursor.rowcount
            print(f"   ✅ {connections_deleted} conexiones eliminadas")
            
            # 4. Eliminar calificaciones de películas
            cursor.execute("DELETE FROM user_movies")
            ratings_deleted = cursor.rowcount
            print(f"   ✅ {ratings_deleted} calificaciones eliminadas")
            
            # 5. Finalmente, eliminar los usuarios
            cursor.execute("DELETE FROM users")
            users_deleted = cursor.rowcount
            print(f"   ✅ {users_deleted} usuarios eliminados")
            
            # Confirmar cambios
            connection.commit()
            
            print(f"\n🎉 ¡Limpieza completada exitosamente!")
            print(f"📊 Resumen de eliminación:")
            print(f"   - Usuarios eliminados: {users_deleted}")
            print(f"   - Calificaciones eliminadas: {ratings_deleted}")
            print(f"   - Conexiones eliminadas: {connections_deleted}")
            print(f"   - Recomendaciones eliminadas: {recommendations_deleted}")
            
            # Verificar que todo esté limpio
            cursor.execute("SELECT COUNT(*) FROM users")
            remaining_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_movies")
            remaining_ratings = cursor.fetchone()[0]
            
            print(f"\n✅ Verificación final:")
            print(f"   - Usuarios restantes: {remaining_users}")
            print(f"   - Calificaciones restantes: {remaining_ratings}")
            
            if remaining_users == 0 and remaining_ratings == 0:
                print("🎯 Base de datos completamente limpia")
            else:
                print("⚠️  Algunos datos aún permanecen")
        
    except Exception as e:
        print(f"❌ Error durante la limpieza: {e}")
        if 'connection' in locals():
            connection.rollback()
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    print("🧹 LIMPIADOR DE BASE DE DATOS")
    print("=" * 50)
    cleanup_database() 