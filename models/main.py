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
    description="API de recomendaciones de películas usando Machine Learning",
    version="1.0.0"
)

# Configurar CORS para permitir múltiples aplicaciones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el modelo de forma segura
model = None
try:
    model = joblib.load("recommender_model.pkl")
    logger.info("✅ Modelo cargado exitosamente")
except Exception as e:
    logger.error(f"❌ Error cargando el modelo: {e}")
    # Fallback: modelo simple
    model = None

# Definir la estructura de entrada (validación automática de FastAPI)
class PredictionRequest(BaseModel):
    n_shared_genres: int
    vote_average: float
    vote_count: int
    is_favorite_genre: int
    years_since_release: int
    popularity: float

# Nueva estructura para predicción en lote
class MovieFeatures(BaseModel):
    movie_id: int
    n_shared_genres: int
    vote_average: float
    vote_count: int
    is_favorite_genre: int
    years_since_release: int
    popularity: float

class BatchPredictionRequest(BaseModel):
    movies: List[MovieFeatures]

def simple_prediction(features):
    """Predicción simple como fallback si el modelo no está disponible"""
    n_shared_genres = features['n_shared_genres']
    vote_average = features['vote_average']
    vote_count = features['vote_count']
    is_favorite_genre = features['is_favorite_genre']
    years_since_release = features['years_since_release']
    popularity = features['popularity']
    
    # Algoritmo simple de scoring
    score = 0
    score += n_shared_genres * 0.3
    score += (vote_average / 10) * 0.2
    score += min(vote_count / 1000, 1) * 0.1
    score += is_favorite_genre * 0.3
    score += max(0, (10 - years_since_release) / 10) * 0.05
    score += min(popularity / 100, 1) * 0.05
    
    probability_like = min(score * 100, 95)
    prediction = 1 if probability_like > 50 else 0
    
    return prediction, probability_like

# Ruta de prueba
@app.get("/")
def read_root():
    return {
        "message": "MovieMatch ML API is running ✅",
        "model_loaded": model is not None,
        "version": "1.0.0"
    }

# Endpoint de estado del servicio
@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "model_loaded": model is not None,
        "timestamp": pd.Timestamp.now().isoformat()
    }

# Endpoint de predicción individual
@app.post("/predict")
def predict_rating(request: PredictionRequest):
    try:
        input_data = request.dict()
        
        if model is not None:
            # Usar modelo entrenado
            input_df = pd.DataFrame([input_data])
            prediction = model.predict(input_df)[0]
            probabilities = model.predict_proba(input_df)[0]
            probability_like = round(probabilities[1]*100, 2)
            probability_dislike = round(probabilities[0]*100, 2)
        else:
            # Usar predicción simple
            prediction, prob = simple_prediction(input_data)
            probability_like = round(prob, 2)
            probability_dislike = round(100 - prob, 2)
        
        return {
            "prediction": int(prediction),
            "probability_like": probability_like,
            "probability_dislike": probability_dislike,
            "model_used": "trained" if model is not None else "simple"
        }
    except Exception as e:
        logger.error(f"Error en predicción individual: {e}")
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

# Nuevo endpoint de predicción en lote
@app.post("/predict-batch")
def predict_batch_ratings(request: BatchPredictionRequest):
    try:
        logger.info(f"📥 Recibida solicitud de predicción en lote con {len(request.movies)} películas")
        
        features_list = []
        movie_ids = []
        
        for movie in request.movies:
            features = {
                'n_shared_genres': movie.n_shared_genres,
                'vote_average': movie.vote_average,
                'vote_count': movie.vote_count,
                'is_favorite_genre': movie.is_favorite_genre,
                'years_since_release': movie.years_since_release,
                'popularity': movie.popularity
            }
            features_list.append(features)
            movie_ids.append(movie.movie_id)
        
        logger.info(f"🔍 Procesando {len(features_list)} películas")
        logger.info(f"📊 Features de ejemplo: {features_list[0] if features_list else 'No hay features'}")
        
        results = []
        
        if model is not None:
            logger.info("🤖 Usando modelo entrenado para predicciones")
            # Usar modelo entrenado
            input_df = pd.DataFrame(features_list)
            predictions = model.predict(input_df)
            probabilities = model.predict_proba(input_df)
            
            for i, movie_id in enumerate(movie_ids):
                results.append({
                    "movie_id": movie_id,
                    "prediction": int(predictions[i]),
                    "probability_like": round(probabilities[i][1]*100, 2),
                    "probability_dislike": round(probabilities[i][0]*100, 2),
                    "model_used": "trained"
                })
        else:
            logger.info("📝 Usando predicción simple como fallback")
            # Usar predicción simple
            for i, movie_id in enumerate(movie_ids):
                prediction, prob = simple_prediction(features_list[i])
                results.append({
                    "movie_id": movie_id,
                    "prediction": prediction,
                    "probability_like": round(prob, 2),
                    "probability_dislike": round(100 - prob, 2),
                    "model_used": "simple"
                })
        
        response_data = {
            "predictions": results,
            "total_movies": len(results),
            "model_used": "trained" if model is not None else "simple"
        }
        
        logger.info(f"✅ Predicciones completadas: {len(results)} películas procesadas")
        logger.info(f"📊 Respuesta de ejemplo: {results[0] if results else 'No hay resultados'}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"❌ Error en predicción en lote: {str(e)}")
        logger.error(f"❌ Tipo de error: {type(e).__name__}")
        logger.error(f"❌ Detalles completos: {e}")
        
        # Devolver error más informativo
        error_detail = f"Error en predicción en lote: {str(e)}"
        if "memory" in str(e).lower():
            error_detail = "Error de memoria al procesar predicciones en lote"
        elif "timeout" in str(e).lower():
            error_detail = "Timeout al procesar predicciones en lote"
        
        raise HTTPException(status_code=500, detail=error_detail)

if __name__ == "__main__":
    import uvicorn
    
    # Obtener puerto de Railway o usar 8000 por defecto
    port = int(os.environ.get("PORT", 8000))
    
    logger.info(f"🚀 Iniciando servidor ML en puerto {port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Deshabilitar reload en producción
        log_level="info"
    )
