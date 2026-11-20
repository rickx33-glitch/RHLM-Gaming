
if (process.env.NODE_ENV !== 'test') {
    require('dotenv').config();
}

const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`RHLM Gaming API ejecutandose en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar RHLM Gaming:', error.message);
        process.exit(1);
    }
};

startServer();

// Prueba de CI/CD