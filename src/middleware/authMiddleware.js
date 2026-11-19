const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            mensaje: 'Acceso no autorizado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: 'Token invalido o expirado'
        });
    }
};

module.exports = authMiddleware;