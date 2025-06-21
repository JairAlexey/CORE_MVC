from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from typing import List

# Inicializar FastAPI
app = FastAPI()

# Cargar el modelo
model = joblib.load("recommender_model.pkl")

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

# Ruta de prueba
@app.get("/")
def read_root():
    return {"message": "Recommender System API is running ✅"}

# Endpoint de predicción individual
@app.post("/predict")
def predict_rating(request: PredictionRequest):
    # Convertimos los datos a DataFrame como el modelo espera
    input_df = pd.DataFrame([request.dict()])
    
    # Hacer la predicción
    prediction = model.predict(input_df)[0]
    probabilities = model.predict_proba(input_df)[0]
    
    return {
        "prediction": int(prediction),
        "probability_like": round(probabilities[1]*100, 2),
        "probability_dislike": round(probabilities[0]*100, 2)
    }

# Nuevo endpoint de predicción en lote
@app.post("/predict-batch")
def predict_batch_ratings(request: BatchPredictionRequest):
    try:
        # Preparar los datos para el modelo (sin movie_id)
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
        
        # Convertir a DataFrame
        input_df = pd.DataFrame(features_list)
        
        # Hacer predicciones en lote
        predictions = model.predict(input_df)
        probabilities = model.predict_proba(input_df)
        
        # Preparar resultados
        results = []
        for i, movie_id in enumerate(movie_ids):
            results.append({
                "movie_id": movie_id,
                "prediction": int(predictions[i]),
                "probability_like": round(probabilities[i][1]*100, 2),
                "probability_dislike": round(probabilities[i][0]*100, 2)
            })
        
        return {
            "predictions": results,
            "total_movies": len(results)
        }
        
    except Exception as e:
        return {
            "error": f"Error en predicción en lote: {str(e)}",
            "predictions": []
        }
