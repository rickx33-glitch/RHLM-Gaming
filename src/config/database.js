
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error('MONGODB_URI no está definida en el archivo .env');
        }

        console.log('Verificando configuración de MongoDB...');
        console.log('Variable MONGODB_URI:', 'Detectada');
        console.log('Formato:', uri.startsWith('mongodb+srv://')
            ? 'MongoDB Atlas SRV'
            : 'MongoDB estándar');

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log('MongoDB conectado correctamente');

    } catch (error) {
        console.error('\n===== ERROR DE CONEXIÓN MONGODB =====');
        console.error('Nombre:', error.name);
        console.error('Código:', error.code || 'No disponible');
        console.error('Mensaje:', error.message);

        if (error.reason?.servers) {
    for (const [host, server] of error.reason.servers) {
        console.error(`Servidor: ${host}`);
        console.error('Error interno:', server.error?.message);
    }
}

        if (error.cause) {
            console.error('Causa:', error.cause);
        }

        console.error('====================================\n');

        process.exit(1);
    }
};

module.exports = connectDB;
