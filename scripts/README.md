# Scripts de Limpieza de Datos

Este directorio contiene scripts para limpiar datos de la base de datos.

## Scripts Disponibles

### 1. `cleanup_users.sql`
Script SQL puro para limpiar usuarios específicos.

**Uso:**
```bash
psql -d tu_base_de_datos -f scripts/cleanup_users.sql
```

### 2. `cleanup_users.js`
Script de Node.js con mejor feedback y validaciones.

**Uso:**
```bash
npm run cleanup-users
```

## ¿Qué hace el script?

El script elimina **completamente** todos los usuarios desde el ID **7004 hasta el ID 8004** junto con todos sus datos relacionados:

1. **Recomendaciones de películas** - Donde estos usuarios son remitentes o receptores
2. **Conexiones de usuario** - Conexiones donde estos usuarios están involucrados
3. **Calificaciones de películas** - Todas las calificaciones de estos usuarios
4. **Usuarios** - Los usuarios mismos

**Rango eliminado:** 7004, 7005, 7006, ..., 7999, 8000, 8001, 8002, 8003, 8004

## ⚠️ ADVERTENCIA

- **Este script elimina datos permanentemente**
- **No hay forma de recuperar los datos eliminados**
- **Ejecutar solo si estás seguro de que quieres eliminar estos usuarios**
- **Se eliminarán TODOS los usuarios en el rango 7004-8004**

## Personalización

Para eliminar otros rangos de usuarios, edita las variables en `cleanup_users.js`:

```javascript
const USER_RANGE_START = 7004; // Cambia el inicio del rango
const USER_RANGE_END = 8004;   // Cambia el fin del rango
```

## Salida del Script

El script mostrará:
- Rango de usuarios a eliminar
- Usuarios encontrados antes de eliminar
- Cantidad de datos eliminados en cada tabla
- Resumen final de la operación
- Confirmación de éxito o error

## Ejemplo de Salida

```
🚀 Iniciando limpieza de usuarios...
📋 Rango de usuarios a eliminar: 7004 hasta 8004
📊 Total de usuarios en el rango: 1001

👥 Usuarios encontrados en el rango (150 usuarios):
   - ID: 7004, Nombre: Usuario1, Email: user1@example.com
   - ID: 7005, Nombre: Usuario2, Email: user2@example.com
   ...

🗑️  Eliminadas 45 recomendaciones de películas
🔗 Eliminadas 12 conexiones de usuario
⭐ Eliminadas 89 calificaciones de películas
👤 Eliminados 150 usuarios

✅ Limpieza completada exitosamente! 