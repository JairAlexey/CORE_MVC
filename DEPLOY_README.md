# 🚀 Guía de Deploy - MovieMatch

## 📋 Resumen de Cambios para Railway

### ✅ Problemas Resueltos

1. **Servicio ML Separado**: El modelo de ML ahora es un microservicio independiente optimizado para Railway
2. **Arquitectura Escalable**: Múltiples aplicaciones pueden consumir el servicio ML
3. **Deploy Optimizado**: Configuración específica para Railway con fallbacks

### 🔧 Cambios Realizados

#### 1. Servicio ML Optimizado (`models/main.py`)
- ✅ Carga segura del modelo con fallback a algoritmo simple
- ✅ Configuración CORS para múltiples aplicaciones
- ✅ Logging mejorado y manejo de errores
- ✅ Puerto dinámico para Railway

#### 2. Configuración Railway (`models/`)
- ✅ `railway.json` con configuración específica
- ✅ `Procfile` para comando de inicio
- ✅ `.railwayignore` para excluir archivos innecesarios
- ✅ `requirements.txt` optimizado

#### 3. Integración Backend (`src/services/mlModelService.js`)
- ✅ URLs configurables por variable de entorno
- ✅ Función de health check del servicio ML
- ✅ Manejo de errores mejorado

### 🏗️ Arquitectura Final

```
┌─────────────────┐    HTTP    ┌─────────────────┐
│   Frontend      │ ────────── │   Backend       │
│   (React)       │            │   (Node.js)     │
│   Railway       │            │   Railway       │
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

### 🚀 Pasos para Deploy

#### 1. Deploy del Servicio ML
```bash
# Navegar a la carpeta models
cd models/

# Ejecutar script de deploy (Linux/Mac)
chmod +x deploy.sh
./deploy.sh

# O manualmente:
railway login
railway init
railway up
```

#### 2. Deploy del Backend Principal
```bash
# En la raíz del proyecto
railway login
railway init
railway up
```

#### 3. Configurar Variables de Entorno

**Backend Principal:**
```bash
DATABASE_URL=tu_url_de_base_de_datos
JWT_SECRET=tu_secreto_jwt
ORIGIN=https://tu-frontend.railway.app
ML_MODEL_URL=https://tu-servicio-ml.railway.app
```

**Servicio ML:**
```bash
PORT=8000
```

### 📡 Endpoints del Servicio ML

#### Health Check
```http
GET https://tu-servicio-ml.railway.app/health
```

#### Predicción Individual
```http
POST https://tu-servicio-ml.railway.app/predict
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

#### Predicción en Lote
```http
POST https://tu-servicio-ml.railway.app/predict-batch
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

### 🔍 Verificación Post-Deploy

1. **Servicio ML**:
   ```bash
   curl https://tu-servicio-ml.railway.app/health
   ```

2. **Backend Principal**:
   ```bash
   curl https://tu-backend.railway.app/
   ```

3. **Integración**:
   - Verificar que el backend puede comunicarse con el servicio ML
   - Probar predicciones desde la aplicación

### 📊 Ventajas de esta Solución

- ✅ **Servicio Reutilizable**: Múltiples aplicaciones pueden consumirlo
- ✅ **Escalabilidad**: Se puede escalar independientemente
- ✅ **Mantenibilidad**: Actualizaciones sin afectar el backend principal
- ✅ **Robustez**: Fallback a algoritmo simple si el modelo falla
- ✅ **Optimización**: Configuración específica para Railway

### 🔄 Monitoreo

#### Logs del Servicio ML
```bash
cd models/
railway logs --follow
```

#### Logs del Backend
```bash
railway logs --follow
```

#### Métricas Importantes
- Tiempo de respuesta del servicio ML
- Uso de memoria
- Estado del modelo
- Errores de comunicación entre servicios

### 🛠️ Troubleshooting

#### Problemas Comunes

1. **Servicio ML no responde**:
   ```bash
   # Verificar logs
   cd models/
   railway logs
   
   # Verificar health check
   curl https://tu-servicio-ml.railway.app/health
   ```

2. **Backend no puede conectar al ML**:
   ```bash
   # Verificar variable de entorno
   echo $ML_MODEL_URL
   
   # Verificar conectividad
   curl $ML_MODEL_URL/health
   ```

3. **Modelo no carga**:
   - El servicio usará algoritmo simple como fallback
   - Verificar que `recommender_model.pkl` esté en el deploy

### 🔮 Próximos Pasos

#### Mejoras Futuras
1. **Caching**: Redis para predicciones frecuentes
2. **Load Balancing**: Múltiples instancias del servicio ML
3. **Métricas**: Prometheus + Grafana
4. **Auto-scaling**: Basado en demanda
5. **A/B Testing**: Comparar modelos

#### Integración con Otros Servicios
- Google Cloud ML para modelos más complejos
- AWS SageMaker para entrenamiento automático
- Azure ML para pipelines de ML

### 📞 Soporte

Si tienes problemas:
1. Verifica los logs en Railway
2. Prueba los endpoints de health check
3. Verifica las variables de entorno
4. Revisa la conectividad entre servicios 