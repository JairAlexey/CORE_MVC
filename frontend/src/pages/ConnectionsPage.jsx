import { useEffect } from "react";
import { useConnections } from "../context/ConnectionsContext";
import { Card, Button, LoadingSpinner, AIProbabilityBadge } from "../components/ui";
import { getGenreNames } from "../utils/genres";

function ConnectionsPage() {
    const { 
        connections, 
        recommendations, 
        loading, 
        error,
        updateConnections,
        generateRecommendations 
    } = useConnections();

    useEffect(() => {
        updateConnections();
    }, []);

    const handleGenerateRecommendations = () => {
        generateRecommendations();
    };

    if (loading) return <LoadingSpinner size="large" text="Cargando conexiones..." />;

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Mis Conexiones</h2>
                <Button onClick={updateConnections} className="ml-2">
                    Actualizar Conexiones
                </Button>
            </div>

            {error && (
                <Card className="p-4 mb-4 bg-red-500/10 border border-red-500">
                    {Array.isArray(error) ? (
                        error.map((err, index) => (
                            <p key={index} className="text-red-400">
                                {err}
                            </p>
                        ))
                    ) : (
                        <p className="text-red-400">{error}</p>
                    )}
                </Card>
            )}

            <Button onClick={handleGenerateRecommendations} className="mb-4">
                Generar Recomendaciones
            </Button>

            {connections.length === 0 ? (
                <Card className="p-4 text-center">
                    <p className="text-gray-300 mb-2">
                        Aún no tienes conexiones con otros usuarios.
                    </p>
                    <div className="text-sm text-gray-400">
                        Para generar conexiones necesitas:
                        <ul className="list-disc list-inside mt-2">
                            <li>Calificar algunas películas</li>
                            <li>Tener géneros favoritos en común con otros usuarios</li>
                            <li>Que existan otros usuarios activos en el sistema</li>
                        </ul>
                    </div>
                </Card>
            ) : (
                <Card className="p-4 text-center">
                    <p className="text-gray-300">
                        Tienes <span className="font-bold text-white">{connections.length}</span> {connections.length === 1 ? 'conexión' : 'conexiones'} con otros usuarios.
                    </p>
                </Card>
            )}

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Películas Recomendadas</h2>
                {recommendations.length === 0 ? (
                    <Card className="p-4 text-center">
                        <p className="text-gray-300">No hay recomendaciones disponibles en este momento.</p>
                        <div className="text-sm text-gray-400 mt-2">
                            <p className="mb-2">El sistema utiliza un modelo de IA para analizar las recomendaciones:</p>
                            <ul className="list-disc list-inside mt-2">
                                <li>Se analizan tus géneros favoritos</li>
                                <li>Se consideran las calificaciones de tus conexiones</li>
                                <li>Necesitas tener conexiones con otros usuarios</li>
                                <li>Tus conexiones deben haber visto películas que tú no</li>
                                <li>Esas películas deben tener buenas calificaciones</li>
                            </ul>
                            <p className="mt-3 text-yellow-400">
                                💡 <strong>Consejo:</strong> Asegúrate de tener configurados tus géneros favoritos en tu perfil.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map((recommendation) => (
                            <Card key={`${recommendation.movie_id}`} className="p-4 relative card-hover">
                                {/* Badge de probabilidad de IA en la esquina superior derecha */}
                                <div className="absolute top-2 right-2 z-10">
                                    <AIProbabilityBadge prediction={recommendation.ml_prediction} />
                                </div>
                                
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
                                
                                <h3 className="font-bold text-lg mb-2">{recommendation.title}</h3>
                                
                                <p className="text-sm text-gray-300 mb-3">
                                    Recomendada por {recommendation.recommender_count} {recommendation.recommender_count === 1 ? 'usuario' : 'usuarios'}
                                </p>
                                
                                {/* Información adicional de la película */}
                                <div className="text-xs text-gray-400 mb-3">
                                    <p>Fecha: {new Date(recommendation.release_date).getFullYear()}</p>
                                    {recommendation.genre_ids && recommendation.genre_ids.length > 0 && (
                                        <p>Géneros: {getGenreNames(recommendation.genre_ids.slice(0, 3))}</p>
                                    )}
                                </div>
                                
                                {/* Descripción corta */}
                                {recommendation.overview && (
                                    <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                                        {recommendation.overview}
                                    </p>
                                )}
                                
                                {/* Detalles de la predicción de IA */}
                                {recommendation.ml_prediction && (
                                    <div className="mt-3 p-3 border border-gray-600 rounded-lg bg-gray-900/50 backdrop-blur-sm">
                                        <p className="text-xs font-medium text-gray-300 mb-2">
                                            Análisis de IA 🤖
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-400">Probabilidad de que te guste:</span>
                                                <span className="text-xs font-semibold text-white">
                                                    {recommendation.ml_prediction.probability_like}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${recommendation.ml_prediction.probability_like}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-700">
                                            <p className="text-xs text-center text-gray-400">
                                                {recommendation.ml_prediction.probability_like >= 80 
                                                    ? "🎬 ¡Muy recomendada!" 
                                                    : recommendation.ml_prediction.probability_like >= 60 
                                                    ? "🤔 Podría gustarte" 
                                                    : recommendation.ml_prediction.probability_like >= 40
                                                    ? "😐 Neutral"
                                                    : "❌ Probablemente no te guste"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Lista de recomendadores */}
                                {recommendation.recommenders && recommendation.recommenders.length > 0 && (
                                    <div className="mt-3">
                                        <p className="text-xs text-gray-400 mb-2">Recomendada por:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {recommendation.recommenders.slice(0, 3).map((recommender, index) => (
                                                <div key={index} className="flex items-center gap-1 text-xs">
                                                    <img 
                                                        src={recommender.gravatar} 
                                                        alt={recommender.name}
                                                        className="w-4 h-4 rounded-full"
                                                    />
                                                    <span className="text-gray-300">{recommender.name}</span>
                                                    {index < Math.min(2, recommendation.recommenders.length - 1) && (
                                                        <span className="text-gray-500">•</span>
                                                    )}
                                                </div>
                                            ))}
                                            {recommendation.recommenders.length > 3 && (
                                                <span className="text-xs text-gray-500">
                                                    +{recommendation.recommenders.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConnectionsPage;