const jwt = require('jsonwebtoken');

const autentikasiJWT = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Token autentikasi wajib dikirim.',
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    console.error('[autentikasiJWT] Token tidak valid:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token autentikasi tidak valid atau sudah kedaluwarsa.',
    });
  }
};

module.exports = { autentikasiJWT };
