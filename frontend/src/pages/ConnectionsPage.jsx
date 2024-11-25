import { useEffect } from "react";
import { useConnections } from "../context/ConnectionsContext";
import { Card, Button } from "../components/ui";

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

    if (loading) return <div className="text-center">Cargando...</div>;

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
                    <p className="text-sm text-gray-400">
                        Para generar conexiones necesitas:
                        <ul className="list-disc list-inside mt-2">
                            <li>Calificar algunas películas</li>
                            <li>Tener géneros favoritos en común con otros usuarios</li>
                            <li>Que existan otros usuarios activos en el sistema</li>
                        </ul>
                    </p>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((connection) => (
                        <Card key={connection.connected_user_id} className="p-4">
                            <div className="flex items-center gap-4">
                                <img 
                                    src={connection.connected_user_gravatar} 
                                    alt={connection.connected_user_name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <h3 className="font-bold">{connection.connected_user_name}</h3>
                                    <p className="text-sm text-gray-300">
                                        Compatibilidad: {connection.compatibility_score}%
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Películas Recomendadas</h2>
                {recommendations.length === 0 ? (
                    <Card className="p-4 text-center">
                        <p className="text-gray-300">
                            No hay recomendaciones disponibles en este momento.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Las recomendaciones se generan cuando:
                            <ul className="list-disc list-inside mt-2">
                                <li>Tienes conexiones con otros usuarios</li>
                                <li>Tus conexiones han visto películas que tú no</li>
                                <li>Esas películas tienen buenas calificaciones</li>
                            </ul>
                        </p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map((recommendation) => (
                            <Card key={recommendation.id} className="p-4">
                                <img 
                                    src={`https://image.tmdb.org/t/p/w500${recommendation.poster_path}`} 
                                    alt={recommendation.title}
                                    className="w-full h-64 object-cover mb-4"
                                />
                                <h3 className="font-bold">{recommendation.title}</h3>
                                <p className="text-sm text-gray-300">
                                    Recomendado por: {recommendation.recommender_name}
                                </p>
                                <p className="text-yellow-400">
                                    {"⭐".repeat(recommendation.recommender_rating)}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConnectionsPage;