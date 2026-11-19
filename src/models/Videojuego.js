const mongoose = require('mongoose');

const videojuegoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    plataforma: {
        type: String,
        required: true,
        enum: ['PC', 'PlayStation 5', 'Xbox Series X|S']
    },

    generos: {
        type: [{
            type: String,
            enum: [
                'Accion',
                'Aventura',
                'RPG',
                'MMORPG',
                'FPS',
                'TPS',
                'Estrategia',
                'Simulacion',
                'Deportes',
                'Carreras',
                'Terror',
                'Puzzle',
                'Plataformas',
                'Lucha',
                'Battle Royale',
                'Supervivencia'
            ]
        }],
        required: true,
        validate: {
            validator: generos => generos.length > 0,
            message: 'Selecciona al menos un genero'
        }
    },

    desarrollador: {
        type: String,
        required: true,
        trim: true
    },

    anioLanzamiento: {
        type: Number,
        required: true,
        min: 1950,
        max: new Date().getFullYear()
    },

    estado: {
        type: String,
        enum: ['Pendiente', 'Jugando', 'Completado', 'Dropped'],
        default: 'Pendiente'
    },

    favorito: {
        type: Boolean,
        default: false
    },

    portada: {
        type: String,
        default: ''
    },

    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    }

}, {
    timestamps: true,
    versionKey: false
});

// Evitar videojuegos duplicados por usuario y plataforma
videojuegoSchema.index(
    { usuarioId: 1, titulo: 1, plataforma: 1 },
    { unique: true }
);

const Videojuego = mongoose.model('Videojuego', videojuegoSchema);

module.exports = Videojuego;