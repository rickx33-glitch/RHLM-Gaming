
if (process.env.NODE_ENV !== 'test') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const videojuegoRoutes = require('./routes/videojuegoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos del frontend
app.use(express.static(path.join(__dirname, '../public')));

// Ruta de comprobacion de API
app.get('/api/health', (req, res) => {
    res.status(200).json({
        mensaje: 'RHLM Gaming API funcionando correctamente',
        estado: 'OK'
    });
});

// Rutas de autenticacion y videojuegos
app.use('/api/auth', authRoutes);
app.use('/api/videojuegos', videojuegoRoutes);

module.exports = app;
