from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import os
import sys
from pathlib import Path

# Agregar el directorio actual al path
sys.path.append(str(Path(__file__).parent))

from knn_service import EfficientKNNService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="MovieMatch KNN API",
    description="API de recomendaciones KNN eficiente para MovieMatch",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar servicio KNN
knn_service = None

def get_knn_service():
    """Dependency para obtener el servicio KNN"""
    global knn_service
    if knn_service is None:
        try:
            # Intentar cargar modelo existente
            model_path = "knn_model.pkl"
            data_path = "prepared_movies_for_knn.csv"
            
            if os.path.exists(model_path) and os.path.exists(data_path):
                knn_service = EfficientKNNService(
                    movies_data_path=data_path,
                    model_path=model_path
                )
                logger.info("✅ Servicio KNN cargado desde archivos existentes")
            else:
                logger.warning("⚠️ Archivos de modelo no encontrados, creando servicio vacío")
                knn_service = EfficientKNNService()
        except Exception as e:
            logger.error(f"❌ Error inicializando servicio KNN: {e}")
            knn_service = EfficientKNNService()
    
    return knn_service

# Modelos Pydantic
class SocialRecommendation(BaseModel):
    movie_id: int
    title: str
    rating: float
    recommenders: List[Dict] = []

class UserFeatures(BaseModel):
    user_id: int
    favorite_genres: List[int] = []
    avg_rating: float = 3.5
    total_rated: int = 0

class EfficientRecommendationRequest(BaseModel):
    social_recommendations: List[SocialRecommendation]
    user_features: UserFeatures

class SimilarMoviesRequest(BaseModel):
    movie_id: int
    top_k: int = 3

class MovieSimilarity(BaseModel):
    movie_id: int
    title: str
    similarity_score: float
    vote_average: float
    popularity: float

# Nuevos modelos para los endpoints que necesita el backend
class KNNRecommendationRequest(BaseModel):
    user_id: int
    limit: int = 10

class SimilarMoviesKNNRequest(BaseModel):
    movie_id: int
    limit: int = 5

class EvaluationRequest(BaseModel):
    user_id: int
    recommendations: List[Dict]
    top_k: int = 10

# Rutas de la API
@app.get("/")
def read_root():
    return {
        "message": "MovieMatch KNN API is running ✅",
        "version": "1.0.0",
        "description": "API de recomendaciones KNN eficiente"
    }

@app.get("/health")
def health_check():
    """Verificar estado del servicio KNN"""
    service = get_knn_service()
    status = service.get_model_status()
    
    return {
        "status": "healthy" if status['knn_loaded'] else "warning",
        "knn_service": status,
        "message": "KNN API funcionando correctamente" if status['knn_loaded'] else "Modelo KNN no cargado",
        "model_info": {
            "algorithm": "K-Nearest Neighbors",
            "total_movies": status.get('total_movies', 0),
            "neighbors": status.get('config', {}).get('knn_neighbors', 3),
            "features_used": len(status.get('feature_columns', [])),
            "model_loaded": status.get('knn_loaded', False),
            "database_connected": status.get('db_connected', False)
        }
    }

@app.post("/recommend")
def get_knn_recommendations(request: KNNRecommendationRequest):
    """Obtener recomendaciones KNN para un usuario específico"""
    try:
        service = get_knn_service()
        
        if not service.knn_model:
            raise HTTPException(status_code=503, detail="Modelo KNN no disponible")
        
        # Obtener recomendaciones KNN para el usuario
        recommendations = service.get_user_recommendations(
            user_id=request.user_id,
            limit=request.limit
        )
        
        return {
            "user_id": request.user_id,
            "recommendations": recommendations,
            "total_movies": len(service.movies_df) if service.movies_df is not None else 0,
            "neighbors_used": service.KNN_NEIGHBORS,
            "features_used": len(service.feature_columns) if hasattr(service, 'feature_columns') else 7
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo recomendaciones KNN: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/similar")
def get_similar_movies_knn(request: SimilarMoviesKNNRequest):
    """Obtener películas similares usando KNN"""
    try:
        service = get_knn_service()
        
        if not service.knn_model:
            raise HTTPException(status_code=503, detail="Modelo KNN no disponible")
        
        similar_movies = service.find_similar_movies(
            movie_id=request.movie_id,
            top_k=request.limit
        )
        
        return {
            "movie_id": request.movie_id,
            "similar_movies": similar_movies,
            "neighbors_used": service.KNN_NEIGHBORS
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo películas similares: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate")
def evaluate_recommendations(request: EvaluationRequest):
    """Evaluar la calidad de las recomendaciones KNN"""
    try:
        from knn_evaluation import KNNEvaluator
        
        evaluator = KNNEvaluator()
        
        # Evaluar las recomendaciones
        metrics = evaluator.evaluate_user_recommendations(
            user_id=request.user_id,
            recommendations=request.recommendations,
            top_k=request.top_k
        )
        
        evaluator.close()
        
        if "error" in metrics:
            raise HTTPException(status_code=400, detail=metrics["error"])
        
        return {
            "user_id": request.user_id,
            "evaluation_metrics": metrics,
            "summary": {
                "quality_score": round((metrics["precision_at_k"] + metrics["f1_score_at_k"]) / 2, 2),
                "recommendation": _get_quality_recommendation(metrics)
            }
        }
        
    except Exception as e:
        logger.error(f"Error evaluando recomendaciones: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _get_quality_recommendation(metrics: Dict) -> str:
    """Obtener recomendación de calidad basada en las métricas"""
    precision = metrics.get("precision_at_k", 0)
    f1_score = metrics.get("f1_score_at_k", 0)
    diversity = metrics.get("diversity_score", 0)
    
    if precision >= 70 and f1_score >= 60:
        return "🎯 Excelente calidad - Las recomendaciones son muy precisas"
    elif precision >= 50 and f1_score >= 40:
        return "👍 Buena calidad - Las recomendaciones son bastante precisas"
    elif precision >= 30 and f1_score >= 25:
        return "🤔 Calidad aceptable - Las recomendaciones podrían mejorar"
    else:
        return "⚠️ Calidad baja - Considera ajustar el modelo"

@app.post("/expand-recommendations")
def expand_social_recommendations(request: EfficientRecommendationRequest):
    """Expandir recomendaciones sociales con KNN (Estrategia 1 & 2)"""
    try:
        service = get_knn_service()
        
        # Convertir a formato interno
        social_recs = [
            {
                'movie_id': rec.movie_id,
                'title': rec.title,
                'rating': rec.rating,
                'recommenders': rec.recommenders
            }
            for rec in request.social_recommendations
        ]
        
        user_features = {
            'user_id': request.user_features.user_id,
            'favorite_genres': request.user_features.favorite_genres,
            'avg_rating': request.user_features.avg_rating,
            'total_rated': request.user_features.total_rated
        }
        
        # Expandir recomendaciones
        expanded_recs = service.expand_social_recommendations(social_recs)
        
        return {
            "original_count": len(social_recs),
            "expanded_count": len(expanded_recs),
            "expanded_recommendations": expanded_recs,
            "strategy_used": "knn_expansion" if len(social_recs) < service.MIN_SOCIAL_RECS_FOR_KNN else "social_only"
        }
        
    except Exception as e:
        logger.error(f"Error expandiendo recomendaciones: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/efficient-recommendations")
def get_efficient_recommendations(request: EfficientRecommendationRequest):
    """Obtener recomendaciones eficientes combinando las 3 estrategias"""
    try:
        service = get_knn_service()
        
        # Convertir a formato interno
        social_recs = [
            {
                'movie_id': rec.movie_id,
                'title': rec.title,
                'rating': rec.rating,
                'recommenders': rec.recommenders
            }
            for rec in request.social_recommendations
        ]
        
        user_features = {
            'user_id': request.user_features.user_id,
            'favorite_genres': request.user_features.favorite_genres,
            'avg_rating': request.user_features.avg_rating,
            'total_rated': request.user_features.total_rated
        }
        
        # Obtener recomendaciones eficientes
        final_recommendations = service.get_efficient_recommendations(social_recs, user_features)
        
        return {
            "original_count": len(social_recs),
            "final_count": len(final_recommendations),
            "recommendations": final_recommendations,
            "strategy_summary": {
                "social_recommendations": len(social_recs),
                "knn_activated": len(social_recs) < service.MIN_SOCIAL_RECS_FOR_KNN,
                "final_top_k": service.FINAL_TOP_K
            }
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo recomendaciones eficientes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-status")
def get_model_status():
    """Obtener estado detallado del modelo KNN"""
    service = get_knn_service()
    return service.get_model_status()

@app.post("/train-model")
def train_model():
    """Entrenar modelo KNN (endpoint para desarrollo)"""
    try:
        service = get_knn_service()
        
        if service.movies_df is None:
            raise HTTPException(status_code=400, detail="No hay datos de películas para entrenar")
        
        service.train_knn_model()
        service.save_knn_model("knn_model.pkl")
        
        status = service.get_model_status()
        
        return {
            "message": "Modelo KNN entrenado exitosamente",
            "model_status": status
        }
        
    except Exception as e:
        logger.error(f"Error entrenando modelo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Ejemplo de uso
@app.get("/example")
def get_example():
    """Ejemplo de cómo usar la API"""
    return {
        "example_request": {
            "social_recommendations": [
                {
                    "movie_id": 1,
                    "title": "Ejemplo Película",
                    "rating": 4.5,
                    "recommenders": [{"id": 1, "name": "Usuario1"}]
                }
            ],
            "user_features": {
                "user_id": 1,
                "favorite_genres": [28, 12],
                "avg_rating": 4.0,
                "total_rated": 50
            }
        },
        "endpoints": {
            "/similar-movies": "Encontrar películas similares",
            "/expand-recommendations": "Expandir recomendaciones sociales",
            "/efficient-recommendations": "Recomendaciones finales eficientes",
            "/model-status": "Estado del modelo KNN"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 