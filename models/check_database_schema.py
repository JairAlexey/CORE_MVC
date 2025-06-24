import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

def check_database_schema():
    try:
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
        
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verificar estructura de la tabla users
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            """)
            users_columns = cursor.fetchall()
            
            print("\n📋 ESTRUCTURA DE LA TABLA 'users':")
            print("=" * 50)
            for col in users_columns:
                print(f"   {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
            
            # Verificar estructura de la tabla user_movies
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'user_movies'
                ORDER BY ordinal_position
            """)
            user_movies_columns = cursor.fetchall()
            
            print("\n📋 ESTRUCTURA DE LA TABLA 'user_movies':")
            print("=" * 50)
            for col in user_movies_columns:
                print(f"   {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
            
            # Buscar columnas que contengan 'avatar' o 'gravatar'
            cursor.execute("""
                SELECT table_name, column_name, data_type
                FROM information_schema.columns 
                WHERE column_name ILIKE '%avatar%' OR column_name ILIKE '%gravatar%'
                ORDER BY table_name, column_name
            """)
            avatar_columns = cursor.fetchall()
            
            if avatar_columns:
                print("\n🖼️  COLUMNAS RELACIONADAS CON AVATAR:")
                print("=" * 50)
                for col in avatar_columns:
                    print(f"   {col['table_name']}.{col['column_name']}: {col['data_type']}")
            else:
                print("\n❌ No se encontraron columnas relacionadas con avatar")
            
            # Buscar columnas que contengan 'comment'
            cursor.execute("""
                SELECT table_name, column_name, data_type
                FROM information_schema.columns 
                WHERE column_name ILIKE '%comment%'
                ORDER BY table_name, column_name
            """)
            comment_columns = cursor.fetchall()
            
            if comment_columns:
                print("\n💬 COLUMNAS RELACIONADAS CON COMENTARIOS:")
                print("=" * 50)
                for col in comment_columns:
                    print(f"   {col['table_name']}.{col['column_name']}: {col['data_type']}")
            else:
                print("\n❌ No se encontraron columnas relacionadas con comentarios")
        
        connection.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS")
    print("=" * 60)
    check_database_schema() 