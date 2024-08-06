const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener el token del encabezado Authorization

  if (token == null) return res.sendStatus(401); // Si no hay token, responder con 401 (No autorizado)

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // Si el token es inválido o ha expirado, responder con 403 (Prohibido)

    req.user = user; // Guardar la información del usuario en la solicitud
    next(); // Pasar al siguiente middleware o ruta
  });
};

module.exports = authenticateToken;
