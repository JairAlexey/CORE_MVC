import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import logging
from typing import List, Dict, Tuple, Optional
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EfficientKNNService:
    """
    Servicio KNN eficiente que implementa las 3 estrategias para evitar sobrecargar el sistema:
    1. Limitar KNN a Top-N recomendaciones sociales
    2. Usar KNN solo si hay pocas recomendaciones sociales
    3. Controlar resultado final con Top-K ranking
    
    AHORA CONECTA DIRECTAMENTE A LA BASE DE DATOS
    """
    
    def __init__(self, model_path: str = None):
        self.movies_df = None
        self.knn_model = None
        self.scaler = StandardScaler()
        self.db_connection = None
        self.feature_columns = [
            'vote_average', 'vote_count', 'popularity', 'years_since_release',
            'genre_diversity', 'avg_user_rating', 'user_rating_count'
        ]
        
        # Configuraciones para controlar el uso de recursos
        self.MAX_KNN_MOVIES = 20  # Máximo de películas para aplicar KNN
        self.MIN_SOCIAL_RECS_FOR_KNN = 15  # Mínimo de recomendaciones sociales para activar KNN
        self.FINAL_TOP_K = 10  # Top-K final para el usuario
        self.KNN_NEIGHBORS = 3  # Número de vecinos para KNN
        
        # Conectar a la base de datos
        self.connect_database()
        
        # Cargar modelo si está disponible
        if model_path and os.path.exists(model_path):
            self.load_knn_model(model_path)
        else:
            self.load_movies_from_database()
            self.train_knn_model()
    
    def connect_database(self):
        """Conectar a la base de datos PostgreSQL"""
        try:
            # Usar variables de entorno o valores por defecto
            db_host = os.getenv('DB_HOST', 'localhost')
            db_name = os.getenv('DB_NAME', 'MovieMatch')
            db_user = os.getenv('DB_USER', 'postgres')
            db_password = os.getenv('DB_PASSWORD', 'admin')
            db_port = os.getenv('DB_PORT', '5432')
            
            logger.info(f"🔌 Conectando a BD: {db_host}:{db_port}/{db_name}")
            
            self.db_connection = psycopg2.connect(
                host=db_host,
                database=db_name,
                user=db_user,
                password=db_password,
                port=db_port
            )
            logger.info("✅ Conexión a base de datos establecida")
            
        except Exception as e:
            logger.error(f"❌ Error conectando a la base de datos: {e}")
            logger.error("💡 Asegúrate de que PostgreSQL esté corriendo y las credenciales sean correctas")
            self.db_connection = None
    
    def load_movies_from_database(self):
        """Cargar datos de películas directamente desde la base de datos"""
        if not self.db_connection:
            logger.error("❌ No hay conexión a la base de datos")
            return
        
        try:
            logger.info("📊 Cargando películas desde la base de datos...")
            
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Obtener todas las películas con sus características
                cursor.execute("""
                    SELECT 
                        m.id,
                        m.title,
                        m.genre_ids,
                        m.vote_average,
                        m.vote_count,
                        m.release_date,
                        m.popularity,
                        m.overview,
                        m.poster_path
                    FROM movies m
                    WHERE m.vote_average IS NOT NULL
                    AND m.vote_count IS NOT NULL
                    ORDER BY m.vote_count DESC
                """)
                
                movies = cursor.fetchall()
                logger.info(f"✅ {len(movies)} películas cargadas desde la BD")
                
                # Convertir a DataFrame
                self.movies_df = pd.DataFrame(movies)
                
                # Preparar características para KNN
                self._prepare_features_from_db()
                
        except Exception as e:
            logger.error(f"❌ Error cargando películas desde BD: {e}")
            self.movies_df = None
    
    def _prepare_features_from_db(self):
        """Preparar características para el modelo KNN desde datos de BD"""
        if self.movies_df is None or len(self.movies_df) == 0:
            return
        
        logger.info("🔧 Preparando características desde datos de BD...")
        
        # Calcular características adicionales
        current_year = pd.Timestamp.now().year
        
        # Años desde el lanzamiento
        self.movies_df['years_since_release'] = current_year - pd.to_datetime(
            self.movies_df['release_date'], errors='coerce'
        ).dt.year.fillna(current_year)
        
        # Diversidad de géneros (número de géneros únicos) - ROBUSTO Y LOG DE EJEMPLOS
        def count_genres(genre_val):
            try:
                if pd.isna(genre_val) or genre_val is None:
                    return 1
                if isinstance(genre_val, str):
                    return len([g.strip() for g in genre_val.split(',') if g.strip()])
                if isinstance(genre_val, (list, tuple)):
                    return len(genre_val)
                if hasattr(genre_val, 'tolist'):
                    # numpy array u objeto similar
                    return len(genre_val.tolist())
                # Si es un número o cualquier otro tipo
                return 1
            except Exception as e:
                logger.warning(f"[KNN] Valor inesperado en genre_ids: {repr(genre_val)} - {e}")
                return 1
        
        # Log de ejemplos de genre_ids
        logger.info(f"Ejemplo de genre_ids: {self.movies_df['genre_ids'].head(5).tolist()}")
        self.movies_df['genre_diversity'] = self.movies_df['genre_ids'].apply(count_genres)
        
        # Obtener estadísticas de usuarios para cada película
        self._add_user_statistics()
        
        # Rellenar valores faltantes
        for col in self.feature_columns:
            if col in self.movies_df.columns:
                self.movies_df[col] = self.movies_df[col].fillna(self.movies_df[col].median())
        
        logger.info("✅ Características preparadas desde BD")
    
    def _add_user_statistics(self):
        """Agregar estadísticas de usuarios para cada película"""
        if not self.db_connection:
            return
        
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Obtener estadísticas de usuarios por película
                cursor.execute("""
                    SELECT 
                        movie_id,
                        AVG(rating) as avg_user_rating,
                        COUNT(*) as user_rating_count
                    FROM user_movies 
                    WHERE rating IS NOT NULL
                    GROUP BY movie_id
                """)
                
                user_stats = cursor.fetchall()
                user_stats_df = pd.DataFrame(user_stats)
                
                if len(user_stats_df) > 0:
                    # Merge con películas
                    self.movies_df = self.movies_df.merge(
                        user_stats_df, 
                        left_on='id', 
                        right_on='movie_id', 
                        how='left'
                    )
                    # Forzar conversión de tipos para evitar errores con Decimals
                    self.movies_df['avg_user_rating'] = self.movies_df['avg_user_rating'].astype(float).fillna(5.0)
                    self.movies_df['user_rating_count'] = self.movies_df['user_rating_count'].astype(int).fillna(0)
                    
                    logger.info(f"✅ Estadísticas de usuarios agregadas para {len(user_stats_df)} películas")
                else:
                    # Si no hay estadísticas, crear columnas por defecto
                    self.movies_df['avg_user_rating'] = 5.0
                    self.movies_df['user_rating_count'] = 0
                    logger.warning("⚠️ No hay estadísticas de usuarios disponibles")
                    
        except Exception as e:
            logger.error(f"❌ Error agregando estadísticas de usuarios: {e}")
            # Crear columnas por defecto
            self.movies_df['avg_user_rating'] = 5.0
            self.movies_df['user_rating_count'] = 0
    
    def train_knn_model(self):
        """Entrenar modelo KNN con los datos de la base de datos"""
        if self.movies_df is None or len(self.movies_df) < 10:
            logger.warning("⚠️ No hay suficientes datos de películas para entrenar KNN")
            return
        
        try:
            # Seleccionar características disponibles
            available_features = [col for col in self.feature_columns if col in self.movies_df.columns]
            
            if len(available_features) < 3:
                logger.warning(f"⚠️ Pocas características disponibles: {available_features}")
                return
            
            # Preparar datos para entrenamiento
            X = self.movies_df[available_features].values
            
            # Escalar características
            X_scaled = self.scaler.fit_transform(X)
            
            # Entrenar modelo KNN
            self.knn_model = NearestNeighbors(
                n_neighbors=min(self.KNN_NEIGHBORS + 1, len(X_scaled)),
                algorithm='auto',
                metric='cosine'
            )
            self.knn_model.fit(X_scaled)
            
            logger.info(f"✅ Modelo KNN entrenado con {len(available_features)} características")
            logger.info(f"📊 Datos de entrenamiento: {len(X_scaled)} películas")
            
        except Exception as e:
            logger.error(f"❌ Error entrenando modelo KNN: {e}")
            self.knn_model = None
    
    def save_knn_model(self, model_path: str):
        """Guardar modelo KNN entrenado"""
        if self.knn_model is None:
            logger.warning("⚠️ No hay modelo KNN para guardar")
            return
        
        try:
            model_data = {
                'knn_model': self.knn_model,
                'scaler': self.scaler,
                'feature_columns': self.feature_columns,
                'movies_df': self.movies_df,
                'db_connected': self.db_connection is not None
            }
            joblib.dump(model_data, model_path)
            logger.info(f"✅ Modelo KNN guardado en {model_path}")
            
        except Exception as e:
            logger.error(f"❌ Error guardando modelo KNN: {e}")
    
    def load_knn_model(self, model_path: str):
        """Cargar modelo KNN guardado"""
        try:
            model_data = joblib.load(model_path)
            self.knn_model = model_data['knn_model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['feature_columns']
            self.movies_df = model_data['movies_df']
            
            logger.info(f"✅ Modelo KNN cargado desde {model_path}")
            
            # Si no hay conexión a BD, intentar reconectar
            if not self.db_connection and not model_data.get('db_connected', False):
                logger.info("🔄 Reconectando a la base de datos...")
                self.connect_database()
            
        except Exception as e:
            logger.error(f"❌ Error cargando modelo KNN: {e}")
            # Intentar cargar desde BD
            self.load_movies_from_database()
            self.train_knn_model()
    
    def find_similar_movies(self, movie_id: int, top_k: int = 3) -> List[Dict]:
        """Encontrar películas similares usando KNN"""
        if self.knn_model is None or self.movies_df is None:
            logger.warning("⚠️ Modelo KNN no disponible")
            return []
        
        try:
            # Encontrar la película en el dataset
            movie_idx = self.movies_df[self.movies_df['id'] == movie_id].index
            if len(movie_idx) == 0:
                logger.warning(f"⚠️ Película {movie_id} no encontrada en el dataset")
                return []
            
            movie_idx = movie_idx[0]
            
            # Obtener características de la película
            movie_features = self.movies_df[self.feature_columns].iloc[movie_idx:movie_idx+1]
            
            # Encontrar vecinos más cercanos
            distances, indices = self.knn_model.kneighbors(movie_features)
            
            # Obtener películas similares (excluyendo la película original)
            similar_movies = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                if idx != movie_idx and i < top_k:
                    movie_data = self.movies_df.iloc[idx]
                    similar_movies.append({
                        'movie_id': int(movie_data['id']),
                        'title': movie_data['title'],
                        'similarity': 1.0 / (1.0 + distance),  # Convertir distancia a similitud
                        'vote_average': float(movie_data['vote_average']),
                        'popularity': float(movie_data['popularity'])
                    })
            
            logger.info(f"✅ {len(similar_movies)} películas similares encontradas para {movie_id}")
            return similar_movies
            
        except Exception as e:
            logger.error(f"❌ Error encontrando películas similares: {e}")
            return []

    def get_user_recommendations(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Obtener recomendaciones KNN para un usuario específico"""
        if self.knn_model is None or self.movies_df is None:
            logger.warning("⚠️ Modelo KNN no disponible")
            return []
        
        try:
            # Obtener películas que el usuario ya ha visto
            user_watched_movies = self._get_user_watched_movies(user_id)
            
            if len(user_watched_movies) == 0:
                logger.info(f"📝 Usuario {user_id} no tiene películas vistas, recomendando películas populares")
                return self._get_popular_movies_recommendations(limit)
            
            # Obtener características del usuario basadas en sus películas vistas
            user_features = self._calculate_user_features(user_id, user_watched_movies)
            
            # Encontrar películas similares a las que le gustan al usuario
            recommendations = []
            for movie_id in user_watched_movies[:5]:  # Usar solo las primeras 5 películas
                similar_movies = self.find_similar_movies(movie_id, top_k=limit//2)
                recommendations.extend(similar_movies)
            
            # Eliminar duplicados y películas ya vistas
            seen_movie_ids = set(user_watched_movies)
            unique_recommendations = []
            seen_recommended = set()
            
            for rec in recommendations:
                if rec['movie_id'] not in seen_movie_ids and rec['movie_id'] not in seen_recommended:
                    unique_recommendations.append(rec)
                    seen_recommended.add(rec['movie_id'])
                    if len(unique_recommendations) >= limit:
                        break
            
            # Si no hay suficientes recomendaciones, agregar películas populares
            if len(unique_recommendations) < limit:
                popular_movies = self._get_popular_movies_recommendations(limit - len(unique_recommendations))
                for movie in popular_movies:
                    if movie['movie_id'] not in seen_movie_ids and movie['movie_id'] not in seen_recommended:
                        unique_recommendations.append(movie)
                        seen_recommended.add(movie['movie_id'])
                        if len(unique_recommendations) >= limit:
                            break
            
            logger.info(f"✅ {len(unique_recommendations)} recomendaciones KNN generadas para usuario {user_id}")
            return unique_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo recomendaciones para usuario {user_id}: {e}")
            return self._get_popular_movies_recommendations(limit)

    def _get_user_watched_movies(self, user_id: int) -> List[int]:
        """Obtener películas que el usuario ha visto"""
        if not self.db_connection:
            return []
        
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    SELECT movie_id 
                    FROM user_movies 
                    WHERE user_id = %s AND watched = true
                    ORDER BY rating DESC, created_at DESC
                """, (user_id,))
                
                results = cursor.fetchall()
                return [row[0] for row in results]
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo películas vistas del usuario {user_id}: {e}")
            return []

    def _calculate_user_features(self, user_id: int, watched_movies: List[int]) -> Dict:
        """Calcular características del usuario basadas en sus películas vistas"""
        if not watched_movies or self.movies_df is None:
            return {}
        
        try:
            # Obtener datos de las películas vistas
            watched_data = self.movies_df[self.movies_df['id'].isin(watched_movies)]
            
            if len(watched_data) == 0:
                return {}
            
            # Calcular características promedio del usuario
            user_features = {
                'avg_vote_average': float(watched_data['vote_average'].mean()),
                'avg_popularity': float(watched_data['popularity'].mean()),
                'preferred_genres': self._get_preferred_genres(watched_data),
                'avg_years_since_release': float(watched_data['years_since_release'].mean())
            }
            
            return user_features
            
        except Exception as e:
            logger.error(f"❌ Error calculando características del usuario {user_id}: {e}")
            return {}

    def _get_preferred_genres(self, movies_data: pd.DataFrame) -> List[int]:
        """Obtener géneros preferidos del usuario"""
        try:
            all_genres = []
            for genre_ids in movies_data['genre_ids']:
                if isinstance(genre_ids, (list, tuple)):
                    all_genres.extend(genre_ids)
                elif isinstance(genre_ids, str):
                    # Convertir string a lista de IDs
                    genre_list = [int(g.strip()) for g in genre_ids.split(',') if g.strip().isdigit()]
                    all_genres.extend(genre_list)
            
            # Contar frecuencia de géneros
            from collections import Counter
            genre_counts = Counter(all_genres)
            
            # Retornar los 3 géneros más frecuentes
            return [genre for genre, count in genre_counts.most_common(3)]
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo géneros preferidos: {e}")
            return []

    def _get_popular_movies_recommendations(self, limit: int) -> List[Dict]:
        """Obtener recomendaciones basadas en películas populares"""
        if self.movies_df is None:
            return []
        
        try:
            # Ordenar por popularidad y calificación
            popular_movies = self.movies_df.nlargest(limit * 2, 'popularity')
            popular_movies = popular_movies.nlargest(limit, 'vote_average')
            
            recommendations = []
            for _, movie in popular_movies.iterrows():
                recommendations.append({
                    'movie_id': int(movie['id']),
                    'title': movie['title'],
                    'similarity': 0.5,  # Similitud neutral para películas populares
                    'vote_average': float(movie['vote_average']),
                    'popularity': float(movie['popularity'])
                })
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo películas populares: {e}")
            return []
    
    def expand_social_recommendations(self, social_recommendations: List[Dict]) -> List[Dict]:
        """
        Estrategia 2: Expandir recomendaciones sociales con KNN solo si es necesario
        """
        if not social_recommendations:
            return []
        
        # Ordenar recomendaciones sociales por rating
        sorted_social = sorted(social_recommendations, 
                             key=lambda r: r.get('rating', 0), reverse=True)
        
        # Aplicar KNN solo si hay pocas recomendaciones sociales
        if len(sorted_social) < self.MIN_SOCIAL_RECS_FOR_KNN:
            logger.info(f"🔍 Pocas recomendaciones sociales ({len(sorted_social)}), activando KNN")
            
            # Tomar solo las mejores para aplicar KNN
            top_social = sorted_social[:self.MAX_KNN_MOVIES]
            
            expanded_recs = []
            for movie in top_social:
                # Agregar la película original
                expanded_recs.append({
                    'movie_id': movie['movie_id'],
                    'title': movie['title'],
                    'source': 'social',
                    'rating': movie.get('rating', 0),
                    'recommenders': movie.get('recommenders', [])
                })
                
                # Buscar películas similares
                similar_movies = self.find_similar_movies(movie['movie_id'], top_k=2)
                for similar in similar_movies:
                    expanded_recs.append({
                        'movie_id': similar['movie_id'],
                        'title': similar['title'],
                        'source': 'knn_expansion',
                        'similarity_score': similar['similarity'],
                        'original_movie': movie['title'],
                        'vote_average': similar['vote_average'],
                        'popularity': similar['popularity'],
                        'avg_user_rating': similar['vote_average'],
                        'user_rating_count': 0
                    })
            
            # Eliminar duplicados
            seen_movies = set()
            unique_expanded = []
            for rec in expanded_recs:
                if rec['movie_id'] not in seen_movies:
                    seen_movies.add(rec['movie_id'])
                    unique_expanded.append(rec)
            
            logger.info(f"✅ Recomendaciones expandidas: {len(unique_expanded)} (originales: {len(sorted_social)})")
            return unique_expanded
        
        else:
            logger.info(f"✅ Suficientes recomendaciones sociales ({len(sorted_social)}), KNN no necesario")
            return sorted_social
    
    def rank_recommendations_with_ml(self, recommendations: List[Dict], 
                                   user_features: Dict) -> List[Dict]:
        """
        Estrategia 3: Usar RandomForest para ranking final
        """
        if not recommendations:
            return []
        
        try:
            # Simular scoring con RandomForest (aquí usarías tu modelo real)
            scored_recommendations = []
            
            for rec in recommendations:
                score = 0
                
                # Scoring basado en fuente
                if rec.get('source') == 'social':
                    score += rec.get('rating', 0) * 0.4  # Rating social tiene peso alto
                    score += len(rec.get('recommenders', [])) * 0.1  # Más recomendadores = mejor
                elif rec.get('source') == 'knn_expansion':
                    score += rec.get('similarity_score', 0) * 0.3  # Similitud KNN
                
                # Scoring basado en características de la película
                score += (rec.get('vote_average', 0) / 10) * 0.2
                score += min(rec.get('popularity', 0) / 200, 1) * 0.1
                
                # Scoring basado en estadísticas de usuarios
                score += (rec.get('avg_user_rating', 5.0) / 5) * 0.1
                score += min(rec.get('user_rating_count', 0) / 100, 1) * 0.05
                
                scored_recommendations.append({
                    **rec,
                    'ml_score': score
                })
            
            # Ordenar por score y tomar top-K
            final_ranking = sorted(scored_recommendations, 
                                 key=lambda r: r['ml_score'], reverse=True)[:self.FINAL_TOP_K]
            
            logger.info(f"✅ Ranking final generado: {len(final_ranking)} películas")
            return final_ranking
            
        except Exception as e:
            logger.error(f"❌ Error en ranking con ML: {e}")
            # Fallback: ordenar por rating social
            return sorted(recommendations, 
                         key=lambda r: r.get('rating', 0), reverse=True)[:self.FINAL_TOP_K]
    
    def get_efficient_recommendations(self, social_recommendations: List[Dict], 
                                    user_features: Dict) -> List[Dict]:
        """
        Método principal que implementa las 3 estrategias combinadas
        """
        logger.info(f"🚀 Iniciando recomendaciones eficientes con KNN")
        logger.info(f"📊 Recomendaciones sociales iniciales: {len(social_recommendations)}")
        
        # Estrategia 1 & 2: Expandir con KNN solo si es necesario
        expanded_recs = self.expand_social_recommendations(social_recommendations)
        
        # Estrategia 3: Ranking final con ML
        final_recommendations = self.rank_recommendations_with_ml(expanded_recs, user_features)
        
        logger.info(f"🎉 Recomendaciones finales generadas: {len(final_recommendations)}")
        
        return final_recommendations
    
    def get_model_status(self) -> Dict:
        """Obtener estado del modelo KNN"""
        return {
            'knn_loaded': self.knn_model is not None,
            'movies_loaded': self.movies_df is not None,
            'total_movies': len(self.movies_df) if self.movies_df is not None else 0,
            'db_connected': self.db_connection is not None,
            'feature_columns': self.feature_columns,
            'config': {
                'max_knn_movies': self.MAX_KNN_MOVIES,
                'min_social_recs_for_knn': self.MIN_SOCIAL_RECS_FOR_KNN,
                'final_top_k': self.FINAL_TOP_K,
                'knn_neighbors': self.KNN_NEIGHBORS
            }
        }
    
    def close(self):
        """Cerrar conexiones"""
        if self.db_connection:
            self.db_connection.close()
            logger.info("✅ Conexión a base de datos cerrada") 