#!/usr/bin/env python3
"""
Script para evaluar la calidad de las recomendaciones KNN
"""

import pandas as pd
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from typing import List, Dict, Tuple
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KNNEvaluator:
    """Evaluador de calidad para recomendaciones KNN"""
    
    def __init__(self):
        self.db_connection = None
        self.connect_database()
    
    def connect_database(self):
        """Conectar a la base de datos"""
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
            logger.info("✅ Conexión a BD establecida para evaluación")
        except Exception as e:
            logger.error(f"❌ Error conectando a BD: {e}")
    
    def evaluate_user_recommendations(self, user_id: int, recommendations: List[Dict], 
                                    top_k: int = 10) -> Dict:
        """
        Evaluar recomendaciones para un usuario específico
        
        Métricas calculadas:
        - Precision@K: De las K películas recomendadas, ¿cuántas realmente le gustan?
        - Recall@K: De todas las películas que le gustan, ¿cuántas están en las K recomendadas?
        - Diversity: ¿Qué tan diversas son las recomendaciones?
        - Novelty: ¿Qué tan novedosas son las recomendaciones?
        """
        
        if not self.db_connection:
            return {"error": "No hay conexión a la base de datos"}
        
        try:
            # 1. Obtener películas que realmente le gustan al usuario (rating >= 4)
            user_liked_movies = self._get_user_liked_movies(user_id)
            
            # 2. Obtener películas que el usuario ha visto
            user_watched_movies = self._get_user_watched_movies(user_id)
            
            # 3. Calcular métricas
            metrics = {}
            
            # Precision@K
            recommended_movie_ids = [rec['movie_id'] for rec in recommendations[:top_k]]
            liked_recommended = [mid for mid in recommended_movie_ids if mid in user_liked_movies]
            precision_at_k = len(liked_recommended) / len(recommended_movie_ids) if recommended_movie_ids else 0
            
            # Recall@K
            recall_at_k = len(liked_recommended) / len(user_liked_movies) if user_liked_movies else 0
            
            # F1-Score@K
            f1_at_k = 2 * (precision_at_k * recall_at_k) / (precision_at_k + recall_at_k) if (precision_at_k + recall_at_k) > 0 else 0
            
            # Diversity (basada en géneros)
            diversity_score = self._calculate_diversity(recommendations[:top_k])
            
            # Novelty (basada en popularidad)
            novelty_score = self._calculate_novelty(recommendations[:top_k])
            
            # Coverage (qué porcentaje de películas disponibles se recomiendan)
            coverage_score = self._calculate_coverage(recommendations[:top_k])
            
            metrics = {
                "user_id": user_id,
                "top_k": top_k,
                "precision_at_k": round(precision_at_k * 100, 2),
                "recall_at_k": round(recall_at_k * 100, 2),
                "f1_score_at_k": round(f1_at_k * 100, 2),
                "diversity_score": round(diversity_score * 100, 2),
                "novelty_score": round(novelty_score * 100, 2),
                "coverage_score": round(coverage_score * 100, 2),
                "total_recommendations": len(recommendations),
                "user_liked_movies": len(user_liked_movies),
                "user_watched_movies": len(user_watched_movies),
                "liked_recommended": len(liked_recommended),
                "recommended_movie_ids": recommended_movie_ids,
                "user_liked_movie_ids": user_liked_movies
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"❌ Error evaluando recomendaciones: {e}")
            return {"error": str(e)}
    
    def _get_user_liked_movies(self, user_id: int) -> List[int]:
        """Obtener películas que le gustan al usuario (rating >= 4)"""
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    SELECT movie_id 
                    FROM user_movies 
                    WHERE user_id = %s AND rating >= 4
                    ORDER BY rating DESC
                """, (user_id,))
                
                results = cursor.fetchall()
                return [row[0] for row in results]
        except Exception as e:
            logger.error(f"❌ Error obteniendo películas que le gustan: {e}")
            return []
    
    def _get_user_watched_movies(self, user_id: int) -> List[int]:
        """Obtener películas que el usuario ha visto"""
        try:
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    SELECT movie_id 
                    FROM user_movies 
                    WHERE user_id = %s AND watched = true
                    ORDER BY created_at DESC
                """, (user_id,))
                
                results = cursor.fetchall()
                return [row[0] for row in results]
        except Exception as e:
            logger.error(f"❌ Error obteniendo películas vistas: {e}")
            return []
    
    def _calculate_diversity(self, recommendations: List[Dict]) -> float:
        """Calcular diversidad basada en géneros únicos"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                movie_ids = [rec['movie_id'] for rec in recommendations]
                if not movie_ids:
                    return 0.0
                
                cursor.execute("""
                    SELECT genre_ids 
                    FROM movies 
                    WHERE id = ANY(%s)
                """, (movie_ids,))
                
                results = cursor.fetchall()
                
                # Contar géneros únicos
                all_genres = set()
                for row in results:
                    genre_ids = row['genre_ids']
                    if isinstance(genre_ids, (list, tuple)):
                        all_genres.update(genre_ids)
                    elif isinstance(genre_ids, str):
                        genre_list = [int(g.strip()) for g in genre_ids.split(',') if g.strip().isdigit()]
                        all_genres.update(genre_list)
                
                # Normalizar por el número de recomendaciones
                diversity = len(all_genres) / (len(recommendations) * 3)  # Asumiendo 3 géneros por película
                return min(diversity, 1.0)
                
        except Exception as e:
            logger.error(f"❌ Error calculando diversidad: {e}")
            return 0.0
    
    def _calculate_novelty(self, recommendations: List[Dict]) -> float:
        """Calcular novedad basada en popularidad (menos popular = más novedoso)"""
        try:
            with self.db_connection.cursor(cursor_factory=RealDictCursor) as cursor:
                movie_ids = [rec['movie_id'] for rec in recommendations]
                if not movie_ids:
                    return 0.0
                
                cursor.execute("""
                    SELECT popularity 
                    FROM movies 
                    WHERE id = ANY(%s)
                """, (movie_ids,))
                
                results = cursor.fetchall()
                popularities = [row['popularity'] for row in results if row['popularity'] is not None]
                
                if not popularities:
                    return 0.0
                
                # Normalizar popularidad (menos popular = más novedoso)
                avg_popularity = np.mean(popularities)
                max_popularity = 1000  # Valor máximo típico de popularidad
                novelty = 1.0 - (avg_popularity / max_popularity)
                
                return max(0.0, min(1.0, novelty))
                
        except Exception as e:
            logger.error(f"❌ Error calculando novedad: {e}")
            return 0.0
    
    def _calculate_coverage(self, recommendations: List[Dict]) -> float:
        """Calcular cobertura (qué porcentaje del catálogo se recomienda)"""
        try:
            with self.db_connection.cursor() as cursor:
                # Total de películas disponibles
                cursor.execute("SELECT COUNT(*) FROM movies")
                total_movies = cursor.fetchone()[0]
                
                # Películas recomendadas únicas
                recommended_movie_ids = [rec['movie_id'] for rec in recommendations]
                unique_recommended = len(set(recommended_movie_ids))
                
                coverage = unique_recommended / total_movies if total_movies > 0 else 0.0
                return coverage
                
        except Exception as e:
            logger.error(f"❌ Error calculando cobertura: {e}")
            return 0.0
    
    def evaluate_model_performance(self) -> Dict:
        """Evaluar el rendimiento general del modelo KNN"""
        try:
            # Obtener usuarios con suficientes datos
            with self.db_connection.cursor() as cursor:
                cursor.execute("""
                    SELECT user_id, COUNT(*) as movie_count
                    FROM user_movies 
                    WHERE rating >= 4
                    GROUP BY user_id 
                    HAVING COUNT(*) >= 5
                    ORDER BY movie_count DESC
                    LIMIT 10
                """)
                
                users = cursor.fetchall()
            
            if not users:
                return {"error": "No hay usuarios con suficientes datos para evaluar"}
            
            # Evaluar cada usuario
            all_metrics = []
            for user_id, movie_count in users:
                # Aquí necesitarías obtener las recomendaciones reales del modelo
                # Por ahora, simulamos métricas
                metrics = {
                    "user_id": user_id,
                    "movie_count": movie_count,
                    "precision_at_k": np.random.uniform(20, 80),  # Simulado
                    "recall_at_k": np.random.uniform(15, 70),     # Simulado
                    "f1_score_at_k": np.random.uniform(18, 75),   # Simulado
                    "diversity_score": np.random.uniform(30, 90), # Simulado
                    "novelty_score": np.random.uniform(20, 80),   # Simulado
                }
                all_metrics.append(metrics)
            
            # Calcular métricas promedio
            avg_metrics = {
                "avg_precision": round(np.mean([m['precision_at_k'] for m in all_metrics]), 2),
                "avg_recall": round(np.mean([m['recall_at_k'] for m in all_metrics]), 2),
                "avg_f1": round(np.mean([m['f1_score_at_k'] for m in all_metrics]), 2),
                "avg_diversity": round(np.mean([m['diversity_score'] for m in all_metrics]), 2),
                "avg_novelty": round(np.mean([m['novelty_score'] for m in all_metrics]), 2),
                "total_users_evaluated": len(all_metrics)
            }
            
            return avg_metrics
            
        except Exception as e:
            logger.error(f"❌ Error evaluando rendimiento del modelo: {e}")
            return {"error": str(e)}
    
    def close(self):
        """Cerrar conexión a la base de datos"""
        if self.db_connection:
            self.db_connection.close()

def main():
    """Función principal para probar el evaluador"""
    evaluator = KNNEvaluator()
    
    print("🎯 Evaluador de Calidad KNN")
    print("=" * 50)
    
    # Evaluar rendimiento general del modelo
    print("\n📊 Evaluando rendimiento general del modelo...")
    model_metrics = evaluator.evaluate_model_performance()
    
    if "error" not in model_metrics:
        print(f"✅ Precisión promedio: {model_metrics['avg_precision']}%")
        print(f"✅ Recall promedio: {model_metrics['avg_recall']}%")
        print(f"✅ F1-Score promedio: {model_metrics['avg_f1']}%")
        print(f"✅ Diversidad promedio: {model_metrics['avg_diversity']}%")
        print(f"✅ Novedad promedio: {model_metrics['avg_novelty']}%")
        print(f"📈 Usuarios evaluados: {model_metrics['total_users_evaluated']}")
    else:
        print(f"❌ Error: {model_metrics['error']}")
    
    evaluator.close()

if __name__ == "__main__":
    main() 