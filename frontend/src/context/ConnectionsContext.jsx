import { createContext, useContext, useState } from "react";
import { 
    updateConnectionsRequest, 
    getUserConnectionsRequest,
    generateRecommendationsRequest,
    getUserRecommendationsRequest 
} from "../api/connections.api";

const ConnectionContext = createContext();

export const useConnections = () => {
    const context = useContext(ConnectionContext);
    if (!context) throw new Error("useConnections debe usarse dentro de un ConnectionProvider");
    return context;
};

export function ConnectionProvider({ children }) {
    const [connections, setConnections] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateConnections = async () => {
        try {
            setLoading(true);
            setError(null);
            await updateConnectionsRequest();
            const result = await getUserConnectionsRequest();
            setConnections(result.data || []);
        } catch (error) {
            setError(error.response?.data?.errors || ["Error al actualizar conexiones"]);
            setConnections([]);
        } finally {
            setLoading(false);
        }
    };

    const generateRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            await generateRecommendationsRequest();
            const result = await getUserRecommendationsRequest();
            setRecommendations(result.data?.recommendations || []);
        } catch (error) {
            console.error("Error en generateRecommendations:", error);
            setError(error.response?.data?.errors || ["Error al generar recomendaciones"]);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConnectionContext.Provider value={{
            connections,
            recommendations,
            loading,
            error,
            updateConnections,
            generateRecommendations
        }}>
            {children}
        </ConnectionContext.Provider>
    );
}