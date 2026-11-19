
const mongoose = require('mongoose');

const actividadSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },

    accion: {
        type: String,
        required: true,
        enum: [
            'videojuego_agregado',
            'videojuego_editado',
            'estado_modificado',
            'favorito_agregado',
            'favorito_eliminado',
            'videojuego_eliminado'
        ]
    },

    tituloVideojuego: {
        type: String,
        required: true,
        trim: true
    },

    detalles: {
        type: String,
        default: ''
    }

}, {
    timestamps: true,
    versionKey: false
});

actividadSchema.index({ usuarioId: 1, createdAt: -1 });

module.exports = mongoose.model('Actividad', actividadSchema);
