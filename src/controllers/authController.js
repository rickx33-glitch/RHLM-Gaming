const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrar = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres'
            });
        }

        const usuarioExistente = await Usuario.findOne({
            $or: [
                { username: username.trim().toLowerCase() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (usuarioExistente) {
            return res.status(409).json({
                mensaje: 'El usuario o correo ya esta registrado'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const usuario = await Usuario.create({
            username,
            email,
            password: passwordHash
        });

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                id: usuario._id,
                username: usuario.username,
                email: usuario.email
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al registrar usuario'
        });
    }
};

const iniciarSesion = async (req, res) => {
    try {
        const { identificador, password } = req.body;

        const usuario = await Usuario.findOne({
            $or: [
                { username: identificador?.trim().toLowerCase() },
                { email: identificador?.trim().toLowerCase() }
            ]
        });

        if (!usuario || !await bcrypt.compare(password || '', usuario.password)) {
            return res.status(401).json({
                mensaje: 'Credenciales incorrectas'
            });
        }

        const token = jwt.sign(
            { id: usuario._id, username: usuario.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        res.status(200).json({
            mensaje: 'Inicio de sesion exitoso',
            token,
            usuario: {
                id: usuario._id,
                username: usuario.username,
                email: usuario.email
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al iniciar sesion'
        });
    }
};

module.exports = { registrar, iniciarSesion };