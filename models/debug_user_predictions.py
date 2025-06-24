import joblib
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Cargar variables de entorno (opcional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv no disponible, usando valores por defecto")

class UserPredictionDebugger:
    def __init__(self):
        self.model_data = None
        self.db_connection = None
        self.load_model()
        self.connect_db()
    
    def load_model(self):
        """Cargar el modelo entrenado"""
        try:
            self.model_data = joblib.load("balanced_recommender_model.pkl")
            print("✅ Modelo balanceado cargado")
            print(f"📊 Tipo de modelo: {self.model_data['model_info']['type']}")
            print(f"🎯 Características: {self.model_data['model_info']['features']}")
        except FileNotFoundError:
            print("❌ Modelo balanceado no encontrado")
            try:
                self.model_data = joblib.load("enhanced_recommender_model.pkl")
                print("✅ Modelo enhanced cargado")
            except:
                print("❌ No se pudo cargar ningún modelo")
                self.model_data = None
    
    def connect_db(self):
        """Conectar a la base de datos"""
        try:
            # Usar variables de entorno o valores por defecto
            db_host = os.getenv('DB_HOST', 'localhost')
            db_name = os.getenv('DB_NAME', 'MovieMatch')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'admin')
            db_port = os.getenv('DB_PORT', '5432')
            
            print(f"🔌 Conectando a: {db_host}:{db_port}/{db_name}")
            
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
            print("💡 Asegúrate de que PostgreSQL esté corriendo y las credenciales sean correctas")
            self.db_connection = None
    
    def get_user_data(self, user_id):
        """Obtener datos del usuario"""
        if not self.db_connection:
            return None
        
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Datos del usuario
                cursor.execute("""
                    SELECT id, name, favorite_genres, created_at
                    FROM users WHERE id = %s
                """, (user_id,))
                user = cursor.fetchone()
                
                if not user:
                    print(f"❌ Usuario {user_id} no encontrado")
                    return None
                
                # Calificaciones del usuario
                cursor.execute("""
                    SELECT um.movie_id, um.rating, m.title, m.genre_ids, m.vote_average
                    FROM user_movies um
                    JOIN movies m ON um.movie_id = m.id
                    WHERE um.user_id = %s AND um.rating IS NOT NULL
                    ORDER BY um.rating DESC
                """, (user_id,))
                ratings = cursor.fetchall()
                
                # Estadísticas del usuario
                cursor.execute("""
                    SELECT 
                        AVG(rating) as avg_rating,
                        COUNT(*) as total_rated,
                        MIN(rating) as min_rating,
                        MAX(rating) as max_rating
                    FROM user_movies 
                    WHERE user_id = %s AND rating IS NOT NULL
                """, (user_id,))
                stats = cursor.fetchone()
                
                return {
                    'user': user,
                    'ratings': ratings,
                    'stats': stats
                }
        except Exception as e:
            print(f"❌ Error obteniendo datos del usuario: {e}")
            return None
    
    def analyze_user_patterns(self, user_data):
        """Analizar patrones del usuario"""
        if not user_data:
            return
        
        user = user_data['user']
        ratings = user_data['ratings']
        stats = user_data['stats']
        
        print(f"\n🔍 ANÁLISIS DEL USUARIO {user['id']} ({user['name']})")
        print("=" * 60)
        
        print(f"📊 Géneros favoritos: {user['favorite_genres']}")
        print(f"📈 Estadísticas de calificación:")
        print(f"   - Promedio: {stats['avg_rating']:.2f}")
        print(f"   - Total calificadas: {stats['total_rated']}")
        print(f"   - Rango: {stats['min_rating']} - {stats['max_rating']}")
        
        # Analizar calificaciones por género
        genre_ratings = {}
        for rating in ratings:
            movie_genres = rating['genre_ids'] or []
            for genre in movie_genres:
                if genre not in genre_ratings:
                    genre_ratings[genre] = []
                genre_ratings[genre].append(rating['rating'])
        
        print(f"\n🎬 Calificaciones por género:")
        for genre, scores in genre_ratings.items():
            avg_score = np.mean(scores)
            print(f"   - Género {genre}: {avg_score:.2f} ({len(scores)} películas)")
        
        # Mostrar algunas calificaciones específicas
        print(f"\n📝 Últimas calificaciones:")
        for rating in ratings[:10]:
            print(f"   - {rating['title']}: {rating['rating']}/5 (géneros: {rating['genre_ids']})")
    
    def calculate_features_for_user(self, user_id, movie_ids):
        """Calcular características para películas específicas del usuario"""
        if not self.db_connection or not self.model_data:
            return None
        
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Obtener datos del usuario
                cursor.execute("""
                    SELECT favorite_genres 
                    FROM users WHERE id = %s
                """, (user_id,))
                user_result = cursor.fetchone()
                user_favorite_genres = user_result['favorite_genres'] or []
                
                # Obtener estadísticas del usuario
                cursor.execute("""
                    SELECT 
                        AVG(rating) as avg_user_rating,
                        COUNT(*) as user_num_rated
                    FROM user_movies 
                    WHERE user_id = %s AND rating IS NOT NULL
                """, (user_id,))
                user_stats = cursor.fetchone()
                avg_user_rating = float(user_stats['avg_user_rating'] or 3.5)
                user_num_rated = int(user_stats['user_num_rated'] or 0)
                
                features_list = []
                
                for movie_id in movie_ids:
                    # Obtener datos de la película
                    cursor.execute("""
                        SELECT genre_ids, vote_average, vote_count, release_date, popularity
                        FROM movies WHERE id = %s
                    """, (movie_id,))
                    movie = cursor.fetchone()
                    
                    if not movie:
                        continue
                    
                    movie_genres = movie['genre_ids'] or []
                    
                    # Calcular características
                    shared_genres = [g for g in user_favorite_genres if g in movie_genres]
                    n_shared_genres = len(shared_genres)
                    genre_match_ratio = len(shared_genres) / len(movie_genres) if movie_genres else 0
                    is_favorite_genre = 1 if n_shared_genres > 0 else 0
                    
                    # Años desde lanzamiento
                    current_year = 2024
                    release_year = 2020  # default
                    if movie['release_date']:
                        try:
                            release_year = int(str(movie['release_date'])[:4])
                        except:
                            pass
                    years_since_release = current_year - release_year
                    
                    # Verificar si fue recomendada
                    cursor.execute("""
                        SELECT 1 FROM movie_recommendations 
                        WHERE receiver_id = %s AND movie_id = %s
                    """, (user_id, movie_id))
                    was_recommended = 1 if cursor.fetchone() else 0
                    
                    features = {
                        'n_shared_genres': n_shared_genres,
                        'genre_match_ratio': round(genre_match_ratio, 3),
                        'vote_average': float(movie['vote_average'] or 0),
                        'vote_count': int(movie['vote_count'] or 0),
                        'popularity': float(movie['popularity'] or 0),
                        'years_since_release': years_since_release,
                        'is_favorite_genre': is_favorite_genre,
                        'was_recommended': was_recommended,
                        'avg_user_rating': round(avg_user_rating, 2),
                        'user_num_rated': user_num_rated
                    }
                    
                    features_list.append({
                        'movie_id': movie_id,
                        'features': features
                    })
                
                return features_list
                
        except Exception as e:
            print(f"❌ Error calculando características: {e}")
            return None
    
    def predict_for_user_movies(self, user_id):
        """Hacer predicciones para las películas calificadas por el usuario"""
        if not self.model_data:
            print("❌ No hay modelo cargado")
            return
        
        # Obtener datos del usuario
        user_data = self.get_user_data(user_id)
        if not user_data:
            return
        
        # Analizar patrones
        self.analyze_user_patterns(user_data)
        
        # Obtener IDs de películas calificadas
        movie_ids = [rating['movie_id'] for rating in user_data['ratings']]
        
        # Calcular características
        features_data = self.calculate_features_for_user(user_id, movie_ids[:20])  # Solo las primeras 20
        
        if not features_data:
            return
        
        print(f"\n🤖 PREDICCIONES DEL MODELO")
        print("=" * 60)
        
        # Preparar datos para el modelo
        features_list = [item['features'] for item in features_data]
        input_df = pd.DataFrame(features_list)
        
        # Escalar si es necesario
        if 'scaler' in self.model_data:
            input_df_scaled = self.model_data['scaler'].transform(input_df)
        else:
            input_df_scaled = input_df
        
        # Hacer predicciones
        predictions = self.model_data['model'].predict(input_df_scaled)
        probabilities = self.model_data['model'].predict_proba(input_df_scaled)
        
        # Comparar predicciones con calificaciones reales
        print(f"{'Película':<30} {'Real':<6} {'Pred':<6} {'Prob':<8} {'Match':<6}")
        print("-" * 60)
        
        matches = 0
        total = len(features_data)
        
        for i, item in enumerate(features_data):
            movie_id = item['movie_id']
            features = item['features']
            
            # Buscar calificación real
            real_rating = None
            for rating in user_data['ratings']:
                if rating['movie_id'] == movie_id:
                    real_rating = rating['rating']
                    break
            
            if real_rating is None:
                continue
            
            # Predicción del modelo
            pred = predictions[i]
            prob_like = probabilities[i][1] * 100
            
            # Determinar si coincide
            real_liked = real_rating >= 4  # Considerar 4+ como "me gustó"
            pred_liked = pred == 1
            match = "✅" if real_liked == pred_liked else "❌"
            
            if real_liked == pred_liked:
                matches += 1
            
            print(f"{f'ID {movie_id}':<30} {real_rating:<6} {pred:<6} {prob_like:<7.1f}% {match:<6}")
        
        accuracy = (matches / total) * 100 if total > 0 else 0
        print(f"\n📊 Precisión del modelo para este usuario: {accuracy:.1f}% ({matches}/{total})")
        
        # Análisis de características
        print(f"\n🔍 ANÁLISIS DE CARACTERÍSTICAS")
        print("=" * 60)
        
        if hasattr(self.model_data['model'], 'feature_importances_'):
            feature_names = self.model_data['model_info']['features']
            importances = self.model_data['model'].feature_importances_
            
            feature_importance = list(zip(feature_names, importances))
            feature_importance.sort(key=lambda x: x[1], reverse=True)
            
            print("Importancia de características:")
            for feature, importance in feature_importance:
                print(f"   - {feature}: {importance:.4f}")
    
    def close(self):
        """Cerrar conexiones"""
        if self.db_connection:
            self.db_connection.close()

def main():
    """Función principal"""
    print("🔍 DEBUGGER DE PREDICCIONES DE USUARIO")
    print("=" * 60)
    
    # Solicitar ID del usuario
    user_id = input("Ingresa el ID del usuario a analizar: ")
    
    try:
        user_id = int(user_id)
    except ValueError:
        print("❌ ID de usuario debe ser un número")
        return
    
    debugger = UserPredictionDebugger()
    
    try:
        debugger.predict_for_user_movies(user_id)
    except Exception as e:
        print(f"❌ Error durante el análisis: {e}")
        import traceback
        traceback.print_exc()
    finally:
        debugger.close()

if __name__ == "__main__":
    main() 