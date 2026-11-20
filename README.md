# RHLM Gaming

**Real Gamers Never Die**

Aplicación web Full Stack para administrar una colección personal de videojuegos. Permite registrar usuarios, iniciar sesión, consultar videojuegos, agregarlos a una colección, actualizar sus datos y eliminarlos. También incorpora búsqueda y autocompletado de información mediante la API de RAWG, así como un historial de actividad por usuario.

## Funcionalidades

- Registro de usuarios con nombre de usuario, correo electrónico y contraseña.
- Inicio de sesión mediante nombre de usuario o correo electrónico.
- Autenticación basada en JSON Web Tokens (JWT).
- Protección de las rutas de videojuegos mediante middleware de autenticación.
- Operaciones CRUD para la colección personal: crear, consultar, actualizar y eliminar videojuegos.
- Asociación de cada videojuego con el usuario propietario.
- Datos de videojuegos: título, plataforma, géneros, desarrollador, año de lanzamiento, estado, favorito y portada.
- Estados disponibles: `Pendiente`, `Jugando`, `Completado` y `Dropped`.
- Búsqueda de videojuegos y recuperación de detalles mediante RAWG.
- Historial de actividad relacionado con las operaciones realizadas en la colección.
- Interfaz web servida por Express desde la carpeta `public`.

## Tecnologías

| Área | Tecnología |
|---|---|
| Entorno de ejecución | Node.js |
| Servidor y API | Express 5 |
| Base de datos | MongoDB |
| ODM | Mongoose |
| Autenticación | JSON Web Token (JWT) |
| Hash de contraseñas | bcryptjs |
| Búsqueda de videojuegos | RAWG API |
| Pruebas | Jest, Supertest y MongoDB Memory Server |
| Integración y despliegue continuo | GitHub Actions |
| Hosting del servidor | Render |

## Estructura del proyecto

```text
RHLM-Gaming/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── img/
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   └── game-search.js
│   ├── index.html
│   ├── login.html
│   └── register.html
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── videojuegoController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Actividad.js
│   │   ├── Usuario.js
│   │   └── Videojuego.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── videojuegoRoutes.js
│   └── app.js
├── tests/
│   └── api.test.js
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Requisitos previos

- Node.js y npm.
- Una instancia de MongoDB accesible desde el entorno donde se ejecutará la aplicación (por ejemplo, MongoDB Atlas).
- Una clave de API de RAWG para habilitar la búsqueda y consulta de detalles de videojuegos.

## Configuración e instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/rickx33-glitch/RHLM-Gaming.git
   cd RHLM-Gaming
   ```

2. Instalar las dependencias:

   ```bash
   npm ci
   ```

3. Crear un archivo `.env` en la raíz del proyecto y definir las variables necesarias:

   ```env
   PORT=3000
   MONGODB_URI=tu_cadena_de_conexion_mongodb
   JWT_SECRET=tu_secreto_jwt
   JWT_EXPIRES_IN=1d
   RAWG_API_KEY=tu_clave_de_rawg
   ```

   Sustituir los valores de ejemplo por credenciales propias. No subir el archivo `.env` al repositorio ni compartir sus valores. El archivo está excluido mediante `.gitignore`.

4. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   Para iniciar el servidor normalmente:

   ```bash
   npm start
   ```

5. Abrir `http://localhost:3000` en el navegador. La aplicación web es servida por Express desde la carpeta `public`.

## API

La API utiliza el prefijo `/api`.

### Comprobación del servicio

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/api/health` | Comprueba que la API está disponible. | No |

### Autenticación

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| POST | `/api/auth/register` | Registra un usuario. | No |
| POST | `/api/auth/login` | Inicia sesión y devuelve un JWT. | No |

El registro recibe `username`, `email` y `password`. La contraseña debe tener al menos ocho caracteres. El inicio de sesión recibe `identificador` (nombre de usuario o correo electrónico) y `password`.

### Videojuegos e historial

Todas las rutas siguientes requieren un JWT válido en el encabezado:

```http
Authorization: Bearer <token>
```

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/videojuegos` | Consulta los videojuegos del usuario autenticado. |
| POST | `/api/videojuegos` | Agrega un videojuego a la colección. |
| PUT | `/api/videojuegos/:id` | Actualiza un videojuego propio. |
| DELETE | `/api/videojuegos/:id` | Elimina un videojuego propio. |
| GET | `/api/videojuegos/actividad` | Consulta el historial de actividad del usuario. |
| GET | `/api/videojuegos/buscar?q=:termino` | Busca videojuegos en RAWG. |
| GET | `/api/videojuegos/buscar/:id` | Recupera los detalles de un videojuego de RAWG. |

Las operaciones sobre videojuegos se filtran por el identificador del usuario autenticado, de modo que cada usuario administra su propia colección.

## Modelo de datos

La aplicación utiliza tres modelos de Mongoose:

- **Usuario:** almacena `username`, `email` y `password` (hash). El nombre de usuario y el correo electrónico son únicos.
- **Videojuego:** almacena la información del juego y `usuarioId`, que referencia al usuario propietario. Se aplica un índice único compuesto por `usuarioId`, `titulo` y `plataforma` para evitar duplicados de un mismo título en la misma plataforma dentro de la colección de un usuario.
- **Actividad:** registra acciones realizadas por un usuario, el título del videojuego relacionado y detalles de la acción. Cada registro referencia a `Usuario` mediante `usuarioId`.

Relaciones principales:

- Un **Usuario** puede tener muchos **Videojuegos**.
- Un **Usuario** puede tener muchos registros de **Actividad**.
- Cada **Videojuego** pertenece a un **Usuario**.
- Cada registro de **Actividad** pertenece a un **Usuario**.

## Pruebas automatizadas

El proyecto utiliza Jest y Supertest. Las pruebas se ejecutan con:

```bash
npm test
```

La suite utiliza MongoDB Memory Server para levantar una base de datos temporal durante las pruebas. Los casos implementados verifican:

- Registro de usuario.
- Inicio de sesión y generación de token JWT.
- Rechazo de solicitudes a videojuegos sin autenticación.
- Creación, consulta, actualización y eliminación de videojuegos mediante la API.

## Integración continua y despliegue

El flujo se encuentra en `.github/workflows/ci.yml` y se ejecuta cuando hay cambios en la rama `main` o solicitudes de integración dirigidas a esa rama.

El workflow realiza estos pasos:

1. Descarga el código del repositorio.
2. Configura Node.js 24.
3. Instala dependencias mediante `npm ci`.
4. Ejecuta las pruebas con `npm test`.
5. En eventos `push` a `main`, solicita el despliegue en Render mediante un Deploy Hook.

Para habilitar el despliegue automático, se debe configurar el secreto `RENDER_DEPLOY_HOOK` en **Settings → Secrets and variables → Actions** del repositorio de GitHub. El valor debe ser la URL privada del Deploy Hook de Render. No debe escribirse directamente en el archivo YAML ni publicarse.

La aplicación se aloja en Render y utiliza MongoDB Atlas como servicio de base de datos. Las variables de entorno se configuran de forma privada en el entorno de despliegue.

## Seguridad

- Las contraseñas se almacenan mediante hash con bcryptjs.
- La autenticación utiliza tokens JWT.
- Las rutas de colección e historial requieren autenticación.
- Las consultas y modificaciones de videojuegos se limitan al usuario autenticado.
- Las credenciales y claves API se configuran mediante variables de entorno y no deben incluirse en Git.

## Autoría y propósito

Proyecto académico desarrollado para la actividad de Desarrollo Full Stack. **RHLM Gaming** permite organizar una colección personal de videojuegos y demostrar la integración de frontend, backend, persistencia de datos, autenticación, pruebas automatizadas y despliegue en la nube.
