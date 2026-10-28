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

const hasRequiredStringFields = (data, fields, trimPassword) =>
  fields.every(
    (field) =>
      typeof data[field] === 'string' &&
      (field === 'password' && !trimPassword
        ? data[field]
        : data[field].trim())
  );

const validateBuyerRegistration = (data) =>
  hasRequiredStringFields(data, buyerFields, false);

const validateSellerRegistration = (data) =>
  hasRequiredStringFields(data, sellerFields, true);

const validateLogin = (data) =>
  typeof data.email === 'string' &&
  typeof data.password === 'string' &&
  Boolean(data.email.trim()) &&
  Boolean(data.password) &&
  ['Pembeli', 'Penjual'].includes(data.role);

module.exports = {
  validateBuyerRegistration,
  validateSellerRegistration,
  validateLogin,
};
