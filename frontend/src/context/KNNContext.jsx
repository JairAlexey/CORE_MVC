import { createContext, useContext, useState } from "react";
import { 
    getKNNRecommendationsRequest,
    getSimilarMoviesKNNRequest,
    getKNNStatusRequest
} from "../api/knn.api";

const KNNContext = createContext();

export const useKNN = () => {
    const context = useContext(KNNContext);
    if (!context) throw new Error("useKNN debe usarse dentro de un KNNProvider");
    return context;
};

export function KNNProvider({ children }) {
    const [knnRecommendations, setKnnRecommendations] = useState([]);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [knnStatus, setKnnStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getKNNRecommendations = async (limit = 10) => {
        try {
            setLoading(true);
            setError(null);
            const result = await getKNNRecommendationsRequest(limit);
            setKnnRecommendations(result.data?.recommendations || []);
            return result.data;
        } catch (error) {
            console.error("Error en getKNNRecommendations:", error);
            setError(error.response?.data?.error || "Error al obtener recomendaciones KNN");
            setKnnRecommendations([]);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getSimilarMoviesKNN = async (movieId, limit = 5) => {
        try {
            setLoading(true);
            setError(null);
            const result = await getSimilarMoviesKNNRequest(movieId, limit);
            setSimilarMovies(result.data?.similar_movies || []);
            return result.data;
        } catch (error) {
            console.error("Error en getSimilarMoviesKNN:", error);
            setError(error.response?.data?.error || "Error al obtener películas similares");
            setSimilarMovies([]);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const checkKNNStatus = async () => {
        try {
            const result = await getKNNStatusRequest();
            setKnnStatus(result.data);
            return result.data;
        } catch (error) {
            console.error("Error verificando estado KNN:", error);
            setKnnStatus({ status: 'offline', error: error.message });
            return { status: 'offline', error: error.message };
        }
    };

    const clearKNNData = () => {
        setKnnRecommendations([]);
        setSimilarMovies([]);
        setError(null);
    };

    return (
        <KNNContext.Provider value={{
            knnRecommendations,
            similarMovies,
            knnStatus,
            loading,
            error,
            getKNNRecommendations,
            getSimilarMoviesKNN,
            checkKNNStatus,
            clearKNNData
        }}>
            {children}
        </KNNContext.Provider>
    );
} 