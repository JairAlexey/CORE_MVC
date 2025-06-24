import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import os
import numpy as np
from datetime import datetime

# Cargar variables de entorno
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

class TrainingDataExplainer:
    def __init__(self):
        self.db_connection = None
        self.connect_db()
        
    def connect_db(self):
        try:
            db_host = os.getenv('DB_HOST', 'localhost')
            db_name = os.getenv('DB_NAME', 'MovieMatch')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'admin')
            db_port = os.getenv('DB_PORT', '5432')
            
            self.db_connection = psycopg2.connect(
                host=db_host,
                database=db_name,
                user=db_user,
                password=db_password,
                port=db_port
            )
            print("✅ Conexión a base de datos establecida")
        except Exception as e:
            print(f"❌ Error conectando a la base de datos: {e}")
            self.db_connection = None

    def collect_training_data(self):
        """Recolecta los datos exactos que se usan para entrenar"""
        if not self.db_connection:
            return None
            
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                    SELECT 
                        u.id as user_id,
                        u.name as user_name,
                        u.favorite_genres,
                        m.id as movie_id,
                        m.title as movie_title,
                        m.genre_ids,
                        m.vote_average,
                        m.vote_count,
                        m.popularity,
                        EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM m.release_date) as years_since_release,
                        um.rating as user_rating,
                        um.comment,
                        -- Estadísticas del usuario
                        (SELECT AVG(rating) FROM user_movies WHERE user_id = u.id) as avg_user_rating,
                        (SELECT COUNT(*) FROM user_movies WHERE user_id = u.id) as user_num_rated
                    FROM users u
                    JOIN user_movies um ON u.id = um.user_id
                    JOIN movies m ON um.movie_id = m.id
                    WHERE u.favorite_genres IS NOT NULL
                    AND m.genre_ids IS NOT NULL
                    ORDER BY u.id, m.id
                """
                cursor.execute(query)
                data = cursor.fetchall()
                
                if not data:
                    print("❌ No se encontraron datos")
                    return None
                
                print(f"📊 Recolectados {len(data)} puntos de datos")
                return data
                
        except Exception as e:
            print(f"❌ Error recolectando datos: {e}")
            return None

    def process_features(self, data):
        """Procesa los datos para crear las características del modelo"""
        if not data:
            return None
            
        processed_data = []
        
        for row in data:
            # Calcular características de compatibilidad de géneros
            user_genres = set(row['favorite_genres'] or [])
            movie_genres = set(row['genre_ids'] or [])
            
            shared_genres = user_genres & movie_genres
            n_shared_genres = len(shared_genres)
            genre_match_ratio = len(shared_genres) / len(user_genres) if user_genres else 0
            is_favorite_genre = 1 if shared_genres else 0
            
            # Variable objetivo: 1 si le gustó (rating 4-5), 0 si no le gustó (rating 1-3)
            liked = 1 if row['user_rating'] >= 4 else 0
            
            processed_row = {
                'user_id': row['user_id'],
                'user_name': row['user_name'],
                'movie_id': row['movie_id'],
                'movie_title': row['movie_title'],
                'user_rating': float(row['user_rating']),
                'liked': liked,
                # Características de la película
                'vote_average': float(row['vote_average']),
                'vote_count': float(row['vote_count']),
                'popularity': float(row['popularity']),
                'years_since_release': float(row['years_since_release']),
                # Características del usuario
                'avg_user_rating': float(row['avg_user_rating']),
                'user_num_rated': float(row['user_num_rated']),
                # Características de compatibilidad
                'n_shared_genres': n_shared_genres,
                'genre_match_ratio': genre_match_ratio,
                'is_favorite_genre': is_favorite_genre,
                'was_recommended': 0,  # Siempre 0 en datos de entrenamiento
                # Información adicional para explicación
                'user_genres': list(user_genres),
                'movie_genres': list(movie_genres),
                'shared_genres': list(shared_genres),
                'comment': row['comment']
            }
            
            processed_data.append(processed_row)
        
        return processed_data

    def show_examples(self, data, num_examples=5):
        """Muestra ejemplos de los datos de entrenamiento"""
        print(f"\n🎬 EJEMPLOS DE DATOS DE ENTRENAMIENTO")
        print("=" * 80)
        
        for i, row in enumerate(data[:num_examples]):
            print(f"\n📊 Ejemplo {i+1}:")
            print(f"   👤 Usuario: {row['user_name']} (ID: {row['user_id']})")
            print(f"   🎭 Géneros favoritos: {row['user_genres']}")
            print(f"   🎬 Película: {row['movie_title']}")
            print(f"   🎭 Géneros de la película: {row['movie_genres']}")
            print(f"   ⭐ Calificación del usuario: {row['user_rating']}/5")
            print(f"   💬 Comentario: {row['comment'][:50]}...")
            print(f"   🎯 Le gustó (liked): {row['liked']} ({'SÍ' if row['liked'] else 'NO'})")
            print(f"   📊 Características:")
            print(f"      - Géneros compartidos: {row['n_shared_genres']}")
            print(f"      - Proporción de coincidencia: {row['genre_match_ratio']:.2f}")
            print(f"      - Es género favorito: {row['is_favorite_genre']}")
            print(f"      - Calificación promedio del usuario: {row['avg_user_rating']:.2f}")
            print(f"      - Películas calificadas por el usuario: {row['user_num_rated']}")
            print(f"      - Calificación promedio de la película: {row['vote_average']:.1f}")
            print(f"      - Popularidad: {row['popularity']:.1f}")
            print("-" * 60)

    def show_statistics(self, data):
        """Muestra estadísticas de los datos de entrenamiento"""
        df = pd.DataFrame(data)
        
        print(f"\n📈 ESTADÍSTICAS DE LOS DATOS DE ENTRENAMIENTO")
        print("=" * 60)
        print(f"Total de puntos de datos: {len(data)}")
        print(f"Usuarios únicos: {df['user_id'].nunique()}")
        print(f"Películas únicas: {df['movie_id'].nunique()}")
        
        print(f"\n🎯 Balance de clases:")
        liked_counts = df['liked'].value_counts()
        print(f"   No gustó (0): {liked_counts.get(0, 0)} ({liked_counts.get(0, 0)/len(df)*100:.1f}%)")
        print(f"   Gustó (1): {liked_counts.get(1, 0)} ({liked_counts.get(1, 0)/len(df)*100:.1f}%)")
        
        print(f"\n📊 Estadísticas de características:")
        numeric_features = ['n_shared_genres', 'genre_match_ratio', 'vote_average', 'vote_count', 
                           'popularity', 'years_since_release', 'avg_user_rating', 'user_num_rated']
        
        for feature in numeric_features:
            if feature in df.columns:
                mean_val = df[feature].mean()
                std_val = df[feature].std()
                print(f"   {feature}: {mean_val:.3f} ± {std_val:.3f}")

    def explain_why_it_works(self, data):
        """Explica por qué el modelo funciona bien"""
        df = pd.DataFrame(data)
        
        print(f"\n🤔 ¿POR QUÉ FUNCIONA TAN BIEN EL MODELO?")
        print("=" * 60)
        
        # 1. Correlación con géneros
        genre_corr = df['n_shared_genres'].corr(df['liked'])
        print(f"1. 📊 Correlación géneros compartidos vs 'le gustó': {genre_corr:.3f}")
        print(f"   → Cuantos más géneros compartidos, más probable que le guste")
        
        # 2. Correlación con calificación del usuario
        rating_corr = df['avg_user_rating'].corr(df['liked'])
        print(f"2. ⭐ Correlación calificación promedio del usuario vs 'le gustó': {rating_corr:.3f}")
        print(f"   → Usuarios que califican alto tienden a calificar alto")
        
        # 3. Correlación con calidad de la película
        quality_corr = df['vote_average'].corr(df['liked'])
        print(f"3. 🎬 Correlación calidad de película vs 'le gustó': {quality_corr:.3f}")
        print(f"   → Películas de mejor calidad tienden a gustar más")
        
        # 4. Ejemplos de patrones
        print(f"\n4. 🎯 Patrones encontrados:")
        
        # Usuarios que califican alto
        high_raters = df[df['avg_user_rating'] >= 4.5]
        if len(high_raters) > 0:
            high_raters_liked = high_raters['liked'].mean()
            print(f"   → Usuarios que califican alto (≥4.5): {high_raters_liked:.1%} de sus películas les gustan")
        
        # Películas de géneros favoritos
        favorite_genre = df[df['is_favorite_genre'] == 1]
        if len(favorite_genre) > 0:
            favorite_liked = favorite_genre['liked'].mean()
            print(f"   → Películas de géneros favoritos: {favorite_liked:.1%} les gustan")
        
        # Películas de alta calidad
        high_quality = df[df['vote_average'] >= 7.5]
        if len(high_quality) > 0:
            high_quality_liked = high_quality['liked'].mean()
            print(f"   → Películas de alta calidad (≥7.5): {high_quality_liked:.1%} les gustan")

    def save_to_csv(self, data, filename='training_data_for_model.csv'):
        """Guarda los datos procesados en un archivo CSV"""
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        print(f"\n💾 Datos guardados en: {filename}")

    def close(self):
        if self.db_connection:
            self.db_connection.close()

def main():
    print("🔍 EXPLICADOR DE DATOS DE ENTRENAMIENTO")
    print("=" * 60)
    
    explainer = TrainingDataExplainer()
    
    try:
        # Recolectar datos
        print("📊 Recolectando datos de entrenamiento...")
        raw_data = explainer.collect_training_data()
        
        if raw_data:
            # Procesar características
            print("🔄 Procesando características...")
            processed_data = explainer.process_features(raw_data)
            
            if processed_data:
                # Mostrar ejemplos
                explainer.show_examples(processed_data, 3)
                
                # Mostrar estadísticas
                explainer.show_statistics(processed_data)
                
                # Explicar por qué funciona
                explainer.explain_why_it_works(processed_data)
                
                # Guardar a CSV
                explainer.save_to_csv(processed_data)
                
                print(f"\n✅ Explicación completada!")
                print(f"📊 El modelo se entrena con {len(processed_data)} puntos de datos")
                print(f"🎯 Cada punto contiene 10 características + 1 objetivo")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        explainer.close()

if __name__ == "__main__":
    main() 