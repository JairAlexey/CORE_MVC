import React, { useEffect } from 'react';
import { useKNN } from '../context/KNNContext';
import { Card, Button, LoadingSpinner } from './ui';
import { getGenreNames } from '../utils/genres';

const KNNRecommendations = ({ limit = 10 }) => {
    const {
        knnRecommendations,
        knnStatus,
        loading,
        error,
        getKNNRecommendations,
        checkKNNStatus
    } = useKNN();

    useEffect(() => {
        // Verificar estado del servicio KNN al cargar
        checkKNNStatus();
    }, []);

    const handleGetKNNRecommendations = () => {
        getKNNRecommendations(limit);
    };

    if (loading) {
        return <LoadingSpinner size="large" text="Obteniendo recomendaciones KNN..." />;
    }

    return (
        <div className="space-y-4">
            {/* Header con estado del servicio */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">🎯 Recomendaciones KNN</h2>
                    <p className="text-sm text-gray-400">
                        Recomendaciones basadas en similitud de películas usando K-Nearest Neighbors
                    </p>
                </div>
                
                {/* Badge de estado del servicio */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    knnStatus?.status === 'online' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    {knnStatus?.status === 'online' ? '🟢 KNN Activo' : '🔴 KNN Inactivo'}
                </div>
            </div>

            {/* Botón para obtener recomendaciones */}
            <Button 
                onClick={handleGetKNNRecommendations}
                disabled={knnStatus?.status !== 'online'}
                className="mb-4"
            >
                {knnRecommendations.length > 0 ? 'Actualizar Recomendaciones KNN' : 'Obtener Recomendaciones KNN'}
            </Button>

            {/* Mensaje de error */}
            {error && (
                <Card className="p-4 mb-4 bg-red-500/10 border border-red-500">
                    <p className="text-red-400">{error}</p>
                </Card>
            )}

            {/* Información del servicio KNN */}
            {knnStatus && knnStatus.status === 'online' && knnStatus.data && knnStatus.data.model_info && (
                <Card className="p-4 mb-4 bg-blue-500/10 border border-blue-500">
                    <div className="text-sm text-blue-300">
                        <p><strong>Modelo:</strong> {knnStatus.data.model_info.algorithm || 'K-Nearest Neighbors'}</p>
                        <p><strong>Películas en el modelo:</strong> {knnStatus.data.model_info.total_movies || 'N/A'}</p>
                        <p><strong>Vecinos utilizados:</strong> {knnStatus.data.model_info.neighbors || 'N/A'}</p>
                        <p><strong>Características utilizadas:</strong> {knnStatus.data.model_info.features_used || 'N/A'}</p>
                        <p><strong>Estado del modelo:</strong> {knnStatus.data.model_info.model_loaded ? '✅ Cargado' : '❌ No cargado'}</p>
                        <p><strong>Conexión BD:</strong> {knnStatus.data.model_info.database_connected ? '✅ Conectada' : '❌ Desconectada'}</p>
                    </div>
                </Card>
            )}

            {/* Lista de recomendaciones */}
            {knnRecommendations.length === 0 ? (
                <Card className="p-4 text-center">
                    <p className="text-gray-300 mb-2">
                        {knnStatus?.status === 'online' 
                            ? "No hay recomendaciones KNN disponibles en este momento."
                            : "El servicio KNN no está disponible."
                        }
                    </p>
                    <div className="text-sm text-gray-400 mt-2">
                        <p className="mb-2">El sistema KNN analiza:</p>
                        <ul className="list-disc list-inside mt-2">
                            <li>Similitud entre películas basada en géneros</li>
                            <li>Calificaciones promedio de usuarios</li>
                            <li>Popularidad y fecha de lanzamiento</li>
                            <li>Características técnicas de las películas</li>
                        </ul>
                        {knnStatus?.status !== 'online' && (
                            <p className="mt-3 text-yellow-400">
                                💡 <strong>Consejo:</strong> Asegúrate de que el servicio KNN esté ejecutándose.
                            </p>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {knnRecommendations.map((recommendation) => (
                        <Card key={`knn-${recommendation.movie_id}`} className="p-4 relative card-hover">
                            {/* Badge de similitud KNN */}
                            <div className="absolute top-2 right-2 z-10">
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                                    <span className="text-sm">🎯</span>
                                    <span className="font-semibold">
                                        {recommendation.knn_similarity ? 
                                            `${(recommendation.knn_similarity * 100).toFixed(0)}%` : 
                                            'KNN'
                                        }
                                    </span>
                                </div>
                            </div>
                            
                            {/* Poster de la película */}
                            {recommendation.poster_path ? (
                                <img 
                                    src={recommendation.poster_path}
                                    alt={recommendation.title}
                                    className="w-full h-auto mb-4 rounded"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <div 
                                className="w-full h-64 bg-gray-700 mb-4 rounded flex items-center justify-center text-gray-400"
                                style={{ display: recommendation.poster_path ? 'none' : 'block' }}
                            >
                                <span>Imagen no disponible</span>
                            </div>
                            
                            {/* Título */}
                            <h3 className="font-bold text-lg mb-2">{recommendation.title}</h3>
                            
                            {/* Información adicional */}
                            <div className="text-xs text-gray-400 mb-3">
                                <p>Fecha: {new Date(recommendation.release_date).getFullYear()}</p>
                                {recommendation.genre_ids && recommendation.genre_ids.length > 0 && (
                                    <p>Géneros: {getGenreNames(recommendation.genre_ids.slice(0, 3))}</p>
                                )}
                                {recommendation.vote_average && (
                                    <p>Calificación: ⭐ {recommendation.vote_average.toFixed(1)}</p>
                                )}
                            </div>
                            
                            {/* Descripción */}
                            {recommendation.overview && (
                                <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                                    {recommendation.overview}
                                </p>
                            )}
                            
                            {/* Detalles del algoritmo KNN */}
                            <div className="mt-3 p-3 border border-purple-600 rounded-lg bg-purple-900/20 backdrop-blur-sm">
                                <p className="text-xs font-medium text-purple-300 mb-2">
                                    Análisis KNN 🤖
                                </p>
                                <div className="space-y-2">
                                    {recommendation.knn_similarity && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Similitud:</span>
                                            <span className="text-xs font-semibold text-white">
                                                {(recommendation.knn_similarity * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                    {recommendation.knn_score && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">Puntuación:</span>
                                            <span className="text-xs font-semibold text-white">
                                                {recommendation.knn_score.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-purple-700">
                                    <p className="text-xs text-center text-purple-300">
                                        {recommendation.knn_similarity && recommendation.knn_similarity >= 0.8 
                                            ? "🎬 ¡Muy similar!" 
                                            : recommendation.knn_similarity && recommendation.knn_similarity >= 0.6 
                                            ? "🤔 Similar" 
                                            : recommendation.knn_similarity && recommendation.knn_similarity >= 0.4
                                            ? "😐 Moderadamente similar"
                                            : "❌ Poco similar"
                                        }
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KNNRecommendations; 