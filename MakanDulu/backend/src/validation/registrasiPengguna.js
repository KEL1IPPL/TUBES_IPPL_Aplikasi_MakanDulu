const buyerFields = ['name', 'email', 'password', 'phone', 'address'];
const sellerFields = [
  'ownerName',
  'storeName',
  'email',
  'password',
  'phone',
  'storeAddress',
  'nib',
  'ktp',
  'npwp',
];
const isValidName = (name) => {
  if (typeof name !== 'string' || name.trim() === '') {
    return false;
  }

  if (name.trim().length < 3) {
    return false;
  }

  return /^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(name.trim());
};

const isValidIndonesianPhoneNumber = (phone) =>
  /^(?:08|628)[1-9][0-9]{7,10}$/.test(phone);

const isValidEmail = (email) => {
  if (typeof email !== 'string' || email.length === 0 || /\s/.test(email)) {
    return false;
  }

  const atIndex = email.indexOf('@');
  if (
    atIndex <= 0 ||
    atIndex !== email.lastIndexOf('@') ||
    atIndex === email.length - 1
  ) {
    return false;
  }

  const username = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1).toLowerCase();
  return (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(username) &&
    !username.startsWith('.') &&
    !username.endsWith('.') &&
    !username.includes('..') &&
    /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)
  );
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 8;
};

const hasRequiredStringFields = (data, fields, trimPassword) =>
  fields.every(
    (field) =>
      typeof data[field] === 'string' &&
      (field === 'password' && !trimPassword
        ? data[field]
        : data[field].trim())
  );

const isValidAlamatPembeli = (address) => {
  if (typeof address !== 'string' || address.trim() === '') {
    return false;
  }

  if (address.trim().length < 10) {
    return false;
  }

  return /^[a-zA-Z0-9\s,.]+$/.test(address.trim());
};

const isValidAlamatPenjual = (storeAddress) => {
  if (typeof storeAddress !== 'string' || storeAddress.trim() === '') {
    return false;
  }

  if (storeAddress.trim().length < 10) {
    return false;
  }

  return /^[a-zA-Z0-9\s,.]+$/.test(storeAddress.trim());
};

const validateBuyerRegistration = (data) =>
  hasRequiredStringFields(data, buyerFields, false) &&
  isValidName(data.name) &&
  isValidEmail(data.email) &&
  isValidPassword(data.password) &&
  isValidAlamatPembeli(data.address) &&
  isValidIndonesianPhoneNumber(data.phone);

const validateSellerRegistration = (data) =>
  hasRequiredStringFields(data, sellerFields, true) &&
  isValidName(data.ownerName) &&
  isValidEmail(data.email) &&
  isValidPassword(data.password) &&
  isValidIndonesianPhoneNumber(data.phone) &&
  isValidAlamatPenjual(data.storeAddress) &&
  /^\d{13}$/.test(data.nib) &&
  /^\d{16}$/.test(data.ktp) &&
  /^\d{21}$/.test(data.npwp);

module.exports = {
  validateBuyerRegistration,
  validateSellerRegistration,
  isValidPassword,
  isValidIndonesianPhoneNumber,
  isValidEmail,
};
