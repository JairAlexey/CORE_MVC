import React from 'react';

const AIProbabilityBadge = ({ prediction, className = "" }) => {
    if (!prediction) {
        return null;
    }

    const { probability_like, probability_dislike, prediction: predictedRating } = prediction;
    
    // Determinar el color basado en la probabilidad de que le guste
    const getColorClass = (probability) => {
        if (probability >= 80) return "bg-green-500 text-white";
        if (probability >= 60) return "bg-blue-500 text-white";
        if (probability >= 40) return "bg-yellow-500 text-black";
        if (probability >= 20) return "bg-orange-500 text-white";
        return "bg-red-500 text-white";
    };

    // Determinar el ícono basado en la predicción
    const getIcon = (probability) => {
        if (probability >= 80) return "🤩"; // Muy probable que le guste
        if (probability >= 60) return "😊"; // Probable que le guste
        if (probability >= 40) return "🤔"; // Neutral
        if (probability >= 20) return "😐"; // Probable que no le guste
        return "😞"; // Muy probable que no le guste
    };

    const colorClass = getColorClass(probability_like);
    const icon = getIcon(probability_like);

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass} ${className}`}>
            <span className="text-sm">{icon}</span>
            <span className="font-semibold">{probability_like}%</span>
            <span className="text-xs opacity-80">IA</span>
        </div>
    );
};

export default AIProbabilityBadge; 