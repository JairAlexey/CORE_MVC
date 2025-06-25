#!/bin/bash

echo "🚀 DEPLOY COMPLETO - SERVICIO KNN MOVIEMATCH"
echo "=============================================="
echo ""

# Verificar que estemos en la raíz del proyecto
if [ ! -f "package.json" ] || [ ! -d "knn" ]; then
    echo "❌ No se detectó la estructura del proyecto MovieMatch"
    echo "💡 Asegúrate de estar en la raíz del proyecto"
    exit 1
fi

echo "✅ Estructura del proyecto verificada"
echo ""

# Verificar que Railway CLI esté instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo "💡 Instala Railway CLI: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI detectado"
echo ""

# Navegar a la carpeta knn
echo "📁 Navegando a la carpeta knn..."
cd knn

# Verificar que el modelo esté entrenado
if [ ! -f "knn_model.pkl" ]; then
    echo "⚠️ Modelo KNN no encontrado, entrenando..."
    python train_knn_model.py
    
    if [ $? -ne 0 ]; then
        echo "❌ Error entrenando el modelo KNN"
        exit 1
    fi
fi

echo "✅ Modelo KNN verificado"
echo ""

# Login a Railway
echo "🔐 Verificando login de Railway..."
railway whoami || railway login

if [ $? -ne 0 ]; then
    echo "❌ Error en login de Railway"
    exit 1
fi

echo "✅ Login de Railway completado"
echo ""

# Inicializar proyecto Railway (si no está inicializado)
if [ ! -f ".railway" ]; then
    echo "🚂 Inicializando proyecto Railway..."
    railway init
    
    if [ $? -ne 0 ]; then
        echo "❌ Error inicializando proyecto Railway"
        exit 1
    fi
fi

echo "✅ Proyecto Railway inicializado"
echo ""

# Deploy
echo "🚀 Haciendo deploy del servicio KNN..."
railway up

if [ $? -ne 0 ]; then
    echo "❌ Error en el deploy"
    exit 1
fi

echo "✅ Deploy completado exitosamente!"
echo ""

# Obtener URL del servicio
echo "🔍 Obteniendo URL del servicio..."
SERVICE_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SERVICE_URL" ]; then
    echo "⚠️ No se pudo obtener la URL automáticamente"
    echo "💡 Obtén la URL desde el dashboard de Railway"
else
    echo "✅ URL del servicio: $SERVICE_URL"
fi

echo ""
echo "🎉 ¡DEPLOY COMPLETADO!"
echo "======================"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. 🌐 URL del servicio KNN: $SERVICE_URL"
echo "2. 🔍 Probar health check: $SERVICE_URL/health"
echo "3. 📊 Ver estado del modelo: $SERVICE_URL/model-status"
echo "4. 📚 Documentación: $SERVICE_URL/docs"
echo ""
echo "🔧 CONFIGURACIÓN EN BACKEND:"
echo ""
echo "En tu backend principal, configura la variable de entorno:"
echo "KNN_API_URL=$SERVICE_URL"
echo ""
echo "📊 MONITOREO:"
echo ""
echo "Ver logs: cd knn && railway logs --follow"
echo "Ver estado: curl $SERVICE_URL/health"
echo ""
echo "🧪 PRUEBAS:"
echo ""
echo "Test básico:"
echo "curl -X POST $SERVICE_URL/recommend \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"user_id\": 1, \"limit\": 5}'"
echo ""
echo "✅ ¡El servicio KNN está listo para usar!" 