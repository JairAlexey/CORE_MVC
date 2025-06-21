# 🤖 Sistema de IA para Recomendaciones de Películas

## Descripción

Este sistema utiliza un modelo de Machine Learning entrenado para predecir si a un usuario le gustará una película específica basándose en sus preferencias y características de la película.

## 🏗️ Arquitectura

### Componentes Principales

1. **Modelo de ML (FastAPI)**: Servicio independiente que procesa predicciones
2. **Servicio de ML (Node.js)**: Interfaz entre el backend y el modelo
3. **Controlador de Recomendaciones**: Orquesta el proceso completo
4. **Frontend**: Muestra las probabilidades de IA de manera visual

### Flujo de Datos

```
Usuario solicita recomendaciones
    ↓
Backend obtiene películas recomendables
    ↓
Calcula features para cada película
    ↓
Envía features al modelo de ML (lote)
    ↓
Modelo devuelve probabilidades
    ↓
Backend combina datos y responde
    ↓
Frontend muestra probabilidades visualmente
```

## 🚀 Configuración

### 1. Instalar Dependencias del Modelo

```bash
cd models
pip install -r requirements.txt
```

### 2. Iniciar el Servicio de ML

```bash
cd models
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verificar que Funciona

```bash
cd models
python test_model.py
```

## 📊 Features del Modelo

El modelo analiza las siguientes características:

| Feature | Descripción | Tipo |
|---------|-------------|------|
| `n_shared_genres` | Número de géneros compartidos entre usuario y película | Integer |
| `vote_average` | Calificación promedio de la película | Float |
| `vote_count` | Número total de votos | Integer |
| `is_favorite_genre` | Si la película pertenece a géneros favoritos del usuario | Binary (0/1) |
| `years_since_release` | Años transcurridos desde el lanzamiento | Integer |
| `popularity` | Popularidad de la película | Float |

## 🔧 Endpoints del Modelo

### Predicción Individual
```http
POST /predict
Content-Type: application/json

{
  "n_shared_genres": 2,
  "vote_average": 7.5,
  "vote_count": 1500,
  "is_favorite_genre": 1,
  "years_since_release": 3,
  "popularity": 85.5
}
```

**Respuesta:**
```json
{
  "prediction": 1,
  "probability_like": 78.5,
  "probability_dislike": 21.5
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
      "vote_count": 1500,
      "is_favorite_genre": 1,
      "years_since_release": 3,
      "popularity": 85.5
    }
  ]
}
```

**Respuesta:**
```json
{
  "predictions": [
    {
      "movie_id": 1,
      "prediction": 1,
      "probability_like": 78.5,
      "probability_dislike": 21.5
    }
  ],
  "total_movies": 1
}
```

## 🎨 Visualización en el Frontend

### Componente AIProbabilityBadge

Muestra las probabilidades de IA con:
- **Colores dinámicos**: Verde (alta probabilidad) a Rojo (baja probabilidad)
- **Emojis expresivos**: 🤩 😊 🤔 😐 😞
- **Porcentaje claro**: 85% IA

### Interpretación de Probabilidades

| Rango | Color | Emoji | Significado |
|-------|-------|-------|-------------|
| 80-100% | Verde | 🤩 | ¡Muy recomendada! |
| 60-79% | Azul | 😊 | Podría gustarte |
| 40-59% | Amarillo | 🤔 | Neutral |
| 20-39% | Naranja | 😐 | Probablemente no te guste |
| 0-19% | Rojo | 😞 | Muy probable que no te guste |

## 🔍 Debugging

### Verificar Estado del Modelo

```bash
curl http://localhost:8000/
```

### Probar Predicción Individual

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "n_shared_genres": 2,
    "vote_average": 7.5,
    "vote_count": 1500,
    "is_favorite_genre": 1,
    "years_since_release": 3,
    "popularity": 85.5
  }'
```

### Logs del Backend

Los logs mostrarán:
- Features calculados para cada película
- Respuestas del modelo de ML
- Errores de conexión o procesamiento

## 🚨 Troubleshooting

### Error: "Error al comunicarse con el modelo de ML"

1. Verificar que el servicio FastAPI esté ejecutándose
2. Comprobar la URL en `mlModelService.js`
3. Verificar que el puerto 8000 esté disponible

### Error: "Error en predicción en lote"

1. Verificar que el modelo esté cargado correctamente
2. Comprobar el formato de los datos enviados
3. Revisar los logs del servicio FastAPI

### Predicciones Inconsistentes

1. Verificar que los features se calculen correctamente
2. Comprobar que los géneros favoritos del usuario estén configurados
3. Validar que los datos de las películas sean correctos

## 📈 Optimizaciones

### Predicción en Lote
- Reduce llamadas HTTP de N a 1
- Mejora significativamente el rendimiento
- Ideal para listas de recomendaciones

### Caché de Features
- Los features se calculan una vez por usuario/película
- Se pueden almacenar temporalmente para reutilización

### Manejo de Errores
- Fallback graceful si el modelo no está disponible
- Recomendaciones se muestran sin predicciones de IA
- Logs detallados para debugging

## 🔮 Futuras Mejoras

1. **Modelo más sofisticado**: Incluir más features como actores, director, etc.
2. **Aprendizaje continuo**: Actualizar el modelo con nuevas calificaciones
3. **Personalización**: Modelos específicos por usuario
4. **Recomendaciones en tiempo real**: Predicciones al navegar por películas
5. **Análisis de sentimientos**: Procesar comentarios de usuarios

## 📝 Notas Técnicas

- El modelo actual es un clasificador binario (gusta/no gusta)
- Las probabilidades suman 100%
- El modelo se entrena con datos históricos de calificaciones
- Se actualiza periódicamente con nuevos datos 