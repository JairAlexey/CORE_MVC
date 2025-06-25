#!/bin/bash

echo "🚀 Deployando servicio KNN a Railway..."

# Verificar que Railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "💡 Instala Railway CLI: npm install -g @railway/cli"
    exit 1
fi

# Verificar que estemos en la carpeta correcta
if [ ! -f "knn_api.py" ]; then
    echo "❌ No se encontró knn_api.py"
    echo "💡 Asegúrate de estar en la carpeta knn/"
    exit 1
fi

# Verificar que el modelo esté entrenado
if [ ! -f "knn_model.pkl" ]; then
    echo "⚠️ Modelo KNN no encontrado, entrenando..."
    python train_knn_model.py
fi

# Verificar que requirements.txt exista
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt no encontrado"
    exit 1
fi

echo "✅ Archivos verificados"

# Login a Railway (si no está logueado)
echo "🔐 Verificando login de Railway..."
railway whoami || railway login

# Inicializar proyecto Railway (si no está inicializado)
if [ ! -f ".railway" ]; then
    echo "🚂 Inicializando proyecto Railway..."
    railway init
fi

# Deploy
echo "🚀 Haciendo deploy..."
railway up

echo "✅ Deploy completado!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Obtén la URL del servicio desde Railway Dashboard"
echo "2. Configura la variable KNN_API_URL en tu backend principal"
echo "3. Prueba el endpoint: https://tu-servicio-knn.railway.app/health"
echo ""
echo "🔧 Para ver logs: railway logs --follow" 