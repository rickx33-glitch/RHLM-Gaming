
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
    obtenerVideojuegos,
    crearVideojuego,
    actualizarVideojuego,
    eliminarVideojuego,
    obtenerActividad,
    buscarVideojuegos,
    obtenerDetalleRAWG
} = require('../controllers/videojuegoController');

router.use(authMiddleware);

// Buscador externo RAWG
router.get('/buscar', buscarVideojuegos);
router.get('/buscar/:id', obtenerDetalleRAWG);

// Historial de actividad
router.get('/actividad', obtenerActividad);

// CRUD de videojuegos
router.get('/', obtenerVideojuegos);
router.post('/', crearVideojuego);
router.put('/:id', actualizarVideojuego);
router.delete('/:id', eliminarVideojuego);

module.exports = router;
