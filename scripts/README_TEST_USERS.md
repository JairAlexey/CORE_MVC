# Script de Generación de Usuarios de Prueba

Este script genera 100 usuarios de prueba con datos realistas para probar el modelo de recomendación.

## 🎯 Propósito

Generar datos de prueba que incluyan:
- **Usuarios realistas** con nombres y emails únicos
- **Calificaciones mixtas** de películas populares y no populares
- **Géneros favoritos** variados para cada usuario
- **Distribución realista** de ratings

## 🚀 Uso

```bash
npm run generate-test-users
```

## 📊 Características de los Datos Generados

### 👥 Usuarios
- **Cantidad:** 100 usuarios
- **Rango de IDs:** 9006 - 9105
- **Nombres:** Combinaciones realistas de nombres y apellidos españoles
- **Emails:** Formato `nombreapellido{id}@test.com`
- **Contraseña:** `123456` para todos los usuarios

### 🎬 Películas
- **Películas populares:** 20 películas reales de TMDB con vote_average ≥ 7.0
- **Películas no populares:** 20 películas reales de TMDB con vote_average < 6.0
- **Distribución:** 60% populares, 40% no populares por usuario

### ⭐ Calificaciones
- **Cantidad por usuario:** 5-20 calificaciones aleatorias
- **Lógica de ratings:**
  - Películas populares: 70% probabilidad de rating 4-5, 30% de 1-3
  - Películas no populares: 60% probabilidad de rating 1-3, 40% de 4-5

### 🎭 Géneros Favoritos
- **Combinaciones predefinidas** de 3 géneros por usuario
- **Variedad:** Acción, Drama, Comedia, Ciencia ficción, etc.

## 📋 Películas Incluidas

### Películas Populares
- The Shawshank Redemption (8.7)
- The Godfather (8.7)
- Schindler's List (8.6)
- The Green Mile (8.5)
- Pulp Fiction (8.5)
- Forrest Gump (8.4)
- Fight Club (8.4)
- The Lord of the Rings: The Return of the King (8.4)
- Inception (8.3)
- The Dark Knight (8.3)
- Y 10 más...

### Películas No Populares
- The Adventures of Pluto Nash (4.8)
- Battlefield Earth (3.4)
- Gigli (3.8)
- Catwoman (4.2)
- The Love Guru (4.1)
- Jack and Jill (3.8)
- Movie 43 (4.3)
- The Emoji Movie (4.8)
- Transformers: The Last Knight (5.2)
- The Mummy (5.4)
- King Arthur: Legend of the Sword (6.1)
- The Dark Tower (5.6)
- Flatliners (4.9)
- Geostorm (5.3)
- The Snowman (4.8)
- Suburbicon (5.2)
- Mother! (6.6)
- American Assassin (6.2)
- The Hitman's Bodyguard (6.9)
- Death Note (4.5)

## 🔧 Configuración

Puedes modificar las siguientes variables en el script:

```javascript
const NUM_USERS = 100;           // Cantidad de usuarios a generar
const START_USER_ID = 9006;      // ID inicial
const PASSWORD = '123456';       // Contraseña para todos los usuarios
```

## 📈 Salida del Script

```
🚀 Iniciando generación de usuarios de prueba...
📋 Generando 100 usuarios desde ID 9006

✅ Creados 10 usuarios...
✅ Creados 20 usuarios...
...
✅ Creados 100 usuarios...

🎉 Generación completada exitosamente!

📊 Resumen:
   - Usuarios creados: 100
   - Calificaciones generadas: 1250
   - Rango de IDs: 9006 - 9105

🔑 Información de acceso:
   - Contraseña para todos los usuarios: 123456
   - Formato de email: nombreapellido{id}@test.com

🎬 Distribución de películas:
   - Películas populares: ~60% de las calificaciones
   - Películas no populares: ~40% de las calificaciones
```

## 🧪 Uso para Pruebas del Modelo

Estos datos están diseñados para probar:

1. **Filtrado por géneros favoritos** - Usuarios con diferentes preferencias
2. **Predicciones de ML** - Mezcla de películas populares y no populares
3. **Recomendaciones** - Variedad en ratings y preferencias
4. **Conexiones entre usuarios** - Diferentes patrones de calificación

## ⚠️ Notas Importantes

- **No ejecutar en producción** - Solo para desarrollo y pruebas
- **Los datos se pueden limpiar** usando el script de limpieza
- **Las películas deben existir** en la base de datos antes de ejecutar
- **Backup recomendado** antes de ejecutar en base de datos con datos importantes 