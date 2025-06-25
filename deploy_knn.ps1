# 🚀 DEPLOY COMPLETO - SERVICIO KNN MOVIEMATCH
Write-Host "🚀 DEPLOY COMPLETO - SERVICIO KNN MOVIEMATCH" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Verificar que estemos en la raíz del proyecto
if (-not (Test-Path "package.json") -or -not (Test-Path "knn")) {
    Write-Host "❌ No se detectó la estructura del proyecto MovieMatch" -ForegroundColor Red
    Write-Host "💡 Asegúrate de estar en la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Estructura del proyecto verificada" -ForegroundColor Green
Write-Host ""

# Verificar que Railway CLI esté instalado
try {
    $null = Get-Command railway -ErrorAction Stop
    Write-Host "✅ Railway CLI detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala Railway CLI: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Navegar a la carpeta knn
Write-Host "📁 Navegando a la carpeta knn..." -ForegroundColor Cyan
Set-Location knn

# Verificar que el modelo esté entrenado
if (-not (Test-Path "knn_model.pkl")) {
    Write-Host "⚠️ Modelo KNN no encontrado, entrenando..." -ForegroundColor Yellow
    python train_knn_model.py
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error entrenando el modelo KNN" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Modelo KNN verificado" -ForegroundColor Green
Write-Host ""

# Login a Railway
Write-Host "🔐 Verificando login de Railway..." -ForegroundColor Cyan
try {
    railway whoami
} catch {
    Write-Host "🔐 Haciendo login en Railway..." -ForegroundColor Cyan
    railway login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en login de Railway" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Login de Railway completado" -ForegroundColor Green
Write-Host ""

# Inicializar proyecto Railway (si no está inicializado)
if (-not (Test-Path ".railway")) {
    Write-Host "🚂 Inicializando proyecto Railway..." -ForegroundColor Cyan
    railway init
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error inicializando proyecto Railway" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Proyecto Railway inicializado" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🚀 Haciendo deploy del servicio KNN..." -ForegroundColor Cyan
railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el deploy" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy completado exitosamente!" -ForegroundColor Green
Write-Host ""

# Obtener URL del servicio
Write-Host "🔍 Obteniendo URL del servicio..." -ForegroundColor Cyan
try {
    $status = railway status --json
    $serviceUrl = ($status | ConvertFrom-Json).url
    
    if ($serviceUrl) {
        Write-Host "✅ URL del servicio: $serviceUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
        Write-Host "💡 Obtén la URL desde el dashboard de Railway" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
    Write-Host "💡 Obtén la URL desde el dashboard de Railway" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ¡DEPLOY COMPLETADO!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host ""

if ($serviceUrl) {
    Write-Host "1. 🌐 URL del servicio KNN: $serviceUrl" -ForegroundColor White
    Write-Host "2. 🔍 Probar health check: $serviceUrl/health" -ForegroundColor White
    Write-Host "3. 📊 Ver estado del modelo: $serviceUrl/model-status" -ForegroundColor White
    Write-Host "4. 📚 Documentación: $serviceUrl/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 CONFIGURACIÓN EN BACKEND:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "En tu backend principal, configura la variable de entorno:" -ForegroundColor White
    Write-Host "KNN_API_URL=$serviceUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 MONITOREO:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ver logs: cd knn && railway logs --follow" -ForegroundColor White
    Write-Host "Ver estado: curl $serviceUrl/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 PRUEBAS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test básico:" -ForegroundColor White
    Write-Host "curl -X POST $serviceUrl/recommend \" -ForegroundColor White
    Write-Host "  -H 'Content-Type: application/json' \" -ForegroundColor White
    Write-Host "  -d '{\"user_id\": 1, \"limit\": 5}'" -ForegroundColor White
} else {
    Write-Host "1. 🌐 Obtén la URL del servicio desde Railway Dashboard" -ForegroundColor White
    Write-Host "2. 🔍 Configura la variable KNN_API_URL en tu backend" -ForegroundColor White
    Write-Host "3. 📊 Prueba los endpoints" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ ¡El servicio KNN está listo para usar!" -ForegroundColor Green 