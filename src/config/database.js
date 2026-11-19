
const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI no esta definida');
    }

    console.log('Conectando a MongoDB...');

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB conectado correctamente');
};

module.exports = connectDB;
