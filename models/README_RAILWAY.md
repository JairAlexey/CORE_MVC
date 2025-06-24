# 🚀 Deploy del Servicio ML - MovieMatch

## 📋 Resumen

Este es un microservicio de Machine Learning separado que proporciona predicciones de recomendaciones de películas. Está optimizado para deploy en Railway.

## 🏗️ Arquitectura

```
┌─────────────────┐    HTTP    ┌─────────────────┐
│   Frontend      │ ────────── │   Backend       │
│   (React)       │            │   (Node.js)     │
└─────────────────┘            └─────────────────┘
                                       │
                                       │ HTTP
                                       ▼
                              ┌─────────────────┐
                              │   ML Service    │
                              │   (Python)      │
                              │   Railway       │
                              └─────────────────┘
```

## 🔧 Configuración para Railway

### 1. Archivos de Configuración

- ✅ `railway.json` - Configuración de Railway
- ✅ `Procfile` - Comando de inicio
- ✅ `.railwayignore` - Archivos excluidos
- ✅ `requirements.txt` - Dependencias Python

### 2. Optimizaciones Implementadas

#### 🚀 Carga Segura del Modelo
```python
# Fallback si el modelo no carga
if model is not None:
    # Usar modelo entrenado
else:
    # Usar algoritmo simple
```

#### 🌐 CORS Configurado
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir múltiples aplicaciones
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 📊 Logging Mejorado
```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 🚀 Pasos para Deploy

### 1. Preparar el Repositorio
```bash
# En la carpeta models/
git init
git add .
git commit -m "Initial ML service commit"
```

### 2. Conectar a Railway
```bash
railway login
railway init
```

### 3. Configurar Variables de Entorno
```bash
railway variables set PORT=8000
```

### 4. Deploy
```bash
railway up
```

## 📡 Endpoints Disponibles

### Health Check
```http
GET /
GET /health
```

### Predicción Individual
```http
POST /predict
Content-Type: application/json

{
  "n_shared_genres": 2,
  "vote_average": 7.5,
  "vote_count": 1000,
  "is_favorite_genre": 1,
  "years_since_release": 3,
  "popularity": 50.0
}
```

### Predicción en Lote
```http
POST /predict-batch
Content-Type: application/json

{
  "movies": [
    {
      "movie_id": 1,
      "n_shared_genres": 2,
      "vote_average": 7.5,
      "vote_count": 1000,
      "is_favorite_genre": 1,
      "years_since_release": 3,
      "popularity": 50.0
    }
  ]
}
```

## 🔗 Integración con Backend Principal

### 1. Variable de Entorno
```bash
# En el backend principal
ML_MODEL_URL=https://tu-servicio-ml.railway.app
```

### 2. Uso en el Código
```javascript
import { predictMovieRating, predictMultipleMovies } from '../services/mlModelService.js';

// Predicción individual
const result = await predictMovieRating(predictionData);

// Predicción en lote
const batchResult = await predictMultipleMovies(moviesFeatures);
```

## 📊 Monitoreo y Logs

### Verificar Estado
```bash
# Ver logs en Railway
railway logs

# Verificar health check
curl https://tu-servicio-ml.railway.app/health
```

### Métricas Importantes
- ✅ Tiempo de respuesta
- ✅ Uso de memoria
- ✅ Estado del modelo
- ✅ Errores de predicción

## 🔄 Escalabilidad

### Ventajas del Servicio Separado
- ✅ **Reutilizable**: Múltiples aplicaciones pueden consumirlo
- ✅ **Escalable**: Se puede escalar independientemente
- ✅ **Mantenible**: Actualizaciones sin afectar el backend principal
- ✅ **Especializado**: Optimizado para ML

### Estrategias de Escalado
1. **Horizontal**: Múltiples instancias del servicio
2. **Vertical**: Más recursos por instancia
3. **Caching**: Cachear predicciones frecuentes
4. **Load Balancing**: Distribuir carga entre instancias

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Modelo No Carga
```python
# Verificar en logs
logger.error(f"❌ Error cargando el modelo: {e}")
# El servicio usará algoritmo simple como fallback
```

#### 2. Timeout en Predicciones
```javascript
// Aumentar timeout en el cliente
timeout: 30000 // 30 segundos
```

#### 3. CORS Errors
```python
# Verificar configuración CORS
allow_origins=["*"]  # En desarrollo
```

### Logs Útiles
```bash
# Ver logs en tiempo real
railway logs --follow

# Ver logs de errores
railway logs --level error
```

## 🔮 Próximos Pasos

### Mejoras Futuras
1. **Modelo más ligero**: Usar ONNX o TensorFlow Lite
2. **Caching**: Redis para predicciones frecuentes
3. **A/B Testing**: Comparar modelos
4. **Métricas**: Prometheus + Grafana
5. **Auto-scaling**: Basado en demanda

### Integración con Otros Servicios
- ✅ **Google Cloud ML**: Para modelos más complejos
- ✅ **AWS SageMaker**: Para entrenamiento automático
- ✅ **Azure ML**: Para pipelines de ML
- ✅ **Hugging Face**: Para modelos de NLP

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en Railway
2. Prueba el endpoint `/health`
3. Verifica las variables de entorno
4. Revisa la conectividad de red 