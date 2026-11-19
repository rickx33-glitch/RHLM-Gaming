
const Videojuego = require('../models/Videojuego');
const Actividad = require('../models/Actividad');

const RAWG_URL = 'https://api.rawg.io/api';

// REGISTRAR ACTIVIDAD SIN INTERRUMPIR EL CRUD
const registrarActividad = async (usuarioId, accion, tituloVideojuego, detalles = '') => {
    try {
        await Actividad.create({
            usuarioId,
            accion,
            tituloVideojuego,
            detalles
        });
    } catch (error) {
        console.error('Error al registrar actividad:', error.message);
    }
};

// OBTENER TODOS LOS VIDEOJUEGOS DEL USUARIO
const obtenerVideojuegos = async (req, res) => {
    try {
        const videojuegos = await Videojuego.find({
            usuarioId: req.usuario.id
        }).sort({ createdAt: -1 });

        res.json(videojuegos);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener los videojuegos'
        });
    }
};

// CREAR VIDEOJUEGO
const crearVideojuego = async (req, res) => {
    try {
        const videojuego = await Videojuego.create({
            ...req.body,
            usuarioId: req.usuario.id
        });

        await registrarActividad(
            req.usuario.id,
            'videojuego_agregado',
            videojuego.titulo,
            'Agregaste este videojuego a tu colección.'
        );

        res.status(201).json({
    mensaje: 'Videojuego creado correctamente',
    videojuego
});
    } catch (error) {
        res.status(400).json({
            mensaje: error.message
        });
    }
};

// ACTUALIZAR VIDEOJUEGO
const actualizarVideojuego = async (req, res) => {
    try {
        const videojuegoAnterior = await Videojuego.findOne({
            _id: req.params.id,
            usuarioId: req.usuario.id
        });

        if (!videojuegoAnterior) {
            return res.status(404).json({
                mensaje: 'Videojuego no encontrado'
            });
        }

        const videojuegoActualizado = await Videojuego.findOneAndUpdate(
            {
                _id: req.params.id,
                usuarioId: req.usuario.id
            },
            req.body,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (videojuegoAnterior.estado !== videojuegoActualizado.estado) {
            await registrarActividad(
                req.usuario.id,
                'estado_modificado',
                videojuegoActualizado.titulo,
                `Cambiaste el estado de ${videojuegoAnterior.estado} a ${videojuegoActualizado.estado}.`
            );
        }

        if (videojuegoAnterior.favorito !== videojuegoActualizado.favorito) {
            const accion = videojuegoActualizado.favorito
                ? 'favorito_agregado'
                : 'favorito_eliminado';

            await registrarActividad(
                req.usuario.id,
                accion,
                videojuegoActualizado.titulo,
                videojuegoActualizado.favorito
                    ? 'Agregaste este videojuego a tus favoritos.'
                    : 'Quitaste este videojuego de tus favoritos.'
            );
        }

        if (
            videojuegoAnterior.estado === videojuegoActualizado.estado &&
            videojuegoAnterior.favorito === videojuegoActualizado.favorito
        ) {
            await registrarActividad(
                req.usuario.id,
                'videojuego_editado',
                videojuegoActualizado.titulo,
                'Editaste la información de este videojuego.'
            );
        }

        res.json({
    mensaje: 'Videojuego actualizado correctamente',
    videojuego: videojuegoActualizado
});
    } catch (error) {
        res.status(400).json({
            mensaje: error.message
        });
    }
};

// ELIMINAR VIDEOJUEGO
const eliminarVideojuego = async (req, res) => {
    try {
        const videojuego = await Videojuego.findOneAndDelete({
            _id: req.params.id,
            usuarioId: req.usuario.id
        });

        if (!videojuego) {
            return res.status(404).json({
                mensaje: 'Videojuego no encontrado'
            });
        }

        await registrarActividad(
            req.usuario.id,
            'videojuego_eliminado',
            videojuego.titulo,
            'Eliminaste este videojuego de tu colección.'
        );

        res.json({
            mensaje: 'Videojuego eliminado correctamente'
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar el videojuego'
        });
    }
};

// OBTENER HISTORIAL DE ACTIVIDAD
const obtenerActividad = async (req, res) => {
    try {
        const actividades = await Actividad.find({
            usuarioId: req.usuario.id
        })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(actividades);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener la actividad'
        });
    }
};

// BUSCAR VIDEOJUEGOS EN RAWG
const buscarVideojuegos = async (req, res) => {
    try {
        const busqueda = req.query.q || req.query.search;   

        if (!busqueda) {
            return res.json({
                resultados: []
            });
        }

        const respuesta = await fetch(
            `${RAWG_URL}/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(busqueda)}&page_size=7`
        );

        if (!respuesta.ok) {
            throw new Error('Error al consultar RAWG');
        }

        const datos = await respuesta.json();

        const resultados = datos.results.map(juego => ({
            id: juego.id,
            nombre: juego.name,
            lanzamiento: juego.released
                ? juego.released.substring(0, 4)
                : '',
            portada: juego.background_image || ''
        }));

        res.json({
            resultados
        });
    } catch (error) {
        console.error('Error RAWG:', error.message);

        res.status(500).json({
            mensaje: 'Error al buscar videojuegos'
        });
    }
};

// OBTENER DETALLE DE UN VIDEOJUEGO EN RAWG
const obtenerDetalleRAWG = async (req, res) => {
    try {
        const respuesta = await fetch(
            `${RAWG_URL}/games/${req.params.id}?key=${process.env.RAWG_API_KEY}`
        );

        if (!respuesta.ok) {
            throw new Error('No se pudo obtener el detalle del videojuego');
        }

        const juego = await respuesta.json();

        const generosRAWG = {
            action: 'Accion',
            adventure: 'Aventura',
            'role-playing-games-rpg': 'RPG',
            shooter: 'FPS',
            strategy: 'Estrategia',
            simulation: 'Simulacion',
            sports: 'Deportes',
            racing: 'Carreras',
            puzzle: 'Puzzle',
            platformer: 'Plataformas',
            fighting: 'Lucha',
            indie: 'Aventura'
        };

        const generos = (juego.genres || [])
            .map(genero => generosRAWG[genero.slug])
            .filter(Boolean);

        const plataformas = (juego.platforms || [])
            .map(item => item.platform.name);

        let plataforma = 'PC';

        if (plataformas.some(nombre => nombre.toLowerCase().includes('playstation 5'))) {
            plataforma = 'PlayStation 5';
        } else if (plataformas.some(nombre => nombre.toLowerCase().includes('xbox series'))) {
            plataforma = 'Xbox Series X|S';
        }

        res.json({
            titulo: juego.name || '',
            anioLanzamiento: juego.released
                ? Number(juego.released.substring(0, 4))
                : new Date().getFullYear(),
            desarrollador: juego.developers?.[0]?.name || 'Desarrollador desconocido',
            generos: [...new Set(generos)],
            plataforma,
            portada: juego.background_image || ''
        });
    } catch (error) {
        console.error('Error detalle RAWG:', error.message);

        res.status(500).json({
            mensaje: 'Error al obtener los detalles del videojuego'
        });
    }
};

module.exports = {
    obtenerVideojuegos,
    crearVideojuego,
    actualizarVideojuego,
    eliminarVideojuego,
    obtenerActividad,
    buscarVideojuegos,
    obtenerDetalleRAWG
};
