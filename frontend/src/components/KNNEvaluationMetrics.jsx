import React from 'react';
import { Card } from './ui';

const KNNEvaluationMetrics = ({ metrics, className = "" }) => {
    if (!metrics) {
        return null;
    }

    const {
        precision_at_k,
        recall_at_k,
        f1_score_at_k,
        diversity_score,
        novelty_score,
        coverage_score,
        quality_score,
        recommendation
    } = metrics;

    const getQualityColor = (score) => {
        if (score >= 70) return "text-green-400";
        if (score >= 50) return "text-yellow-400";
        if (score >= 30) return "text-orange-400";
        return "text-red-400";
    };

    const getQualityIcon = (score) => {
        if (score >= 70) return "🎯";
        if (score >= 50) return "👍";
        if (score >= 30) return "🤔";
        return "⚠️";
    };

    return (
        <Card className={`p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-600 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-purple-300 mb-2">
                    📊 Métricas de Calidad KNN
                </h3>
                <p className="text-sm text-gray-400">
                    Evaluación automática de la calidad de las recomendaciones
                </p>
            </div>

            {/* Puntuación de calidad general */}
            {quality_score && (
                <div className="mb-4 p-3 bg-purple-800/30 rounded-lg border border-purple-500">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-200">
                            Puntuación de Calidad General
                        </span>
                        <span className={`text-lg font-bold ${getQualityColor(quality_score)}`}>
                            {getQualityIcon(quality_score)} {quality_score}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-purple-700 rounded-full mt-2 overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-300 ${getQualityColor(quality_score).replace('text-', 'bg-')}`}
                            style={{ width: `${quality_score}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Métricas principales */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{precision_at_k}%</div>
                    <div className="text-xs text-gray-400">Precisión@K</div>
                    <div className="text-xs text-gray-500 mt-1">
                        De las recomendadas, cuántas le gustan
                    </div>
                </div>
                
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{recall_at_k}%</div>
                    <div className="text-xs text-gray-400">Recall@K</div>
                    <div className="text-xs text-gray-500 mt-1">
                        De las que le gustan, cuántas están recomendadas
                    </div>
                </div>
                
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">{f1_score_at_k}%</div>
                    <div className="text-xs text-gray-400">F1-Score@K</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Balance entre precisión y recall
                    </div>
                </div>
                
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{diversity_score}%</div>
                    <div className="text-xs text-gray-400">Diversidad</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Variedad de géneros recomendados
                    </div>
                </div>
            </div>

            {/* Métricas secundarias */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-800/30 rounded">
                    <div className="text-lg font-semibold text-orange-400">{novelty_score}%</div>
                    <div className="text-xs text-gray-400">Novedad</div>
                </div>
                
                <div className="text-center p-2 bg-gray-800/30 rounded">
                    <div className="text-lg font-semibold text-cyan-400">{coverage_score}%</div>
                    <div className="text-xs text-gray-400">Cobertura</div>
                </div>
            </div>

            {/* Recomendación de calidad */}
            {recommendation && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-lg border border-blue-500">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div>
                            <p className="text-sm font-medium text-blue-200 mb-1">
                                Análisis de Calidad
                            </p>
                            <p className="text-xs text-gray-300">
                                {recommendation}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Leyenda de métricas */}
            <div className="mt-4 text-xs text-gray-500">
                <p className="mb-2"><strong>Explicación de métricas:</strong></p>
                <ul className="space-y-1">
                    <li>• <strong>Precisión@K:</strong> Porcentaje de recomendaciones que realmente le gustan al usuario</li>
                    <li>• <strong>Recall@K:</strong> Porcentaje de películas que le gustan que están en las recomendaciones</li>
                    <li>• <strong>F1-Score@K:</strong> Media armónica entre precisión y recall</li>
                    <li>• <strong>Diversidad:</strong> Variedad de géneros en las recomendaciones</li>
                    <li>• <strong>Novedad:</strong> Qué tan poco populares son las películas recomendadas</li>
                    <li>• <strong>Cobertura:</strong> Porcentaje del catálogo que se recomienda</li>
                </ul>
            </div>
        </Card>
    );
};

export default KNNEvaluationMetrics; 