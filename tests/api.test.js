
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const os = require('os');

// Variables exclusivas para las pruebas
process.env.JWT_SECRET = 'rhlm-gaming-test-secret-2026';
process.env.JWT_EXPIRES_IN = '1d';

const app = require('../src/app');
const Usuario = require('../src/models/Usuario');
const Videojuego = require('../src/models/Videojuego');

jest.setTimeout(120000);

let mongoServer;
let token;
let videojuegoId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri(), {
        runtimeAdapters: {
            os: os
        }
    });

    await Promise.all([
        Usuario.syncIndexes(),
        Videojuego.syncIndexes()
    ]);
});

afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        await Promise.all([
            Usuario.deleteMany({}),
            Videojuego.deleteMany({})
        ]);
    }

    token = undefined;
    videojuegoId = undefined;
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

describe('API RHLM Gaming', () => {

    test('Debe registrar un usuario', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'envytest',
                email: 'envytest@example.com',
                password: 'EnvyTest618!'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.usuario.username).toBe('envytest');
    });

    test('Debe iniciar sesion y generar un token JWT', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'envytest',
                email: 'envytest@example.com',
                password: 'EnvyTest618!'
            });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identificador: 'envytest',
                password: 'EnvyTest618!'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();

        token = response.body.token;
    });

    test('Debe impedir consultar videojuegos sin autenticacion', async () => {
        const response = await request(app)
            .get('/api/videojuegos');

        expect(response.statusCode).toBe(401);
    });

    test('Debe permitir crear, consultar, actualizar y eliminar videojuegos', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'envytest',
                email: 'envytest@example.com',
                password: 'EnvyTest618!'
            });

        const login = await request(app)
            .post('/api/auth/login')
            .send({
                identificador: 'envytest',
                password: 'EnvyTest618!'
            });

        expect(login.statusCode).toBe(200);

        token = login.body.token;

        const headers = {
            Authorization: `Bearer ${token}`
        };

        const creado = await request(app)
            .post('/api/videojuegos')
            .set(headers)
            .send({
                titulo: 'Elden Ring',
                plataforma: 'PC',
                generos: ['RPG', 'Accion'],
                desarrollador: 'FromSoftware',
                anioLanzamiento: 2022
            });

        expect(creado.statusCode).toBe(201);

        videojuegoId = creado.body.videojuego._id;

        const consulta = await request(app)
            .get('/api/videojuegos')
            .set(headers);

        expect(consulta.statusCode).toBe(200);
        expect(consulta.body).toHaveLength(1);

        const actualizacion = await request(app)
            .put(`/api/videojuegos/${videojuegoId}`)
            .set(headers)
            .send({
                estado: 'Completado',
                favorito: true
            });

        expect(actualizacion.statusCode).toBe(200);
        expect(actualizacion.body.videojuego.favorito).toBe(true);

        const eliminacion = await request(app)
            .delete(`/api/videojuegos/${videojuegoId}`)
            .set(headers);

        expect(eliminacion.statusCode).toBe(200);
    });

});
