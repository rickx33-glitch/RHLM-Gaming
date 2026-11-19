const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`RHLM Gaming API ejecutandose en el puerto ${PORT}`);
    });
};

startServer();