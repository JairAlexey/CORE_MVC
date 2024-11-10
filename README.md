# MovieMatch - Aplicación de Gestión de Películas y Tareas

[![Estado del Proyecto](https://img.shields.io/badge/Estado-Activo-brightgreen)](https://github.com/JairAlexey/CORE_MVC)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue.svg)](LICENSE)

## 🎬 Descripción

MovieMatch es una aplicación web full-stack que permite a los usuarios administradores gestionar películas. Cuenta con un sistema de autenticación y diferentes niveles de acceso para usuarios normales y administradores.

### 🌐 Enlaces de Acceso

- **Backend:** [https://cruddeployrailway-production.up.railway.app/](https://cruddeployrailway-production.up.railway.app/)
- **Frontend:** [https://efficient-mindfulness-production.up.railway.app/](https://efficient-mindfulness-production.up.railway.app/)

### 👥 Credenciales de Prueba

- **Usuario Administrador:**
  - Email: jair@gmail.com
  - Contraseña: jair123

- **Usuario Normal:**
  - Email: alexey@gmail.com
  - Contraseña: alexey123

## 🚀 Características Principales

- Sistema de autenticación y autorización
- Gestión de películas (CRUD)
- Sistema de tareas personales
- Panel de administración
- Interfaz responsiva
- Integración con API externa de películas
- Gestión de usuarios (solo administradores)

## 🛠️ Tecnologías Utilizadas

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router DOM
- React Icons
- React Hook Form

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT para autenticación
- Bcrypt para encriptación
- Zod para validación

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio:**

```bash
git clone https://github.com/JairAlexey/CORE_MVC.git
cd CORE_MVC
```

2. **Instalar dependencias del backend:**

```bash
cd backend
npm install
```

3. **Instalar dependencias del frontend:**

```bash
cd frontend
npm install
```

4. **Configurar variables de entorno:**

Crear archivo `.env` en la raíz del proyecto backend:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_db
ORIGIN=http://localhost:5173
JWT_SECRET=xyz123
```

5. **Configurar la base de datos:**

Crear las siguientes tablas en PostgreSQL:

```sql
CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(255),
email VARCHAR(255) UNIQUE,
password VARCHAR(255),
is_admin BOOLEAN DEFAULT FALSE,
gravatar VARCHAR(255)
);
CREATE TABLE movies (
id SERIAL PRIMARY KEY,
title VARCHAR(255) UNIQUE,
overview TEXT,
genre_ids INTEGER[],
release_date DATE,
poster_path VARCHAR(1000)
);
CREATE TABLE task (
id SERIAL PRIMARY KEY,
title VARCHAR(255),
description TEXT,
user_id INTEGER REFERENCES users(id)
);
```

## 🚀 Ejecución

1. **Iniciar el backend:**

```bash
cd backend
npm run dev
```

2. **Iniciar el frontend:**

```bash
cd frontend
npm run dev
```

3. **Acceder a la aplicación:**
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)

## 🔑 Características de Seguridad

- Autenticación mediante JWT
- Encriptación de contraseñas con Bcrypt
- Validación de datos con Zod
- Middleware de autorización para rutas protegidas
- CORS configurado para seguridad

## 👥 Roles de Usuario

### Administrador
- Gestión completa de películas
- Gestión de usuarios
- Acceso al panel de administración
- Gestión de tareas personales

### Usuario Normal
- Visualización de películas
- Gestión de tareas personales
- Acceso a perfil personal

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Hacer fork del repositorio
2. Crear una nueva rama
3. Realizar los cambios
4. Enviar un pull request

## 📧 Contacto

Jair Alexey - [GitHub](https://github.com/JairAlexey)

Link del Proyecto: [https://github.com/JairAlexey/CORE_MVC](https://github.com/JairAlexey/CORE_MVC)

---
⌨️ con ❤️ por [Jair Alexey](https://github.com/JairAlexey)