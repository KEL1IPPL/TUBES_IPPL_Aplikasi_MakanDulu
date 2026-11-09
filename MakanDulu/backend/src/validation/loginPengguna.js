const { isValidEmail } = require('./registrasiPengguna');

const validateLogin = (data) =>
  isValidEmail(data.email) &&
  typeof data.password === 'string' &&
  Boolean(data.password) &&
  ['Pembeli', 'Penjual'].includes(data.role);

module.exports = { validateLogin };
