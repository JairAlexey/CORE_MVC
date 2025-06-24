from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
from typing import List
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="MovieMatch ML API",
    description="API de recomendaciones de películas usando Machine Learning Mejorado",
    version="2.0.0"
)

# Configurar CORS para permitir múltiples aplicaciones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el modelo balanceado de forma segura
model_data = None
try:
    # Intentar cargar el modelo mejorado primero
    model_data = joblib.load("improved_recommender_model.pkl")
    logger.info("✅ Modelo mejorado cargado exitosamente")
    logger.info(f"📊 Características del modelo: {model_data['model_info']['features']}")
    logger.info(f"🎯 Entrenado con datos reales: {model_data['model_info'].get('real_data_training', False)}")
except FileNotFoundError:
    try:
        # Fallback al modelo balanceado
        model_data = joblib.load("balanced_recommender_model.pkl")
        logger.info("✅ Modelo balanceado cargado exitosamente")
    except FileNotFoundError:
        try:
            # Fallback al modelo original
            model_data = joblib.load("enhanced_recommender_model.pkl")
            logger.info("✅ Modelo original cargado exitosamente")
        except Exception as e:
            logger.error(f"❌ Error cargando modelos: {e}")
            model_data = None

# Definir la estructura de entrada con características mejoradas
class PredictionRequest(BaseModel):
    n_shared_genres: int
    genre_match_ratio: float
    vote_average: float
    vote_count: int
    popularity: float
    years_since_release: int
    is_favorite_genre: int
    was_recommended: int
    avg_user_rating: float
    user_num_rated: int

# Nueva estructura para predicción en lote
class MovieFeatures(BaseModel):
    movie_id: int
    n_shared_genres: int
    genre_match_ratio: float
    vote_average: float
    vote_count: int
    popularity: float
    years_since_release: int
    is_favorite_genre: int
    was_recommended: int
    avg_user_rating: float
    user_num_rated: int

class BatchPredictionRequest(BaseModel):
    movies: List[MovieFeatures]

def simple_prediction(features):
    """Predicción simple como fallback si el modelo no está disponible"""
    # Algoritmo mejorado de scoring
    score = 0
    
    # Géneros (30%)
    score += features['n_shared_genres'] * 0.15
    score += features['genre_match_ratio'] * 0.10
    score += features['is_favorite_genre'] * 0.05
    
    # Metadatos de la película (40%)
    score += (features['vote_average'] / 10) * 0.20
    score += min(features['vote_count'] / 10000, 1) * 0.10
    score += min(features['popularity'] / 200, 1) * 0.10
    
    # Contexto temporal (10%)
    score += max(0, (10 - features['years_since_release']) / 10) * 0.10
    
    # Contexto del usuario (15%)
    score += (features['avg_user_rating'] / 5) * 0.10
    score += min(features['user_num_rated'] / 100, 1) * 0.05
    
    # Recomendación social (5%)
    score += features['was_recommended'] * 0.05
    
    probability_like = min(score * 100, 95)
    prediction = 1 if probability_like > 50 else 0
    
    return prediction, probability_like

def predict_with_model(features_list):
    """Predicción usando el modelo cargado"""
    if model_data is None:
        return None
    
    try:
        # Preparar datos
        input_df = pd.DataFrame(features_list)
        
        # Escalar características si el modelo tiene scaler
        if 'scaler' in model_data:
            input_df_scaled = model_data['scaler'].transform(input_df)
        else:
            input_df_scaled = input_df
        
        # Hacer predicciones
        predictions = model_data['model'].predict(input_df_scaled)
        probabilities = model_data['model'].predict_proba(input_df_scaled)
        
        return predictions, probabilities
    except Exception as e:
        logger.error(f"Error en predicción con modelo: {e}")
        return None

# Ruta de prueba
@app.get("/")
def read_root():
    return {
        "message": "MovieMatch ML API Mejorada is running ✅",
        "model_loaded": model_data is not None,
        "model_type": model_data['model_info']['type'] if model_data else None,
        "features": model_data['model_info']['features'] if model_data else None,
        "balanced": model_data['model_info'].get('balanced', False) if model_data else False,
        "version": "2.0.0"
    }

# Endpoint de estado del servicio
@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "model_loaded": model_data is not None,
        "model_type": model_data['model_info']['type'] if model_data else None,
        "balanced": model_data['model_info'].get('balanced', False) if model_data else False,
        "timestamp": pd.Timestamp.now().isoformat()
    }

# Endpoint de predicción individual
@app.post("/predict")
def predict_rating(request: PredictionRequest):
    try:
        input_data = request.dict()
        
        # Intentar usar modelo entrenado
        model_result = predict_with_model([input_data])
        
        if model_result is not None:
            prediction, probabilities = model_result
            probability_like = round(probabilities[0][1]*100, 2)
            probability_dislike = round(probabilities[0][0]*100, 2)
            
            # Determinar qué modelo se está usando
            if model_data['model_info'].get('improved', False):
                model_used = "improved"
            elif model_data['model_info'].get('balanced', False):
                model_used = "balanced"
            else:
                model_used = "enhanced"
        else:
            # Usar predicción simple
            prediction, prob = simple_prediction(input_data)
            probability_like = round(prob, 2)
            probability_dislike = round(100 - prob, 2)
            model_used = "simple"
        
        return {
            "prediction": int(prediction[0] if isinstance(prediction, (list, tuple)) else prediction),
            "probability_like": probability_like,
            "probability_dislike": probability_dislike,
            "model_used": model_used,
            "liked": bool(prediction[0] if isinstance(prediction, (list, tuple)) else prediction)
        }
    except Exception as e:
        logger.error(f"Error en predicción individual: {e}")
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

# Endpoint de predicción en lote
@app.post("/predict-batch")
def predict_batch_ratings(request: BatchPredictionRequest):
    try:
        logger.info(f"📥 Recibida solicitud de predicción en lote con {len(request.movies)} películas")
        
        features_list = []
        movie_ids = []
        
        for movie in request.movies:
            features = {
                'n_shared_genres': movie.n_shared_genres,
                'genre_match_ratio': movie.genre_match_ratio,
                'vote_average': movie.vote_average,
                'vote_count': movie.vote_count,
                'popularity': movie.popularity,
                'years_since_release': movie.years_since_release,
                'is_favorite_genre': movie.is_favorite_genre,
                'was_recommended': movie.was_recommended,
                'avg_user_rating': movie.avg_user_rating,
                'user_num_rated': movie.user_num_rated
            }
            features_list.append(features)
            movie_ids.append(movie.movie_id)
        
        logger.info(f"🔍 Procesando {len(features_list)} películas")
        
        results = []
        
        # Intentar usar modelo entrenado
        model_result = predict_with_model(features_list)
        
        if model_result is not None:
            predictions, probabilities = model_result
            
            # Determinar qué modelo se está usando
            if model_data['model_info'].get('improved', False):
                model_used = "improved"
            elif model_data['model_info'].get('balanced', False):
                model_used = "balanced"
            else:
                model_used = "enhanced"
            
            for i, movie_id in enumerate(movie_ids):
                results.append({
                    "movie_id": movie_id,
                    "prediction": int(predictions[i]),
                    "probability_like": round(probabilities[i][1]*100, 2),
                    "probability_dislike": round(probabilities[i][0]*100, 2),
                    "model_used": model_used,
                    "liked": bool(predictions[i])
                })
        else:
            # Usar predicción simple
            for i, movie_id in enumerate(movie_ids):
                prediction, prob = simple_prediction(features_list[i])
                results.append({
                    "movie_id": movie_id,
                    "prediction": prediction,
                    "probability_like": round(prob, 2),
                    "probability_dislike": round(100 - prob, 2),
                    "model_used": "simple",
                    "liked": bool(prediction)
                })
        
        response_data = {
            "predictions": results,
            "total_movies": len(results),
            "model_used": model_used if model_result is not None else "simple"
        }
        
        logger.info(f"✅ Predicciones completadas: {len(results)} películas procesadas")
        
        return response_data
        
    except Exception as e:
        logger.error(f"❌ Error en predicción en lote: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en predicción en lote: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Obtener puerto de Railway o usar 8000 por defecto
    port = int(os.environ.get("PORT", 8000))
    
    logger.info(f"🚀 Iniciando servidor ML mejorado en puerto {port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Deshabilitar reload en producción
        log_level="info"
    )
